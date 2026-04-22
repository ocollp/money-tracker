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

export function parseCSV(text) {
  const lines = text.trim().split('\n');
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const date = cols[0]?.trim();
    const month = parseInt(cols[1]?.trim(), 10);
    const year = parseInt(cols[2]?.trim(), 10);
    const type = cols[3]?.trim();
    const category = cols[4]?.trim();
    const entity = cols[5]?.trim().replace(/\s+/g, ' ');
    const amountStr = cols[6]?.trim();

    if (!date || !year || isNaN(month)) continue;

    const amount = amountStr ? parseFloat(amountStr.replace('.', '').replace(',', '.')) : null;

    if (amount === null || isNaN(amount)) continue;

    const isHousing = category === VIVIENDA_PERSONAL || category === 'Hipoteca';
    const isTravel = category === 'Cuenta compartida flexible';

    rows.push({ date, month, year, type, category, entity, amount, isHousing, isTravel });
  }

  return rows;
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
