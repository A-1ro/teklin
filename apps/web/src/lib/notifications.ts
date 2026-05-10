import { apiFetch } from "./api";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Check whether the browser supports push notifications */
export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window;
}

/** Detect iOS (iPhone / iPad) */
export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** Check if running as installed PWA (standalone mode) */
export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as { standalone?: boolean }).standalone === true)
  );
}

/**
 * iOS notification state:
 * - "not-ios"     — not an iOS device, use normal push flow
 * - "needs-install" — iOS but not added to home screen yet
 * - "ready"       — iOS PWA, can use push normally
 */
export type IOSPushState = "not-ios" | "needs-install" | "ready";

export function getIOSPushState(): IOSPushState {
  if (!isIOS()) return "not-ios";
  if (!isStandalone()) return "needs-install";
  return "ready";
}

/** Check whether push is currently subscribed on this browser */
export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}

/** Request permission and subscribe to push notifications */
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const { publicKey } = await apiFetch<{ publicKey: string }>(
    "/api/notifications/vapid-public-key"
  );

  const registration = await navigator.serviceWorker.ready;
  const keyBytes = urlBase64ToUint8Array(publicKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyBytes.buffer as ArrayBuffer,
  });

  const raw = subscription.toJSON();
  await apiFetch("/api/notifications/subscribe", {
    method: "POST",
    body: JSON.stringify({
      endpoint: raw.endpoint,
      keys: raw.keys,
    }),
  });

  return true;
}

/** Unsubscribe from push notifications */
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }

  await apiFetch("/api/notifications/subscribe", {
    method: "DELETE",
  });
}
