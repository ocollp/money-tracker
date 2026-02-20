export function parseCSV(text) {
  const lines = text.trim().split('\n');
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const fecha = cols[0]?.trim();
    const mes = parseInt(cols[1]?.trim(), 10);
    const año = parseInt(cols[2]?.trim(), 10);
    const tipo = cols[3]?.trim();
    const categoria = cols[4]?.trim();
    const entidad = cols[5]?.trim().replace(/\s+/g, ' ');
    const cantidadStr = cols[6]?.trim();

    if (!fecha || !año || isNaN(mes)) continue;

    const cantidad = cantidadStr ? parseFloat(cantidadStr.replace('.', '').replace(',', '.')) : null;

    if (cantidad === null || isNaN(cantidad)) continue;

    const isHousing = categoria === 'Vivienda personal' || categoria === 'Hipoteca';

    rows.push({ fecha, mes, año, tipo, categoria, entidad, cantidad, isHousing });
  }

  return rows;
}

export function groupByMonth(rows) {
  const months = {};

  for (const row of rows) {
    const key = `${row.año}-${String(row.mes).padStart(2, '0')}`;
    if (!months[key]) {
      months[key] = {
        key,
        date: new Date(row.año, row.mes - 1, 1),
        label: `${monthName(row.mes)} ${row.año}`,
        shortLabel: `${monthNameShort(row.mes)} ${String(row.año).slice(2)}`,
        entries: [],
        total: 0,
        liquidTotal: 0,
        cash: 0,
        cashLiquid: 0,
        invertido: 0,
        invertidoLiquid: 0,
        housingValue: 0,
        mortgageDebt: 0,
        byEntity: {},
        byEntityLiquid: {},
        byCategory: {},
      };
    }
    const m = months[key];
    m.entries.push(row);
    m.total += row.cantidad;

    if (row.isHousing) {
      if (row.categoria === 'Vivienda personal') m.housingValue = row.cantidad;
      if (row.categoria === 'Hipoteca') m.mortgageDebt = row.cantidad;
    } else {
      m.liquidTotal += row.cantidad;
      m.byEntityLiquid[row.entidad] = (m.byEntityLiquid[row.entidad] || 0) + row.cantidad;
    }

    if (row.tipo === 'Cash') {
      m.cash += row.cantidad;
      if (!row.isHousing) m.cashLiquid += row.cantidad;
    } else {
      m.invertido += row.cantidad;
      if (!row.isHousing) m.invertidoLiquid += row.cantidad;
    }

    m.byEntity[row.entidad] = (m.byEntity[row.entidad] || 0) + row.cantidad;
    m.byCategory[row.categoria] = (m.byCategory[row.categoria] || 0) + row.cantidad;
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
