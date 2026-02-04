# Recordatorio de Medicamentos / Medicine Reminder

## 🗒️ Descripción (ES)
Aplicación web ligera para registrar medicamentos, dosis diarias y horarios, con recordatorios locales, historial filtrable y alertas visuales. Funciona offline (PWA) y puede abrir WhatsApp con un mensaje prellenado cuando el stock llega al umbral.

## 🗒️ Description (EN)
Lightweight web app to track medicines, daily doses, and schedules with local reminders, filterable history, and visual alerts. Works offline (PWA) and can open WhatsApp with a prefilled message when stock reaches the threshold.

---
## ✨ Funcionalidades / Features
- Gestión de medicamentos: nombre, stock, dosis por día, umbral y horarios obligatorios (uno por dosis).
- Validación de horarios en formato 24h o 12h (AM/PM); se normalizan a HH:MM.
- Consumo por dosis: se descuenta solo una toma y se asigna al horario pendiente más cercano; evita duplicados.
- Alertas visuales:
  - Rojo (error): toma duplicada o configuración incorrecta.
  - Naranja (warn): dosis pendientes del día.
  - Verde (success): dosis del día completadas.
  - Umbral: texto blanco sobre fondo rojo parpadeante y opcional apertura de WhatsApp.
- Recordatorios locales: notificaciones para horarios programados (requiere permiso del navegador).
- Historial filtrable por medicamento y mes; muestra hora programada y hora real.
- Calendario mensual que marca días con tomas registradas.
- PWA: caché de assets, instalación en escritorio/móvil, funcionamiento offline.
- Alerta de umbral por WhatsApp (abre WhatsApp Web/móvil con texto prellenado; envío manual).

---
## 🛠️ Requisitos / Requirements
- Navegador moderno con soporte Service Worker y Notifications (Chrome, Edge, Firefox móvil/desktop, etc.).
- Sin backend ni build: servir como archivos estáticos (puedes abrir `index.html` o usar un servidor simple).

---
## 🚀 Puesta en marcha / Getting Started
1) Clona el repo y abre la carpeta `med-reminder`.
2) Opciones para ejecutar:
   - Abrir directamente `index.html` en el navegador, o
   - Servir con un servidor estático (ejemplo: extensiones tipo Live Server).
3) Concede permiso de notificaciones cuando el navegador lo solicite para recordatorios locales.
4) Para instalar como PWA: abre la app, usa el menú “Instalar”/“Agregar a inicio” del navegador.

### 🔑 Configuración OneSignal (notificaciones push)
- Copia `config.example.js` a `config.js` y coloca tu `ONE_SIGNAL_APP_ID` (no subas `config.js` al repo).
- Se incluye el worker en `OneSignalSDK-v16-ServiceWorker/OneSignalSDKWorker.js`; si cambias la ruta, actualiza `ONE_SIGNAL_SW_PATH` en `config.js`.
- `config.js` se carga antes de `app.js`; rota la App ID solo actualizando `config.js` en el despliegue.

---
## 📲 Uso principal / Core Usage
1) Agregar medicamento: introduce nombre, stock, dosis diaria y horarios (uno por cada dosis). El formato puede ser `08:00`, `8:00 am`, `20:30`, `8:30 pm`.
2) Registrar consumo: botón “Consumir día”. La toma se asigna al horario pendiente más cercano y descuenta solo esa dosis.
3) Alertas:
   - Duplicada: indica que ese horario ya fue registrado hoy.
   - Pendientes: muestra cuántas dosis faltan hoy.
   - Completado: confirma todas las dosis del día.
   - Umbral: alerta roja parpadeante; si activas WhatsApp, abre chat con mensaje listo.
4) Historial: filtra por medicamento y mes; se listan fecha, hora programada y hora real.
5) Calendario: muestra los días con consumos registrados; puedes filtrar por medicamento.

---
## 🔔 Alertas WhatsApp / WhatsApp Alerts
- Configura número (solo dígitos, ej. 56912345678) y activa “Enviar alerta de umbral automáticamente”.
- Al llegar al umbral, se abrirá `wa.me` en pestaña/ventana con el texto prellenado; el envío es manual (limitation del cliente WhatsApp Web/móvil).
- No se requiere backend; funciona tanto en PC como en móvil mientras haya conexión en el momento de abrir WhatsApp.

Limitación: para envíos 100% automáticos se necesitaría la API oficial de WhatsApp Business desde un servidor propio.

---
## 🔄 Persistencia / Persistence
- Datos de medicamentos, historial y ajustes se guardan en `localStorage`. 
- No hay sincronización en la nube; cada dispositivo mantiene su propio estado.

---
## 🌐 PWA y offline
- Service Worker cachea assets principales (`index.html`, `style.css`, `app.js`, `manifest.json`, `offline.html`, íconos). Cache actual `med-app-v3`.
- Modo offline: la interfaz y los datos locales funcionan sin conexión; WhatsApp y notificaciones externas requieren red.
- Fallback offline: si navegas sin conexión, verás `offline.html` para rutas de navegación.

---
## 🔧 Desarrollo / Development
- No hay dependencias ni build tools; todo es HTML/CSS/JS plano.
- Para servir localmente puedes usar cualquier servidor estático; ejemplo en Node:
  ```bash
  npx serve .
  ```
- Código principal en `app.js`; estilos en `style.css`; SW en `sw.js`; manifiesto PWA en `manifest.json`.

---
## ✅ Pruebas sugeridas / Suggested Tests
- Crear medicamento con dosis=2 y horarios “8:00 am, 8:00 pm”; registrar dos tomas y verificar alertas (pendiente/completado) y calendario/historial.
- Intentar registrar un horario repetido el mismo día → debe mostrar alerta roja y no descontar.
- Reducir stock hasta el umbral → alerta parpadeante y apertura de WhatsApp si está activado.
- Probar formatos de hora inválidos ("25:00", "13:99", texto) → debe rechazar guardado.
- Instalar como PWA y abrir offline → UI y datos locales deben seguir accesibles.

---
## ⚠️ Conocidos / Known Notes
- WhatsApp requiere interacción del usuario para enviar; la app solo prellena y abre la conversación.
- Notificaciones locales dependen de permisos del navegador; si se niegan, no se mostrarán recordatorios.
- Sin cuentas/usuario: cada dispositivo mantiene su propio almacenamiento local.
- Política de privacidad: ver `privacy-policy.md`. 
