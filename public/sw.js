/*
  Basic Web Push Service Worker

  Responsibilities:
  - Receive 'push' events from the backend (web-push)
  - Display a notification
  - Handle click to focus/open the app (defaults to /notifications)

  Expected payload shape (from backend):
    { "title": "...", "message": "...", "data": { ... } }
*/

self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    // Fallback if backend sends plain text
    payload = { title: "Notification", message: event.data?.text?.() };
  }

  const title = payload.title || "Notification";
  const options = {
    body: payload.message || "",

    // Use your app logo (place in /public)
    // Firefox/Chrome will show this as the notification icon when supported.
    icon: "/ELogo.png",

    // Badge is mainly used on Android; keep it small/monochrome if possible.
    badge: "/icon-dark-32x32.png",

    data: payload.data || { url: "/notifications" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url =
    (event.notification?.data && event.notification.data.url) ||
    "/notifications";

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Focus an existing tab if possible
      for (const client of allClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            await client.navigate(url);
          }
          return;
        }
      }

      // Otherwise open a new one
      if (clients.openWindow) {
        await clients.openWindow(url);
      }
    })(),
  );
});
