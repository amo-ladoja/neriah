declare const self: ServiceWorkerGlobalScope;

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options: NotificationOptions = {
    body: data.body,
    icon: "/0_5_bb.png",
    badge: "/0_5_bb.png",
    data: { url: data.url || "/dashboard" },
    tag: "neriah-notification",
    renotify: true,
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || "Neriah", options),
      data.badge !== undefined && "setAppBadge" in navigator
        ? (navigator as unknown as { setAppBadge: (count: number) => Promise<void> }).setAppBadge(data.badge)
        : Promise.resolve(),
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    (self as unknown as { clients: Clients }).clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return (client as WindowClient).focus();
          }
        }
        return (self as unknown as { clients: Clients }).clients.openWindow(url);
      })
  );
});
