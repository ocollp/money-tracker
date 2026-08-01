const VIVIENDA_PERSONAL = 'Vivienda personal';
const INVERTIDO = 'Invertido';

export function mergeFixedHousingSheetRows(rows, opts) {
  const amount = opts?.amount;
  const entityRaw = opts?.entity ?? 'BBVA';
  if (amount == null || !Number.isFinite(amount) || amount === 0) return rows;
  const entity = String(entityRaw).trim() || 'BBVA';
  const entityNorm = entity.toLowerCase();

  const filtered = rows.filter(
    (r) =>
      !(
        r.category === VIVIENDA_PERSONAL &&
        String(r.entity).trim().toLowerCase() === entityNorm
      ),
  );
  if (filtered.length === 0) return rows;

  const monthKeys = new Set();
  const dateByKey = new Map();
  for (const r of filtered) {
    const key = `${r.year}-${r.month}`;
    monthKeys.add(key);
    if (!dateByKey.has(key)) dateByKey.set(key, r.date);
  }

  const extra = [];
  for (const key of monthKeys) {
    const [yStr, mStr] = key.split('-');
    const y = Number(yStr);
    const mo = Number(mStr);
    const date = dateByKey.get(key) || `1/${String(mo).padStart(2, '0')}/${y}`;
    extra.push({
      date,
      month: mo,
      year: y,
      type: INVERTIDO,
      category: VIVIENDA_PERSONAL,
      entity,
      amount,
      isHousing: true,
      isTravel: false,
    });
  }
  return [...filtered, ...extra];
}

/** Parse sheet dates like 1/03/2024, 01-03-24, 1.3.2024. Returns null if invalid. */
export function parseSheetDate(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
    return null;
  }
  return { day, month, year };
}

function looksLikeMonthCol(v) {
  const n = parseInt(String(v ?? '').trim(), 10);
  return Number.isFinite(n) && n >= 1 && n <= 12;
}

function looksLikeYearCol(v) {
  const raw = String(v ?? '').trim();
  if (!/^\d{2,4}$/.test(raw)) return false;
  let n = parseInt(raw, 10);
  if (n < 100) n += 2000;
  return n >= 1900 && n <= 2100;
}

function parseAmount(amountStr) {
  if (amountStr == null || amountStr === '') return null;
  const amount = parseFloat(String(amountStr).replace('.', '').replace(',', '.'));
  return Number.isNaN(amount) ? null : amount;
}

/**
 * Parse Google Sheets `values` matrix (row 0 = header).
 * Supports legacy (Fecha, Mes, Año, …) and compact (Fecha, Cash/Inversión, …) layouts.
 */
export function parseSheetMatrix(values) {
  if (!Array.isArray(values) || values.length < 2) return [];
  const rows = [];

  for (let i = 1; i < values.length; i++) {
    const cols = values[i] || [];
    const date = cols[0] != null ? String(cols[0]).trim() : '';
    if (!date) continue;

    const parsedDate = parseSheetDate(date);
    if (!parsedDate) continue;

    const legacy = cols.length >= 7 && looksLikeMonthCol(cols[1]) && looksLikeYearCol(cols[2]);
    const type = String((legacy ? cols[3] : cols[1]) ?? '').trim();
    const category = String((legacy ? cols[4] : cols[2]) ?? '').trim();
    const entity = String((legacy ? cols[5] : cols[3]) ?? '').trim().replace(/\s+/g, ' ');
    const amount = parseAmount(String((legacy ? cols[6] : cols[4]) ?? '').trim());

    if (!type || !category || amount === null) continue;

    const { month, year } = parsedDate;
    const isHousing = category === VIVIENDA_PERSONAL || category === 'Hipoteca';
    const isTravel = category === 'Cuenta compartida flexible';

    rows.push({ date, month, year, type, category, entity, amount, isHousing, isTravel });
  }

  return rows;
}

/**
 * Supports both layouts:
 * - Legacy: Fecha, Mes, Año, Cash/Inversión, Categoria, Entidad, Cantidad
 * - Compact: Fecha, Cash/Inversión, Categoria, Entidad, Cantidad
 * Month/year always come from Fecha.
 */
export function parseCSV(text) {
  const lines = String(text || '').trim().split('\n');
  if (lines.length < 2) return [];
  const values = lines.map((line) => line.split(','));
  return parseSheetMatrix(values);
}

export function groupByMonth(rows) {
  const months = {};

  for (const row of rows) {
    const key = `${row.year}-${String(row.month).padStart(2, '0')}`;
    if (!months[key]) {
      months[key] = {
        key,
        date: new Date(row.year, row.month - 1, 1),
        label: `${monthName(row.month)} ${row.year}`,
        shortLabel: `${monthNameShort(row.month)} ${String(row.year).slice(2)}`,
        entries: [],
        total: 0,
        liquidTotal: 0,
        cash: 0,
        cashLiquid: 0,
        invested: 0,
        investedLiquid: 0,
        housingValue: 0,
        mortgageDebt: 0,
        travelFund: 0,
        byEntity: {},
        byEntityLiquid: {},
        byEntityHousing: {},
        byCategory: {},
      };
    }
    const m = months[key];
    m.entries.push(row);
    m.total += row.amount;

    if (row.isHousing) {
      if (row.category === VIVIENDA_PERSONAL) m.housingValue = row.amount;
      if (row.category === 'Hipoteca') m.mortgageDebt = row.amount;
      if (!m.byEntityHousing[row.entity]) m.byEntityHousing[row.entity] = { value: 0, debt: 0 };
      if (row.category === VIVIENDA_PERSONAL) m.byEntityHousing[row.entity].value = row.amount;
      if (row.category === 'Hipoteca') m.byEntityHousing[row.entity].debt = row.amount;
    } else if (row.isTravel) {
      m.travelFund = row.amount;
    } else {
      m.liquidTotal += row.amount;
      m.byEntityLiquid[row.entity] = (m.byEntityLiquid[row.entity] || 0) + row.amount;
    }

    if (row.type === 'Cash') {
      m.cash += row.amount;
      if (!row.isHousing && !row.isTravel) m.cashLiquid += row.amount;
    } else {
      m.invested += row.amount;
      if (!row.isHousing && !row.isTravel) m.investedLiquid += row.amount;
    }

    if (!row.isTravel) {
      m.byEntity[row.entity] = (m.byEntity[row.entity] || 0) + row.amount;
      m.byCategory[row.category] = (m.byCategory[row.category] || 0) + row.amount;
    }
  }

  return Object.values(months).sort((a, b) => a.date - b.date);
}

function monthName(n) {
  const names = ['', 'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
    'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];
  return names[n] || '';
}

function monthNameShort(n) {
  const names = ['', 'Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
  return names[n] || '';
}
