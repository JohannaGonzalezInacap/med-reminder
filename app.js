const form = document.getElementById("medForm");
const lista = document.getElementById("listaMedicamentos");
const waNumberInput = document.getElementById("waNumber");
const waAutoInput = document.getElementById("waAuto");
const notifBtn = document.getElementById("notifBtn");
const notifStatus = document.getElementById("notifStatus");
const pushBtn = document.getElementById("pushBtn");
const pushStatus = document.getElementById("pushStatus");
const pushData = document.getElementById("pushData");

let notifWarned = false;
const APP_CONFIG = (typeof window !== "undefined" ? window.APP_CONFIG || {} : {});
const ONE_SIGNAL_APP_ID = APP_CONFIG.ONE_SIGNAL_APP_ID || "";
const ONE_SIGNAL_SW_PATH = APP_CONFIG.ONE_SIGNAL_SW_PATH || "OneSignalSDKWorker.js";
let oneSignalReady = null;

let medicamentos = JSON.parse(localStorage.getItem("medicamentos")) || [];
let settings = JSON.parse(localStorage.getItem("configApp")) || {
  whatsNumber: "",
  autoWhats: false
};
let reminderState = JSON.parse(localStorage.getItem("reminderState")) || {
  date: hoy(),
  entries: {}
};

// 🔒 Normalizar datos antiguos (muy importante)
medicamentos = medicamentos.map(med => ({
  ...med,
  umbral: med.umbral ?? 5,
  horarios: (med.horarios || [])
    .map(h => normalizeHora(h))
    .filter(Boolean),
  historial: (med.historial || []).map(h => {
    if (typeof h === "string") {
      return { fecha: h, hora: "00:00", realHora: "00:00" };
    }
    return {
      fecha: h.fecha,
      hora: h.hora,
      realHora: h.realHora || h.hora || "00:00"
    };
  })
}));




function hoy() {
  return new Date().toISOString().split("T")[0];
}

function ahora() {
  return new Date().toTimeString().slice(0,5);
}

function guardar() {
  localStorage.setItem("medicamentos", JSON.stringify(medicamentos));
}

function guardarSettings() {
  localStorage.setItem("configApp", JSON.stringify(settings));
}

function guardarReminderState() {
  localStorage.setItem("reminderState", JSON.stringify(reminderState));
}

function normalizeHora(h) {
  if (!h) return null;
  const raw = h.trim().toLowerCase();

  // AM/PM format
  const ampm = raw.match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/i);
  if (ampm) {
    let hour = Number(ampm[1]);
    const min = Number(ampm[2]);
    const isPM = ampm[3].toLowerCase() === "pm";
    if (hour < 1 || hour > 12 || min > 59) return null;
    if (hour === 12) hour = 0;
    const hh = String(isPM ? hour + 12 : hour).padStart(2, "0");
    const mm = String(min).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // 24h format
  const plain = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!plain) return null;
  const hhNum = Number(plain[1]);
  const mmNum = Number(plain[2]);
  if (hhNum > 23 || mmNum > 59) return null;
  return `${String(hhNum).padStart(2, "0")}:${String(mmNum).padStart(2, "0")}`;
}

  function normalizePhone(p) {
    if (!p) return "";
    return p.replace(/\D+/g, "");
  }

function showAlert(message, type = "warn") {
  const box = document.getElementById("alerta");
  if (!box) {
    alert(message);
    return;
  }
  box.className = `alert-box alert-${type}`;
  box.innerHTML = message;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function renderNotifStatus() {
  if (!notifStatus || !notifBtn) return;

  if (!("Notification" in window)) {
    notifStatus.textContent = "Notificaciones no disponibles en este dispositivo.";
    notifBtn.disabled = true;
    return;
  }

  const perm = Notification.permission;
  if (perm === "granted") {
    notifStatus.textContent = "Notificaciones activadas.";
    notifBtn.textContent = "Revisar permisos";
  } else if (perm === "denied") {
    notifStatus.textContent = "Bloqueadas por el navegador. Habilítalas en ajustes.";
    notifBtn.textContent = "Volver a intentar";
  } else {
    notifStatus.textContent = "Pendientes de activar.";
    notifBtn.textContent = "Activar notificaciones";
  }
}

async function ensureNotifPermission() {
  if (!("Notification" in window)) return "unsupported";

  let perm = Notification.permission;
  if (perm === "default") {
    try {
      perm = await Notification.requestPermission();
    } catch (err) {
      console.error("Permission request failed", err);
      perm = "denied";
    }
  }

  renderNotifStatus();
  return perm;
}

function renderPushUI(userId, permission) {
  if (!pushBtn || !pushStatus || !pushData) return;

  const perm = permission || Notification.permission;
  const isReady = Boolean(userId) && perm === "granted";

  if (!ONE_SIGNAL_APP_ID) {
    pushStatus.textContent = "Configura ONE_SIGNAL_APP_ID en config.js";
    pushBtn.disabled = true;
    pushData.value = "";
    return;
  }

  pushBtn.textContent = isReady ? "Suscripción activa" : "Activar recordatorios push";
  pushBtn.disabled = false;
  pushStatus.textContent = isReady
    ? "OneSignal listo. Usa el ID para enviar avisos."
    : "Pendiente de activar.";
  pushData.value = isReady ? JSON.stringify({ oneSignalUserId: userId }, null, 2) : "";
}

function ensureOneSignal() {
  if (!ONE_SIGNAL_APP_ID) {
    showAlert("Configura tu ONE_SIGNAL_APP_ID en config.js", "error");
    return null;
  }

  if (oneSignalReady) return oneSignalReady;

  if (!window.OneSignalDeferred) {
    window.OneSignalDeferred = [];
  }

  oneSignalReady = new Promise((resolve, reject) => {
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        await OneSignal.init({
          appId: ONE_SIGNAL_APP_ID,
          serviceWorkerPath: "OneSignalSDKWorker.js",
          serviceWorkerParam: { scope: "/med-reminder/" },
          allowLocalhostAsSecureOrigin: true
        });
        resolve(OneSignal);
      } catch (err) {
        console.error("OneSignal init error", err);
        reject(err);
      }
    });
  });

  return oneSignalReady;
}

async function getOneSignalState() {

  const p = ensureOneSignal();
  if (!p) return { userId: null, permission: Notification.permission };

  let OneSignal;

  try {
    OneSignal = await p;
  } catch (e) {
    return { userId: null, permission: Notification.permission };
  }

  const permission = await OneSignal.Notifications.getPermissionState();
  const userId = await OneSignal.User.getId();

  return { userId, permission };
}


async function subscribePush() {

  const p = ensureOneSignal();
  if (!p) return null;

  let OneSignal;

  try {
    OneSignal = await p;
  } catch (e) {
    return null;
  }

  try {
    await OneSignal.Notifications.requestPermission();

    const { userId, permission } = await getOneSignalState();

    if (!userId) {
      showAlert("No se pudo obtener el ID de OneSignal. Revisa permisos.", "error");
      return null;
    }

    showAlert("Suscripción creada en OneSignal. Usa el ID para enviar avisos.", "success");
    return { userId, permission };

  } catch (err) {
    console.error("OneSignal subscribe error", err);
    showAlert("No se pudo completar la suscripción OneSignal.", "error");
    return null;
  }
}



async function dispatchNotification(title, body) {
  if (!("Notification" in window)) return false;

  const perm = Notification.permission === "granted"
    ? "granted"
    : await ensureNotifPermission();

  if (perm !== "granted") return false;

  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg?.showNotification) {
      await reg.showNotification(title, { body });
      return true;
    }
  } catch (err) {
    console.error("SW notification error", err);
  }

  try {
    new Notification(title, { body });
    return true;
  } catch (err) {
    console.error("Window notification error", err);
  }

  return false;
}

function aMinutos(hhmm) {
  const norm = normalizeHora(hhmm);
  if (!norm) return null;
  const [h, m] = norm.split(":").map(Number);
  return h * 60 + m;
}

function reminderKey(medIdx, hora, fecha) {
  return `${fecha}|${medIdx}|${hora}`;
}

function clearReminderEntry(medIdx, hora, fecha) {
  const key = reminderKey(medIdx, hora, fecha);
  if (reminderState.entries[key]) {
    delete reminderState.entries[key];
    guardarReminderState();
  }
}

function sendWhatsUmbral(med) {
  const phone = normalizePhone(settings.whatsNumber);
  if (!phone) {
    showAlert("Configura un número de WhatsApp para enviar la alerta de umbral.", "error");
    return;
  }
  const text = encodeURIComponent(`⚠️ Alerta de stock bajo: ${med.nombre}. Stock: ${med.stock}. Umbral: ${med.umbral}.`);
  const url = `https://wa.me/${phone}?text=${text}`;
  window.open(url, "_blank");
}

function consumosDeHoy(med) {
  const fecha = hoy();
  return med.historial.filter(h => h.fecha === fecha);
}

/* =====================
   CALENDARIO
===================== */
function renderCalendario() {
  const contenedor = document.getElementById("calendario");
  const select = document.getElementById("filtroMedicamento");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  const filtro = select ? select.value : "todos";

  const fechaActual = new Date();
  const year = fechaActual.getFullYear();
  const month = fechaActual.getMonth();

  const diasMes = new Date(year, month + 1, 0).getDate();

  for (let dia = 1; dia <= diasMes; dia++) {
    const fecha = `${year}-${String(month + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    const div = document.createElement("div");
    div.className = "dia";
    div.textContent = dia;

    let huboConsumo = false;

    if (filtro === "todos") {
      huboConsumo = medicamentos.some(med =>
        med.historial.some(h => h.fecha === fecha)
      );
    } else {
      const med = medicamentos[Number(filtro)];
      if (med) {
        huboConsumo = med.historial.some(h => h.fecha === fecha);
      }
    }

    if (huboConsumo) {
      div.classList.add("consumido");
    }

    contenedor.appendChild(div);
  }
}

/* =====================
   HISTORIAL LISTADO
===================== */
function renderHistorialLista() {
  const cont = document.getElementById("historialLista");
  const selMed = document.getElementById("filtroHistMed");
  const selMes = document.getElementById("filtroHistMes");
  if (!cont) return;

  const filtroMed = selMed ? selMed.value : "todos";
  const filtroMes = selMes ? selMes.value : ""; // formato YYYY-MM

  cont.innerHTML = "";

  const meds = filtroMed === "todos"
    ? medicamentos
    : medicamentos.filter((_, idx) => String(idx) === filtroMed);

  meds.forEach((med, idx) => {
    const entradas = med.historial
      .filter(h => !filtroMes || (h.fecha && h.fecha.startsWith(filtroMes)))
      .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));

    const titulo = document.createElement("h3");
    titulo.textContent = med.nombre;
    cont.appendChild(titulo);

    if (!entradas.length) {
      const vacio = document.createElement("div");
      vacio.innerHTML = "<em>Sin registros</em>";
      cont.appendChild(vacio);
      return;
    }

    const ul = document.createElement("ul");
    entradas.forEach(h => {
      const li = document.createElement("li");
      const detalleReal = h.realHora && h.realHora !== h.hora
        ? ` (real ${h.realHora})`
        : "";
      li.textContent = `${h.fecha} ${h.hora}${detalleReal}`;
      ul.appendChild(li);
    });
    cont.appendChild(ul);
  });
}


/* =====================
   CONSUMIR
===================== */
function consumir(index) {
  const med = medicamentos[index];
  const fecha = hoy();
  const horaReal = ahora();

  if (med.horarios.length !== (med.dosis || 0)) {
    showAlert("Configura horarios para cada dosis diaria antes de registrar la toma.", "error");
    return;
  }

  const tomasHoy = consumosDeHoy(med);
  const totalDiario = med.dosis || 1;
  const perToma = med.horarios.length
    ? Math.max(1, Math.ceil(totalDiario / med.horarios.length))
    : 1;
  const maxTomasHoy = med.horarios.length || totalDiario;

  if (tomasHoy.length >= maxTomasHoy) {
    showAlert("Las tomas del día ya fueron registradas.", "success");
    return;
  }

  let horaAsignada = horaReal;

  if (med.horarios.length) {
    const pendientes = med.horarios.filter(horario => !tomasHoy.some(t => t.hora === horario));

    if (pendientes.length > 0) {
      const objetivo = pendientes.reduce((acc, horario) => {
        const diff = Math.abs(aMinutos(horario) - aMinutos(horaReal));
        if (!acc || diff < acc.diff) return { horario, diff };
        return acc;
      }, null);

      horaAsignada = objetivo?.horario || horaReal;
    } else {
      showAlert("Las tomas del día ya fueron registradas.", "success");
      return;
    }
  }

  const duplicada = tomasHoy.some(h => h.hora === horaAsignada && med.horarios.includes(horaAsignada));
  if (duplicada) {
    showAlert("Esa toma ya fue registrada en el horario correspondiente.", "error");
    return;
  }

  med.stock -= perToma;
  if (med.stock < 0) {
    med.stock = 0;
  }

  if (med.stock <= med.umbral) {
    showAlert(`⚠️ Quedan ${med.stock} unidades de ${med.nombre}`, "umbral");
    if (settings.autoWhats) {
      sendWhatsUmbral(med);
    }
  }

  med.historial.push({
    fecha,
    hora: horaAsignada,
    realHora: horaReal
  });

  clearReminderEntry(index, horaAsignada, fecha);

  const pendientes = Math.max(0, maxTomasHoy - (tomasHoy.length + 1));
  if (pendientes > 0) {
    showAlert(`Faltan ${pendientes} dosis de hoy para ${med.nombre}.`, "warn");
  } else {
    showAlert(`Tomas del día de ${med.nombre} completadas.`, "success");
  }

  guardar();
  render();
  renderCalendario();
  renderFiltro();
  renderHistorialLista();

}


/* =====================
    EDITAR                                                          
===================== */
function editar(index) {
  const med = medicamentos[index];

  const nuevoNombre = prompt("Nombre:", med.nombre);
  if (nuevoNombre === null) return;

  const nuevoStock = prompt("Stock:", med.stock);
  if (nuevoStock === null) return;

  const nuevaDosis = prompt("Dosis diaria:", med.dosis);
  if (nuevaDosis === null) return;

  const nuevoUmbral = prompt("Umbral de alerta:", med.umbral);
  if (nuevoUmbral === null) return;
  const nuevosHorarios = prompt(
  "Horarios (HH:MM separados por coma)",
  med.horarios.join(",")
);

if (nuevosHorarios === null) return;

med.horarios = nuevosHorarios
  .split(",")
  .map(h => normalizeHora(h))
  .filter(h => h);

  if (med.horarios.length !== Number(nuevaDosis)) {
    showAlert("La cantidad de horarios debe ser igual a las dosis diarias.", "error");
    return;
  }

    
  
  med.nombre = nuevoNombre;
  med.stock = Number(nuevoStock);
  med.dosis = Number(nuevaDosis);
  med.umbral = Number(nuevoUmbral);

  guardar();
  render();
  renderCalendario();
  renderFiltro();
  renderHistorialLista();

}

/* =====================
   ELIMINAR
===================== */
function eliminar(index) {
  const ok = confirm("¿Seguro que quieres eliminar este medicamento?");

  if (!ok) return;

  medicamentos.splice(index, 1);

  guardar();
  render();
  renderCalendario();
  renderFiltro();
  renderHistorialLista();

}

/* =====================
    FILTRO 
===================== */
function renderFiltro() {
  const select = document.getElementById("filtroMedicamento");
  const selectHist = document.getElementById("filtroHistMed");
  if (!select) return;

  select.innerHTML = "";

  if (selectHist) selectHist.innerHTML = "";

  const optTodos = document.createElement("option");
  optTodos.value = "todos";
  optTodos.textContent = "Todos";
  select.appendChild(optTodos);
  if (selectHist) selectHist.appendChild(optTodos.cloneNode(true));

  medicamentos.forEach((med, index) => {
    const opt = document.createElement("option");
    opt.value = index;
    opt.textContent = med.nombre;
    select.appendChild(opt);

    if (selectHist) {
      const optH = document.createElement("option");
      optH.value = index;
      optH.textContent = med.nombre;
      selectHist.appendChild(optH);
    }
  });
}

/* =====================
   FORM
===================== */
form.addEventListener("submit", e => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const stock = Number(document.getElementById("stock").value);
  const dosis = Number(document.getElementById("dosis").value);

  const horariosStr = prompt("Horarios (HH:MM separados por coma, acepta AM/PM)", "");
  if (horariosStr === null) return;

  const horarios = horariosStr
    .split(",")
    .map(h => normalizeHora(h))
    .filter(Boolean);

  if (horarios.length !== dosis) {
    showAlert("La cantidad de horarios debe ser igual a las dosis diarias.", "error");
    return;
  }

  medicamentos.push({
    nombre,
    stock,
    dosis,
    umbral: 5,
    horarios,
    historial: []
  });


  guardar();
  render();
  renderCalendario();
  form.reset();
  renderFiltro();
  renderHistorialLista();

});

/* =====================
   INIT
===================== */
function render() {
  lista.innerHTML = "";

  medicamentos.forEach((med, index) => {
    const li = document.createElement("li");

    const historialHTML = med.historial.length
      ? `<ul>
          ${med.historial
            .map(h => {
              const detalleReal = h.realHora && h.realHora !== h.hora
                ? ` (real ${h.realHora})`
                : "";
              return `<li>📅 ${h.fecha} ⏰ ${h.hora}${detalleReal}</li>`;
            })
            .join("")}
        </ul>`
      : "<em>Sin consumo registrado</em>";

    li.innerHTML = `
      <strong>${med.nombre}</strong><br>
      Stock: ${med.stock}<br>
      Dosis diaria: ${med.dosis}<br>
      Umbral alerta: ${med.umbral}<br>
      Horarios: ${med.horarios.length ? med.horarios.join(", ") : "No definidos"}<br>


      <button onclick="consumir(${index})">Consumir día</button>
      <button onclick="editar(${index})">✏️ Editar</button>
      <button onclick="eliminar(${index})">🗑️ Eliminar</button>

      <div style="margin-top:8px">
        <strong>Historial:</strong>
        ${historialHTML}
      </div>
    `;

    lista.appendChild(li);
  });
}
;
renderFiltro();
render();
renderCalendario();
const filtro = document.getElementById("filtroMedicamento");
if (filtro) {
  filtro.addEventListener("change", renderCalendario);
}
const filtroHistMed = document.getElementById("filtroHistMed");
const filtroHistMes = document.getElementById("filtroHistMes");
if (filtroHistMed) {
  filtroHistMed.addEventListener("change", renderHistorialLista);
}
if (filtroHistMes) {
  filtroHistMes.addEventListener("change", renderHistorialLista);
}
renderHistorialLista();

if (waNumberInput) {
  waNumberInput.value = settings.whatsNumber;
  waNumberInput.addEventListener("change", () => {
    settings.whatsNumber = normalizePhone(waNumberInput.value);
    waNumberInput.value = settings.whatsNumber;
    guardarSettings();
  });
}

if (waAutoInput) {
  waAutoInput.checked = settings.autoWhats;
  waAutoInput.addEventListener("change", () => {
    settings.autoWhats = waAutoInput.checked;
    guardarSettings();
  });
}

renderPushUI(null, Notification.permission);


if (pushBtn) {
  pushBtn.addEventListener("click", async () => {
    const state = await getOneSignalState();
    if (state.userId) {
      renderPushUI(state.userId, state.permission);
      showAlert("Ya tienes una suscripción activa en OneSignal.", "success");
      if (pushData) pushData.value = JSON.stringify({ oneSignalUserId: state.userId }, null, 2);
      return;
    }

    const sub = await subscribePush();
    if (sub) {
      renderPushUI(sub.userId, sub.permission);
      if (pushData) pushData.value = JSON.stringify({ oneSignalUserId: sub.userId }, null, 2);
    }
  });
}

/* =====================
    NOTIFICACIONES
===================== */
renderNotifStatus();

if (notifBtn) {
  notifBtn.addEventListener("click", async () => {
    const perm = await ensureNotifPermission();
    if (perm !== "granted" && !notifWarned) {
      showAlert("Activa las notificaciones del navegador para ver recordatorios en el móvil.", "error");
      notifWarned = true;
    }
  });
}

// Al cargar, intenta recuperar estado de OneSignal y mostrar el ID si existe
getOneSignalState().then(state => {
  renderPushUI(state.userId, state.permission);
  if (state.userId && pushData) {
    pushData.value = JSON.stringify({ oneSignalUserId: state.userId }, null, 2);
  }
});

/* =====================
    RECORDATORIOS
===================== */
function revisarRecordatorios() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const now = new Date();
  const fecha = hoy();
  const horaActual = now.toTimeString().slice(0,5);
  const minutosActual = aMinutos(horaActual);
  if (reminderState.date !== fecha) {
    reminderState = { date: fecha, entries: {} };
    guardarReminderState();
  }

  medicamentos.forEach((med, medIdx) => {
    med.horarios.forEach(horaProgramada => {
      const minutosProg = aMinutos(horaProgramada);
      if (minutosProg === null || minutosActual === null) return;

      const yaTomado = med.historial.some(h =>
        h.fecha === fecha && h.hora === horaProgramada
      );

      if (yaTomado) {
        clearReminderEntry(medIdx, horaProgramada, fecha);
        return;
      }

      const diff = minutosActual - minutosProg;
      if (diff < 0) return; // Aún no es la hora

      const key = reminderKey(medIdx, horaProgramada, fecha);
      const entry = reminderState.entries[key] || { attempts: 0, lastMin: null };

      if (entry.attempts >= 3) return;

      const puedeEnviar = entry.lastMin === null || (minutosActual - entry.lastMin) >= 5;
      if (!puedeEnviar) return;

      dispatchNotification(
        "Recordatorio de medicamento",
        `${med.nombre} - toma programada a las ${horaProgramada}`
      ).then(ok => {
        if (!ok && !notifWarned) {
          showAlert("El navegador bloqueó las notificaciones. Actívalas para recibir recordatorios en el móvil.", "error");
          notifWarned = true;
        }
      });

      reminderState.entries[key] = {
        attempts: entry.attempts + 1,
        lastMin: minutosActual
      };
      guardarReminderState();
    });
  });
}
setInterval(revisarRecordatorios, 60000);
revisarRecordatorios();


