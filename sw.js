importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyC97Y2EYed-MN_LfAlK_Xe4XBariy6ct1o",
  authDomain: "med-reminder-ab396.firebaseapp.com",
  projectId: "med-reminder-ab396",
  storageBucket: "med-reminder-ab396.firebasestorage.app",
  messagingSenderId: "916040866686",
  appId: "1:916040866686:web:c7cde5727063a02772312f"
});

const messaging = firebase.messaging();


const CACHE_NAME = "med-app-v3";

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
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


/* =========================
   PUSH (tus push manuales)
========================= */

self.addEventListener("push", event => {

  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data?.text() };
  }

  const title =
    data.title ||
    data.notification?.title ||
    "Recordatorio de medicamento";

  const body =
    data.body ||
    data.notification?.body ||
    "Toma programada";

  const options = {
    body,
    icon: "./icon-192.png",
    badge: "./icon-192.png"
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});


/* =========================
   Firebase background push
========================= */

messaging.onBackgroundMessage(function(payload) {

  const title =
    payload.notification?.title || "MedReminder";

  const options = {
    body: payload.notification?.body,
    icon: "./icon-192.png",
    badge: "./icon-192.png"
  };

  self.registration.showNotification(title, options);
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
