const form = document.getElementById("medForm");
const lista = document.getElementById("listaMedicamentos");

let medicamentos = JSON.parse(localStorage.getItem("medicamentos")) || [];

// 🔒 Normalizar datos antiguos (muy importante)
medicamentos = medicamentos.map(med => ({
  ...med,
  historial: med.historial || []
}));

function hoy() {
  return new Date().toISOString().split("T")[0];
}

function guardar() {
  localStorage.setItem("medicamentos", JSON.stringify(medicamentos));
}

/* =====================
   RENDER LISTA
===================== */
function render() {
  lista.innerHTML = "";

  medicamentos.forEach((med, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${med.nombre}</strong><br>
      Stock: ${med.stock}<br>
      Dosis diaria: ${med.dosis}<br>
      <button onclick="consumir(${index})">Consumir día</button>
    `;

    lista.appendChild(li);
  });
}

/* =====================
   CALENDARIO
===================== */
function renderCalendario() {
  const contenedor = document.getElementById("calendario");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  const fechaActual = new Date();
  const year = fechaActual.getFullYear();
  const month = fechaActual.getMonth();

  const diasMes = new Date(year, month + 1, 0).getDate();

  for (let dia = 1; dia <= diasMes; dia++) {
    const fecha = `${year}-${String(month + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    const div = document.createElement("div");
    div.className = "dia";
    div.textContent = dia;

    const huboConsumo = medicamentos.some(med =>
      med.historial.includes(fecha)
    );

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

  if (med.stock <= 0) {
    alert("❌ No queda stock disponible");
    return;
  }

  const fecha = hoy();
  med.stock -= med.dosis;

  if (!med.historial.includes(fecha)) {
    med.historial.push(fecha);
  }

  if (med.stock <= 5) {
    alert(`⚠️ Quedan ${med.stock} unidades de ${med.nombre}`);
  }

  if (med.stock < 0) {
    med.stock = 0;
  }

  guardar();
  render();
  renderCalendario();
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
    historial: []
  });

  guardar();
  render();
  renderCalendario();
  form.reset();
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
            .map(fecha => `<li>📅 ${fecha}</li>`)
            .join("")}
        </ul>`
      : "<em>Sin consumo registrado</em>";

    li.innerHTML = `
      <strong>${med.nombre}</strong><br>
      Stock: ${med.stock}<br>
      Dosis diaria: ${med.dosis}<br>

      <button onclick="consumir(${index})">Consumir día</button>

      <div style="margin-top:8px">
        <strong>Historial:</strong>
        ${historialHTML}
      </div>
    `;

    lista.appendChild(li);
  });
}
;
renderCalendario();
