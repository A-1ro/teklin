#!/usr/bin/env node

/**
 * Generate VAPID key pair for Web Push notifications.
 *
 * Usage: node scripts/generate-vapid-keys.mjs
 *
 * Then add the output as Cloudflare Worker secrets:
 *   npx wrangler secret put VAPID_PUBLIC_KEY
 *   npx wrangler secret put VAPID_PRIVATE_KEY
 */

import crypto from "node:crypto";

const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
  namedCurve: "prime256v1",
});

const publicJwk = publicKey.export({ format: "jwk" });
const privateJwk = privateKey.export({ format: "jwk" });

// VAPID public key = 0x04 || x || y (65 bytes uncompressed P-256 point)
const x = Buffer.from(publicJwk.x, "base64");
const y = Buffer.from(publicJwk.y, "base64");
const publicKeyRaw = Buffer.concat([Buffer.from([0x04]), x, y]);

const vapidPublicKey = publicKeyRaw
  .toString("base64")
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");

const vapidPrivateKey = privateJwk.d
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");

console.log("VAPID_PUBLIC_KEY=%s", vapidPublicKey);
console.log("VAPID_PRIVATE_KEY=%s", vapidPrivateKey);
console.log();
console.log("Add as Cloudflare Worker secrets:");
console.log("  cd apps/api");
console.log("  echo '%s' | npx wrangler secret put VAPID_PUBLIC_KEY", vapidPublicKey);
console.log("  echo '%s' | npx wrangler secret put VAPID_PRIVATE_KEY", vapidPrivateKey);
