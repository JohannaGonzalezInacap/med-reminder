const form = document.getElementById("medForm");
const lista = document.getElementById("listaMedicamentos");

let medicamentos = JSON.parse(localStorage.getItem("medicamentos")) || [];

// 🔒 Normalizar datos antiguos (muy importante)
medicamentos = medicamentos.map(med => ({
  ...med,
  umbral: med.umbral ?? 5,
  horarios: med.horarios || [],
  historial: (med.historial || []).map(h => {
    if (typeof h === "string") {
      return { fecha: h, hora: "00:00" };
    }
    return h;
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
   CONSUMIR
===================== */
function consumir(index) {
  const med = medicamentos[index];
  const fecha = hoy();
  const hora = ahora();

  // Buscar si ya hay consumo en la misma fecha y misma hora
  const yaRegistrado = med.historial.some(h =>
    h.fecha === fecha && h.hora === hora
  );

  if (yaRegistrado) {
    alert("⚠️ Ya se registró una toma en este horario.");
    return;
  }

  med.stock -= med.dosis;

  if (med.stock < 0) {
    med.stock = 0;
  }

  if (med.stock <= med.umbral) {
    alert(`⚠️ Quedan ${med.stock} unidades de ${med.nombre}`);
  }

  med.historial.push({
    fecha,
    hora
  });

  guardar();
  render();
  renderCalendario();
  renderFiltro();

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
  .map(h => h.trim())
  .filter(h => h);

    
  
  med.nombre = nuevoNombre;
  med.stock = Number(nuevoStock);
  med.dosis = Number(nuevaDosis);
  med.umbral = Number(nuevoUmbral);

  guardar();
  render();
  renderCalendario();
  renderFiltro();

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

}

/* =====================
    FILTRO 
===================== */
function renderFiltro() {
  const select = document.getElementById("filtroMedicamento");
  if (!select) return;

  select.innerHTML = "";

  const optTodos = document.createElement("option");
  optTodos.value = "todos";
  optTodos.textContent = "Todos";
  select.appendChild(optTodos);

  medicamentos.forEach((med, index) => {
    const opt = document.createElement("option");
    opt.value = index;
    opt.textContent = med.nombre;
    select.appendChild(opt);
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

  medicamentos.push({
    nombre,
    stock,
    dosis,
    umbral: 5,
    horarios: [],
    historial: []
  });


  guardar();
  render();
  renderCalendario();
  form.reset();
  renderFiltro();

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
            .map(h => `<li>📅 ${h.fecha} ⏰ ${h.hora}</li>`)
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

/* =====================
    NOTIFICACIONES
===================== */
if ("Notification" in window) {
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

/* =====================
    RECORDATORIOS
===================== */
function revisarRecordatorios() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const ahora = new Date();
  const fecha = hoy();
  const horaActual = ahora.toTimeString().slice(0,5);

  medicamentos.forEach(med => {
    med.horarios.forEach(horaProgramada => {

      if (horaProgramada !== horaActual) return;

      const yaTomado = med.historial.some(h =>
        h.fecha === fecha && h.hora === horaProgramada
      );

      if (yaTomado) return;

      new Notification("Recordatorio de medicamento", {
        body: `${med.nombre} - toma programada a las ${horaProgramada}`
      });

    });
  });
}
setInterval(revisarRecordatorios, 60000);
revisarRecordatorios();

