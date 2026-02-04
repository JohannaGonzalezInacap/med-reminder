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
