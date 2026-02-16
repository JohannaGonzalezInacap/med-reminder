importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js");
importScripts("./config.js");

const appConfig = self.APP_CONFIG || {};
const firebaseConfig = appConfig.firebaseConfig;

if (firebaseConfig && firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(payload => {
    const title = payload.notification?.title || "Recordatorio";
    const body = payload.notification?.body || "Tienes un aviso pendiente";
    const icon = payload.notification?.icon || "./icon-192.png";

    self.registration.showNotification(title, { body, icon });
  });
} else {
  console.warn("Firebase config no disponible en sw.js; push quedara deshabilitado");
}

const CACHE_NAME = "med-app-v6";

const ASSETS = [
  "./",
  "./index.html",
  "./registro.html",
  "./style.css",
  "./app.js",
  "./registro.js",
  "./config.js",
  "./manifest.json",
  "./offline.html",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {

  const req = event.request;

  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then(resp => {

      if (resp) return resp;

      return fetch(req).catch(() => {

        if (req.mode === "navigate") {
          return caches.match("./offline.html");
        }

        return Promise.reject();
      });
    })
  );
});
