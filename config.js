(() => {
  const scope = typeof self !== "undefined" ? self : window;

  scope.APP_CONFIG = {
    firebaseConfig: {
      apiKey: "TODO_REEMPLAZA_API_KEY",
      authDomain: "TODO_REEMPLAZA_AUTH_DOMAIN",
      projectId: "TODO_REEMPLAZA_PROJECT_ID",
      storageBucket: "TODO_REEMPLAZA_STORAGE_BUCKET",
      messagingSenderId: "TODO_REEMPLAZA_MESSAGING_SENDER_ID",
      appId: "TODO_REEMPLAZA_APP_ID",
      measurementId: "OPCIONAL_MEASUREMENT_ID"
    },
    vapidKey: "TODO_REEMPLAZA_VAPID_KEY"
  };
})();
