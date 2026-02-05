/// <reference lib="webworker" />

/* eslint-disable no-restricted-globals */

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options: NotificationOptions = {
    body: data.body,
    icon: "/0_5_bb.png",
    badge: "/0_5_bb.png",
    data: { url: data.url || "/dashboard" },
    tag: "neriah-notification",
  };

  event.waitUntil(
    Promise.all([
      sw.registration.showNotification(data.title || "Neriah", options),
      data.badge !== undefined && "setAppBadge" in navigator
        ? (navigator as unknown as { setAppBadge: (count: number) => Promise<void> }).setAppBadge(data.badge)
        : Promise.resolve(),
    ])
  );
});

sw.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    sw.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return (client as WindowClient).focus();
          }
        }
        return sw.clients.openWindow(url);
      })
  );
});
