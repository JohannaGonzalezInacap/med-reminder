const CACHE_NAME = "med-app-v4";

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
