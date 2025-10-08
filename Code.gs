const SHEET_NAME = "Clientes";

function doGet(e) {
  const action = e.parameter.action;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  switch (action) {
    case "register":
      return registerUser(sheet, e);
    case "login":
      return loginUser(sheet, e);
    case "addNutrias":
      return addNutrias(sheet, e);
    case "getUserByCode":
      return getUserByCode(sheet, e);
    default:
      return ContentService.createTextOutput("Invalid action");
  }
}

function registerUser(sheet, e) {
  const name = e.parameter.name?.trim();
  const phone = e.parameter.phone?.trim();

  if (!name || !phone) {
    return ContentService.createTextOutput("❌ Faltan datos (nombre o teléfono).");
  }

  const data = sheet.getDataRange().getValues();
  const exists = data.some(row => row[2]?.toString().trim() === phone);

  if (exists) {
    return ContentService.createTextOutput("⚠️ Número ya registrado.");
  }

  const code = generateUniqueCode(sheet);
  const password = generatePassword();

  // Columna 8 (índice 8) será para la contraseña
  sheet.appendRow([
    new Date(),
    name,
    phone,
    code,
    0, "-", "-", "No", password
  ]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${code}`;
  const result = { status: "ok", code, qrUrl, password };

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function generateUniqueCode(sheet) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code;
  const data = sheet.getDataRange().getValues().map(r => r[3]);
  do {
    code = "SL-" + Array.from({ length: 5 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  } while (data.includes(code));
  return code;
}

function generatePassword() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function loginUser(sheet, e) {
  const phone = e.parameter.phone?.trim();
  const password = e.parameter.password?.trim();

  if (!phone || !password) {
    return ContentService.createTextOutput("❌ Faltan datos (teléfono o contraseña).");
  }

  const data = sheet.getDataRange().getValues();
  const user = data.find(row => row[2]?.toString().trim() === phone);

  if (!user) {
    return ContentService.createTextOutput("❌ Usuario no encontrado.");
  }

  if (user[8] !== password) {
    return ContentService.createTextOutput("❌ Contraseña incorrecta.");
  }

  const result = {
    name: user[1],
    phone: user[2],
    code: user[3],
    nutrias: user[4],
    lastVisit: user[5],
    lastPurchase: user[6],
    rewards: user[7]
  };

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Resto de funciones (addNutrias y getUserByCode) permanecen igual


function addNutrias(sheet, e) {
  const code = e.parameter.code?.trim();
  const amount = parseFloat(e.parameter.amount);

  if (!code || isNaN(amount)) {
    return ContentService.createTextOutput("❌ Datos inválidos.");
  }

  const rows = sheet.getDataRange().getValues();

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][3] === code) {
      const nutrias = Number(rows[i][4]) + Math.floor(amount / 10);
      const reward = nutrias >= 100 ? "Sí" : rows[i][7];
      sheet.getRange(i + 1, 5).setValue(nutrias);
      sheet.getRange(i + 1, 6).setValue(new Date());
      sheet.getRange(i + 1, 7).setValue(`Compra $${amount}`);
      sheet.getRange(i + 1, 8).setValue(reward);

      return ContentService.createTextOutput(`🐾 ${Math.floor(amount / 10)} nutrias asignadas.`);
    }
  }

  return ContentService.createTextOutput("❌ Código no encontrado.");
}

function getUserByCode(sheet, e) {
  const code = e.parameter.code?.trim();
  const data = sheet.getDataRange().getValues();
  const user = data.find(row => row[3] === code);
  if (!user) return ContentService.createTextOutput("❌ No encontrado.");

  const result = {
    name: user[1],
    phone: user[2],
    code: user[3],
    nutrias: user[4],
    rewards: user[7]
  };

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
