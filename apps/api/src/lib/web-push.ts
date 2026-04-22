/**
 * Lightweight Web Push implementation for Cloudflare Workers.
 * Uses Web Crypto API — no Node.js dependencies.
 *
 * Implements:
 *  - VAPID authentication (RFC 8292, ES256 JWT)
 *  - Push message encryption (RFC 8291, aes128gcm)
 */

// ---------------------------------------------------------------------------
// Base64url helpers
// ---------------------------------------------------------------------------

function base64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function concat(...buffers: (Uint8Array | ArrayBuffer)[]): Uint8Array {
  const arrays = buffers.map((b) =>
    b instanceof Uint8Array ? b : new Uint8Array(b)
  );
  const len = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(len);
  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
}

// ---------------------------------------------------------------------------
// VAPID JWT (ES256)
// ---------------------------------------------------------------------------

async function importVapidPrivateKey(
  publicKeyB64: string,
  privateKeyB64: string
): Promise<CryptoKey> {
  const pubBytes = base64urlDecode(publicKeyB64);
  // Uncompressed EC point: 0x04 || x(32) || y(32)
  const x = base64urlEncode(pubBytes.slice(1, 33));
  const y = base64urlEncode(pubBytes.slice(33, 65));
  const d = privateKeyB64; // Already base64url

  return crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x, y, d, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

async function createVapidAuth(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ authorization: string; cryptoKey: string }> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const expiry = Math.floor(Date.now() / 1000) + 12 * 3600;

  const header = base64urlEncode(
    new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" }))
  );
  const payload = base64urlEncode(
    new TextEncoder().encode(
      JSON.stringify({
        aud: audience,
        exp: expiry,
        sub: "mailto:hello@teklin.app",
      })
    )
  );

  const signingInput = new TextEncoder().encode(`${header}.${payload}`);
  const key = await importVapidPrivateKey(vapidPublicKey, vapidPrivateKey);

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    signingInput
  );

  const token = `${header}.${payload}.${base64urlEncode(sig)}`;

  return {
    authorization: `vapid t=${token}, k=${vapidPublicKey}`,
    cryptoKey: vapidPublicKey,
  };
}

// ---------------------------------------------------------------------------
// Push Encryption (RFC 8291 — aes128gcm)
// ---------------------------------------------------------------------------

async function hkdfDerive(
  salt: Uint8Array | ArrayBuffer,
  ikm: Uint8Array | ArrayBuffer,
  info: Uint8Array,
  length: number
): Promise<ArrayBuffer> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    ikm,
    "HKDF",
    false,
    ["deriveBits"]
  );
  return crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    baseKey,
    length * 8
  );
}

async function encryptPayload(
  p256dhB64: string,
  authB64: string,
  payload: string
): Promise<Uint8Array> {
  const subscriberPublicKeyBytes = base64urlDecode(p256dhB64);
  const authSecret = base64urlDecode(authB64);
  const payloadBytes = new TextEncoder().encode(payload);

  // Import subscriber's public key
  const subscriberKey = await crypto.subtle.importKey(
    "raw",
    subscriberPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Generate ephemeral ECDH key pair
  const ephemeralKeys = (await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  )) as CryptoKeyPair;

  // Derive shared secret via ECDH
  // Note: runtime expects "public" but @cloudflare/workers-types defines "$public".
  // Use runtime-correct key and cast to satisfy the type checker.
  const ecdhParams = { name: "ECDH" } as SubtleCryptoDeriveKeyAlgorithm;
  (ecdhParams as unknown as Record<string, unknown>)["public"] = subscriberKey;
  const sharedSecret = await crypto.subtle.deriveBits(
    ecdhParams,
    ephemeralKeys.privateKey,
    256
  );

  // Export ephemeral public key (uncompressed, 65 bytes)
  const ephemeralPublicKey = new Uint8Array(
    (await crypto.subtle.exportKey("raw", ephemeralKeys.publicKey)) as ArrayBuffer
  );

  // Build info for IKM derivation:
  // "WebPush: info\0" || ua_public || as_public
  const keyInfoHeader = new TextEncoder().encode("WebPush: info\0");
  const keyInfo = concat(keyInfoHeader, subscriberPublicKeyBytes, ephemeralPublicKey);

  // Derive IKM: HKDF(salt=auth, IKM=sharedSecret, info=keyInfo, 32)
  const ikm = await hkdfDerive(authSecret, sharedSecret, keyInfo, 32);

  // Generate random 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive content encryption key (16 bytes)
  const cekInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const cek = await hkdfDerive(salt, ikm, cekInfo, 16);

  // Derive nonce (12 bytes)
  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");
  const nonce = await hkdfDerive(salt, ikm, nonceInfo, 12);

  // Pad payload: content || 0x02 (delimiter)
  const paddedPayload = concat(payloadBytes, new Uint8Array([2]));

  // Encrypt with AES-128-GCM
  const aesKey = await crypto.subtle.importKey(
    "raw",
    cek,
    "AES-GCM",
    false,
    ["encrypt"]
  );
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    aesKey,
    paddedPayload
  );

  // Build aes128gcm body:
  // salt(16) || rs(4, big-endian) || idlen(1) || keyid(65) || ciphertext
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);
  const idlen = new Uint8Array([65]);

  return concat(salt, rs, idlen, ephemeralPublicKey, ciphertext);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushResult {
  success: boolean;
  status: number;
  /** true if the subscription is expired/invalid and should be removed */
  shouldRemove: boolean;
}

/**
 * Send a push notification to a single subscription.
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<PushResult> {
  const { authorization } = await createVapidAuth(
    subscription.endpoint,
    vapidPublicKey,
    vapidPrivateKey
  );

  const body = await encryptPayload(
    subscription.p256dh,
    subscription.auth,
    payload
  );

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      TTL: "86400",
    },
    body,
  });

  return {
    success: response.status === 201,
    status: response.status,
    shouldRemove: response.status === 404 || response.status === 410,
  };
}
