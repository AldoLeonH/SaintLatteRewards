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
  const name = e.parameter.name;
  const phone = e.parameter.phone;

  const data = sheet.getDataRange().getValues();
  // check duplicates (phone)
  const exists = data.some(function(row) { return row[2] === phone; });

  if (exists) {
    return ContentService.createTextOutput("⚠️ Número ya registrado.");
  }

  const code = generateUniqueCode(sheet);
  sheet.appendRow([
    new Date(),
    name,
    phone,
    code,
    0,
    "-",
    "-",
    "No",
    ""
  ]);

  const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(code);
  const result = { status: "ok", code: code, qrUrl: qrUrl };
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function generateUniqueCode(sheet) {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var code;
  var data = sheet.getDataRange().getValues().map(function(r) { return r[3]; });
  do {
    code = "SL-" + Array.apply(null, Array(5)).map(function() { return chars.charAt(Math.floor(Math.random() * chars.length)); }).join("");
  } while (data.indexOf(code) !== -1);
  return code;
}

function loginUser(sheet, e) {
  var phone = e.parameter.phone;
  var data = sheet.getDataRange().getValues();
  var user = null;
  for (var i = 0; i < data.length; i++) {
    if (data[i][2] === phone) { user = data[i]; break; }
  }
  if (!user) return ContentService.createTextOutput("❌ Usuario no encontrado.");

  var result = {
    name: user[1],
    phone: user[2],
    code: user[3],
    nutrias: user[4],
    lastVisit: user[5],
    lastPurchase: user[6],
    rewards: user[7]
  };
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function addNutrias(sheet, e) {
  var code = e.parameter.code;
  var amount = parseFloat(e.parameter.amount);

  var rows = sheet.getDataRange().getValues();
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][3] === code) {
      var current = Number(rows[i][4]) || 0;
      var add = Math.floor(amount / 10);
      var nutrias = current + add;
      var reward = nutrias >= 100 ? "Sí" : rows[i][7];
      sheet.getRange(i + 1, 5).setValue(nutrias);
      sheet.getRange(i + 1, 6).setValue(new Date());
      sheet.getRange(i + 1, 7).setValue("Compra $" + amount);
      sheet.getRange(i + 1, 8).setValue(reward);
      return ContentService.createTextOutput("🐾 " + add + " nutrias asignadas.");
    }
  }
  return ContentService.createTextOutput("❌ Código no encontrado.");
}

function getUserByCode(sheet, e) {
  var code = e.parameter.code;
  var data = sheet.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][3] === code) {
      var user = data[i];
      var result = {
        name: user[1],
        phone: user[2],
        code: user[3],
        nutrias: user[4],
        rewards: user[7]
      };
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput("❌ No encontrado.");
}
