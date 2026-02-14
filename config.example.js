// Copia este archivo a config.js y coloca tus valores reales.
// No subas config.js al repositorio.

(() => {
  const scope = typeof self !== "undefined" ? self : window;

  scope.APP_CONFIG = {
    // Configuración pública de Firebase Web
    firebaseConfig: {
      apiKey: "REEMPLAZA_API_KEY",
      authDomain: "REEMPLAZA_AUTH_DOMAIN",
      projectId: "REEMPLAZA_PROJECT_ID",
      storageBucket: "REEMPLAZA_STORAGE_BUCKET",
      messagingSenderId: "REEMPLAZA_MESSAGING_SENDER_ID",
      appId: "REEMPLAZA_APP_ID",
      measurementId: "OPCIONAL_MEASUREMENT_ID"
    },
    // VAPID key de Web Push (Settings -> Cloud Messaging)
    vapidKey: "REEMPLAZA_VAPID_KEY"
  };
})();
