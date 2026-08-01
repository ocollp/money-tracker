/**
 * Money Tracker — Olga
 * Menú: Dades → Afegir mes següent amb plantilla
 * (Google Sheets always needs Menu → item; the top label alone cannot run a script.)
 *
 * Sheet layout (newest-first):
 *   Fecha | Cash/Inversion | Categoria | Entidad | Cantidad
 *
 * Creates day 1 of the month AFTER the newest month already in the sheet.
 * If the sheet has no data, uses day 1 of the current calendar month.
 *
 * Fixed amounts:
 *   Crowfunding Fundeen = 10000
 *   Crowfunding Urbanitae = 3000
 *   Vivienda personal BBVA = 150000
 * All other amounts blank.
 *
 * Install (in Olga's spreadsheet only — separate from Diego / Andrea):
 * 1. Open Olga spreadsheet
 * 2. Extensions → Apps Script
 * 3. Keep ONE Code.gs file; paste this file, Save
 * 4. Reload the sheet → menu "Dades" → "Afegir mes següent amb plantilla"
 */

var HEADER_ROWS = 1;
var NUM_COLS = 5;

/** Google Sheets palette: Azul aciano 3 / Verde claro 3 */
var COLOR_MONTH_EVEN = '#c9daf8'; // par → azul aciano 3
var COLOR_MONTH_ODD = '#d9ead3'; // impar → verde claro 3

/** Fixed rows for Olga. Amount null = leave blank. */
var TEMPLATE = [
  { type: 'Cash', category: 'Cuenta corriente', entity: 'BBVA', amount: null },
  { type: 'Cash', category: 'Cash', entity: 'Revolut', amount: null },
  { type: 'Cash', category: 'Cuenta compartida flexible', entity: 'Revolut', amount: null },
  { type: 'Invertido', category: 'Acciones', entity: 'Revolut', amount: null },
  { type: 'Invertido', category: 'Cryptos', entity: 'Revolut', amount: null },
  { type: 'Cash', category: 'Cash', entity: 'Efectivo', amount: null },
  { type: 'Invertido', category: 'Cuenta flexible', entity: 'Trade Republic', amount: null },
  { type: 'Invertido', category: 'Acciones', entity: 'Trade Republic', amount: null },
  { type: 'Invertido', category: 'ETFs', entity: 'Trade Republic', amount: null },
  { type: 'Invertido', category: 'Crowfunding', entity: 'Fundeen', amount: 10000 },
  { type: 'Invertido', category: 'Crowfunding', entity: 'Urbanitae', amount: 3000 },
  { type: 'Invertido', category: 'Fondo indexado', entity: 'Indexa Capital', amount: null },
  { type: 'Invertido', category: 'Plan de pensiones', entity: 'Indexa Capital', amount: null },
  { type: 'Invertido', category: 'Vivienda personal', entity: 'BBVA', amount: 150000 },
  { type: 'Invertido', category: 'Hipoteca', entity: 'BBVA', amount: null },
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Dades')
    .addItem('Afegir mes següent amb plantilla', 'addNewMonthOlga')
    .addToUi();
}

function addNewMonthOlga() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();

  var targetDate;
  if (lastRow > HEADER_ROWS) {
    var cell = sheet.getRange(HEADER_ROWS + 1, 1);
    var newest = toDate_(cell.getValue()) || toDate_(cell.getDisplayValue());
    if (!newest) {
      SpreadsheetApp.getUi().alert(
        'No s\'ha pogut llegir la data de la primera fila.\n' +
          'Valor: "' + cell.getDisplayValue() + '"',
      );
      return;
    }
    // Always create the next month after whatever is currently on top.
    targetDate = addMonths_(newest, 1);
  } else {
    targetDate = firstDayOfCurrentMonth_();
  }

  var newRows = TEMPLATE.map(function (row) {
    return [
      targetDate,
      row.type,
      row.category,
      row.entity,
      row.amount === null || row.amount === undefined ? '' : row.amount,
    ];
  });

  sheet.insertRowsAfter(HEADER_ROWS, newRows.length);
  var range = sheet.getRange(HEADER_ROWS + 1, 1, newRows.length, NUM_COLS);
  range.setValues(newRows);
  range.setFontWeight('normal');
  range.setBackground(monthBackground_(targetDate));
  // Fecha like Olga sheet: 1/08/2026
  sheet.getRange(HEADER_ROWS + 1, 1, newRows.length, 1).setNumberFormat('d/mm/yyyy');
  // Fecha + Cantidad → right; Cash/Inversión, Categoria, Entidad → left
  sheet.getRange(HEADER_ROWS + 1, 1, newRows.length, 1).setHorizontalAlignment('right');
  sheet.getRange(HEADER_ROWS + 1, 2, newRows.length, 3).setHorizontalAlignment('left');
  sheet.getRange(HEADER_ROWS + 1, 5, newRows.length, 1).setHorizontalAlignment('right');
}

/** Day 1 of the calendar month we are currently in. */
function firstDayOfCurrentMonth_() {
  var now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function addMonths_(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function monthBackground_(date) {
  var month = date.getMonth() + 1; // 1–12
  return month % 2 === 0 ? COLOR_MONTH_EVEN : COLOR_MONTH_ODD;
}

function toDate_(value) {
  if (value === null || value === undefined || value === '') return null;

  // Real Date from Sheets (avoid fragile instanceof)
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  // Sheets / Excel serial number
  if (typeof value === 'number' && isFinite(value)) {
    var serial = new Date(Date.UTC(1899, 11, 30) + Math.round(value * 86400000));
    return new Date(serial.getUTCFullYear(), serial.getUTCMonth(), serial.getUTCDate());
  }

  var s = String(value).trim();
  if (!s) return null;

  // 1/08/2026 | 1-8-26 | 01.08.2026
  var m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    var day = Number(m[1]);
    var month = Number(m[2]);
    var year = Number(m[3]);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day);
    }
  }

  var parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  return null;
}
