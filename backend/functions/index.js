const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

const admin = require("firebase-admin");

setGlobalOptions({ maxInstances: 10 });

// Inicializa Firebase Admin
admin.initializeApp();

// Endpoint para enviar notificaciones push
exports.sendPush = onRequest(async (req, res) => {

  // Permitir CORS para tu frontend en GitHub Pages
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {

    const { token, title, body } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Falta token" });
    }

    const message = {
      token: token,
      notification: {
        title: title || "Recordatorio",
        body: body || "Es hora de tu medicamento"
      },
      webpush: {
        fcmOptions: {
          link: "https://johannagonzalezinacap.github.io/med-reminder/"
        }
      }
    };

    const response = await admin.messaging().send(message);

    return res.json({
      success: true,
      response
    });

  } catch (error) {

    logger.error(error);

    return res.status(500).json({
      error: error.message
    });
  }

});

// Registrar token FCM en Firestore
exports.registerToken = onRequest(async (req, res) => {

  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    const { token } = req.body || {};
    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Falta token" });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const docRef = admin.firestore().collection("tokens").doc(token);
    await docRef.set({ token, updatedAt: now, createdAt: now }, { merge: true });

    return res.json({ success: true });

  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: error.message });
  }
});

// Enviar notificaciones a todos los tokens registrados (máx 500 por batch)
exports.sendPushToAll = onRequest(async (req, res) => {

  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  const title = req.body?.title || "Recordatorio";
  const body = req.body?.body || "Es hora de tu medicamento";
  const link = req.body?.link || "https://johannagonzalezinacap.github.io/med-reminder/";

  try {
    const snap = await admin.firestore().collection("tokens").limit(500).get();
    const tokens = snap.docs.map(d => d.id);

    if (!tokens.length) {
      return res.json({ success: true, sent: 0, message: "No hay tokens registrados" });
    }

    const multicast = {
      tokens,
      notification: { title, body },
      webpush: { fcmOptions: { link } }
    };

    const response = await admin.messaging().sendEachForMulticast(multicast);

    const invalidIdx = response.responses
      .map((r, idx) => ({ r, idx }))
      .filter(x => !x.r.success && x.r.error?.code === "messaging/registration-token-not-registered")
      .map(x => x.idx);

    if (invalidIdx.length) {
      const batch = admin.firestore().batch();
      invalidIdx.forEach(i => {
        const t = tokens[i];
        if (t) batch.delete(admin.firestore().collection("tokens").doc(t));
      });
      await batch.commit();
    }

    return res.json({
      success: true,
      requested: tokens.length,
      sent: response.successCount,
      failed: response.failureCount
    });

  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: error.message });
  }
});
