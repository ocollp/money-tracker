/**
 * Money Tracker — Afegir mes nou (Google Sheets)
 *
 * Assumes newest-first sheet layout:
 *   Fecha | Cash/Inversion | Categoria | Entidad | Cantidad
 *
 * Install (once per spreadsheet):
 * 1. Extensions → Apps Script
 * 2. Paste this file
 * 3. Save → reload the sheet
 * 4. Menu "Finances" → "Afegir mes nou"
 */

var HEADER_ROWS = 1;
var COL_DATE = 0;
var COL_TYPE = 1;
var COL_CATEGORY = 2;
var COL_ENTITY = 3;
var COL_AMOUNT = 4;
var NUM_COLS = 5;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Finances')
    .addItem('Afegir mes nou', 'addNewMonth')
    .addToUi();
}

function addNewMonth() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();

  if (!data || data.length <= HEADER_ROWS) {
    SpreadsheetApp.getUi().alert('No hi ha dades sota la capçalera.');
    return;
  }

  var firstDataRow = data[HEADER_ROWS];
  var firstDate = toDate_(firstDataRow[COL_DATE]);
  if (!firstDate) {
    SpreadsheetApp.getUi().alert('No s\'ha pogut llegir la data de la primera fila.');
    return;
  }

  var template = [];
  for (var i = HEADER_ROWS; i < data.length; i++) {
    var rowDate = toDate_(data[i][COL_DATE]);
    if (!rowDate) break;
    if (!sameYearMonth_(rowDate, firstDate)) break;
    template.push(data[i]);
  }

  if (!template.length) {
    SpreadsheetApp.getUi().alert('No s\'han trobat files del mes actual.');
    return;
  }

  var nextDate = addMonths_(firstDate, 1);
  var nextDateText = formatSheetDate_(nextDate);

  // Avoid duplicating if the newest month is already the next one.
  var existingNewest = formatSheetDate_(firstDate);
  if (existingNewest === nextDateText) {
    SpreadsheetApp.getUi().alert('El mes ' + nextDateText + ' ja és el més recent del full.');
    return;
  }

  var newRows = template.map(function (row) {
    var category = String(row[COL_CATEGORY] || '').trim();
    var amount = '';

    // Keep housing defaults; leave the rest empty to fill in.
    if (category === 'Vivienda personal' || category === 'Hipoteca') {
      amount = row[COL_AMOUNT];
    }

    return [
      nextDateText,
      row[COL_TYPE],
      row[COL_CATEGORY],
      row[COL_ENTITY],
      amount,
    ];
  });

  // Insert just below the header (newest-first).
  sheet.insertRowsAfter(HEADER_ROWS, newRows.length);
  sheet.getRange(HEADER_ROWS + 1, 1, newRows.length, NUM_COLS).setValues(newRows);

  SpreadsheetApp.getUi().alert(
    'Creat el mes ' + nextDateText + ' amb ' + newRows.length + ' files.\n' +
      'Omple les quantitats a dalt del full.',
  );
}

function toDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  var s = String(value || '').trim();
  if (!s) return null;

  // dd-mm-yy / dd-mm-yyyy / d/m/yyyy
  var m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (!m) return null;

  var day = Number(m[1]);
  var month = Number(m[2]);
  var year = Number(m[3]);
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return new Date(year, month - 1, day);
}

function sameYearMonth_(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function addMonths_(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function formatSheetDate_(date) {
  var dd = ('0' + date.getDate()).slice(-2);
  var mm = ('0' + (date.getMonth() + 1)).slice(-2);
  var yy = String(date.getFullYear()).slice(-2);
  return dd + '-' + mm + '-' + yy;
}
