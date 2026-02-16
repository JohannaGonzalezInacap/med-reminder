(() => {
  const form = document.getElementById("registerForm");
  const nombre = document.getElementById("regNombre");
  const apellido = document.getElementById("regApellido");
  const edad = document.getElementById("regEdad");
  const telefono = document.getElementById("regTelefono");
  const ciudad = document.getElementById("regCiudad");
  const STORAGE_KEY = "userProfile";

  function setInitialValues() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.nombre) nombre.value = data.nombre;
      if (data.apellido) apellido.value = data.apellido;
      if (data.edad) edad.value = data.edad;
      if (data.telefono) telefono.value = data.telefono;
      if (data.ciudad) ciudad.value = data.ciudad;
    } catch (err) {
      console.warn("No se pudo cargar el perfil previo", err);
    }
  }

  function normalizeTelefono(value) {
    if (!value) return "";
    return value.replace(/\D+/g, "");
  }

  function validate() {
    if (!nombre.value.trim() || !apellido.value.trim()) return false;
    const edadNum = Number(edad.value);
    if (!edad.value || isNaN(edadNum) || edadNum < 1 || edadNum > 120) return false;
    const phone = normalizeTelefono(telefono.value);
    if (!phone) return false;
    return true;
  }

  async function ensureServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch (err) {
      console.warn("No se pudo registrar el service worker en registro", err);
    }
  }

  form?.addEventListener("submit", event => {
    event.preventDefault();
    if (!validate()) {
      alert("Completa todos los campos obligatorios correctamente.");
      return;
    }

    const payload = {
      nombre: nombre.value.trim(),
      apellido: apellido.value.trim(),
      edad: Number(edad.value),
      telefono: normalizeTelefono(telefono.value),
      ciudad: ciudad.value.trim()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      window.location.href = "./index.html";
    } catch (err) {
      console.error("No se pudo guardar el perfil", err);
      alert("No se pudo guardar el registro en este dispositivo.");
    }
  });

  setInitialValues();
  ensureServiceWorker();
})();
