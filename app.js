// app.js - interacción básica cliente
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3ZOGhDlhLmyI8nhrq5KVBkJye-Q_9c6k4x1giUEnapr9llWv4j-adzVVazGJqRdY6aA/exec"; // Reemplaza con la URL de tu WebApp de Apps Script

async function register() {
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  if (!name || !phone) return alert("Completa todos los campos.");

  try {
    const res = await fetch(`${SCRIPT_URL}?action=register&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}`);
    const data = await res.json();

    if (data.status === "ok") {
      // mostrar código y QR
      document.body.innerHTML = `
      <div class="container">
        <img src="assets/logo.png" class="logo" alt="Saint Latte">
        <h2>¡Gracias por registrarte, ${name}!</h2>
        <p>Tu código único:</p>
        <h3>${data.code}</h3>
        <img src="${data.qrUrl}" alt="QR de cliente">
        <p class="small">Guarda este QR. También lo encontrarás en tu dashboard.</p>
        <p><a href="index.html">Volver al inicio</a></p>
      </div>`;
    } else {
      alert(data);
    }
  } catch (e) {
    alert("Tu número ya fue registrado!");
    console.error(e);
  }
}

async function login() {
  const phone = document.getElementById("loginPhone").value.trim();
  if (!phone) return alert("Ingresa tu número.");

  try {
    const res = await fetch(`${SCRIPT_URL}?action=login&phone=${encodeURIComponent(phone)}`);
    const text = await res.text();
    // try parse JSON
    try {
      const data = JSON.parse(text);
      if (data.name) {
        localStorage.setItem("user", JSON.stringify(data));
        window.location.href = "dashboard.html";
      } else {
        alert("Usuario no encontrado.");
      }
    } catch (err) {
      alert(text);
    }
  } catch (e) {
    alert("Error contactando el servidor.");
    console.error(e);
  }
}
