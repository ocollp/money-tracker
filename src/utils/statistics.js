import { MORTGAGE_REMAINING_MONTHS, MORTGAGE_END_YEAR, MORTGAGE_END_MONTH, MORTGAGE_MONTHLY_PAYMENT, OWNERSHIP_SHARE } from '../config.js';

export function computeStatistics(months) {
  if (!months.length) return null;

  const totals = months.map(m => m.total);
  const liquidTotals = months.map(m => m.liquidTotal);

  // Primary = liquid (without housing). Total = with housing for the mortgage card.
  const current = liquidTotals[liquidTotals.length - 1];
  const currentTotal = totals[totals.length - 1];
  const previous = liquidTotals.length > 1 ? liquidTotals[liquidTotals.length - 2] : null;
  const yearAgoIdx = liquidTotals.length > 12 ? liquidTotals.length - 13 : null;

  const changeVsPrev = previous !== null ? current - previous : null;
  const changeVsPrevPct = previous ? ((current - previous) / previous) * 100 : null;
  const changeVsYear = yearAgoIdx !== null ? current - liquidTotals[yearAgoIdx] : null;
  const changeVsYearPct = yearAgoIdx !== null && liquidTotals[yearAgoIdx]
    ? ((current - liquidTotals[yearAgoIdx]) / liquidTotals[yearAgoIdx]) * 100 : null;

  const maxTotal = Math.max(...liquidTotals);
  const minTotal = Math.min(...liquidTotals);
  const maxIdx = liquidTotals.indexOf(maxTotal);
  const minIdx = liquidTotals.indexOf(minTotal);

  // Monthly changes (liquid only)
  const changes = [];
  for (let i = 1; i < months.length; i++) {
    const diff = liquidTotals[i] - liquidTotals[i - 1];
    const pct = liquidTotals[i - 1] ? (diff / liquidTotals[i - 1]) * 100 : 0;
    changes.push({ month: months[i], value: diff, pct });
  }

  const bestMonth = changes.length ? changes.reduce((a, b) => a.value > b.value ? a : b) : null;
  const worstMonth = changes.length ? changes.reduce((a, b) => a.value < b.value ? a : b) : null;

  // Filter outliers
  const normalChanges = filterOutliers(changes);
  const outlierChanges = changes.filter(c => !normalChanges.includes(c));
  const avgChange = normalChanges.length ? normalChanges.reduce((s, c) => s + c.value, 0) / normalChanges.length : 0;

  // Burn rate
  const negativeMonths = normalChanges.filter(c => c.value < 0);
  const burnRate = negativeMonths.length
    ? negativeMonths.reduce((s, c) => s + c.value, 0) / negativeMonths.length
    : 0;

  // Runway
  const avgExpense = burnRate ? Math.abs(burnRate) : null;
  const runway = avgExpense ? Math.floor(current / avgExpense) : null;

  // Velocity (last 12 months, liquid)
  const last12 = changes.slice(-12);
  const velocity = last12.length
    ? last12.reduce((s, c) => s + c.value, 0) / last12.length
    : 0;

  // Projection (liquid)
  const projection1y = current + velocity * 12;
  const projection5y = current + velocity * 60;

  // Volatility (liquid, excluding outliers)
  const meanChange = normalChanges.length ? normalChanges.reduce((s, c) => s + c.value, 0) / normalChanges.length : 0;
  const variance = normalChanges.length
    ? normalChanges.reduce((s, c) => s + Math.pow(c.value - meanChange, 2), 0) / normalChanges.length
    : 0;
  const volatility = Math.sqrt(variance);

  // Max drawdown (liquid)
  let maxDrawdown = 0;
  let peak = liquidTotals[0];
  let drawdownStart = null;
  let maxDrawdownInfo = { value: 0, pct: 0, from: null, to: null };

  for (let i = 1; i < liquidTotals.length; i++) {
    if (liquidTotals[i] > peak) {
      peak = liquidTotals[i];
      drawdownStart = i;
    }
    const dd = peak > 0 ? (peak - liquidTotals[i]) / peak : 0;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
      maxDrawdownInfo = {
        value: peak - liquidTotals[i],
        pct: dd * 100,
        from: months[drawdownStart || 0],
        to: months[i],
        peakValue: peak,
        troughValue: liquidTotals[i],
      };
    }
  }

  // Streaks
  const bestStreak = findStreak(changes, true);
  const worstStreak = findStreak(changes, false);

  // Distribution by entity (latest month, LIQUID only — no BBVA/housing)
  const latestMonth = months[months.length - 1];
  const distribution = Object.entries(latestMonth.byEntityLiquid)
    .map(([name, value]) => ({ name, value, pct: current > 0 ? (value / current) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);

  // Entity evolution (liquid only)
  const allEntitiesLiquid = [...new Set(months.flatMap(m => Object.keys(m.byEntityLiquid)))];
  const entityEvolution = months.map(m => {
    const point = { date: m.shortLabel, key: m.key };
    for (const e of allEntitiesLiquid) {
      point[e] = m.byEntityLiquid[e] || 0;
    }
    return point;
  });

  // Cash vs Invested (liquid only)
  const cashVsInvested = months.map(m => ({
    date: m.shortLabel,
    key: m.key,
    Cash: m.cashLiquid,
    Invested: m.invertidoLiquid,
  }));

  // Heatmap
  const heatmap = changes.map(c => ({
    month: c.month.shortLabel,
    fullMonth: c.month.label,
    key: c.month.key,
    value: c.value,
    pct: c.pct,
    año: c.month.date.getFullYear(),
    mes: c.month.date.getMonth(),
  }));

  // Mortgage / housing
  const hasHousing = months.some(m => m.housingValue > 0);
  const latestHousingValue = latestMonth.housingValue;
  const latestMortgageDebt = latestMonth.mortgageDebt;
  const housingEquity = latestHousingValue + latestMortgageDebt;

  const mortgageMonths = months.filter(m => m.mortgageDebt < 0);
  const firstMortgage = mortgageMonths.length ? mortgageMonths[0] : null;
  const initialDebt = firstMortgage ? Math.abs(firstMortgage.mortgageDebt) : 0;
  const currentDebt = Math.abs(latestMortgageDebt);
  const totalPaid = initialDebt - currentDebt;

  const mortgageEvolution = mortgageMonths.map(m => ({
    date: m.shortLabel,
    key: m.key,
    debt: Math.abs(m.mortgageDebt),
    equity: m.housingValue + m.mortgageDebt,
    paid: initialDebt - Math.abs(m.mortgageDebt),
  }));

  const share = OWNERSHIP_SHARE != null && OWNERSHIP_SHARE > 0 ? OWNERSHIP_SHARE : 1;
  let mortgageMonthsRemaining = null;
  if (currentDebt > 0) {
    if (MORTGAGE_END_YEAR != null && MORTGAGE_END_MONTH != null) {
      const now = new Date();
      const end = new Date(MORTGAGE_END_YEAR, MORTGAGE_END_MONTH - 1, 1);
      mortgageMonthsRemaining = Math.max(0, (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth()));
    } else if (MORTGAGE_REMAINING_MONTHS != null) {
      mortgageMonthsRemaining = MORTGAGE_REMAINING_MONTHS;
    }
  }
  const monthlyMortgagePayment = currentDebt > 0 && MORTGAGE_MONTHLY_PAYMENT != null ? MORTGAGE_MONTHLY_PAYMENT : 0;
  const fullPropertyValue = latestHousingValue / share;
  const fullDebt = currentDebt / share;

  // Savings rate (average of positive months, excluding outliers)
  const positiveMonths = normalChanges.filter(c => c.value > 0);
  const savingsRate = positiveMonths.length
    ? positiveMonths.reduce((s, c) => s + c.value, 0) / positiveMonths.length
    : 0;

  // Year over year comparison
  const yearSummary = {};
  for (const c of changes) {
    const y = c.month.date.getFullYear();
    if (!yearSummary[y]) yearSummary[y] = { year: y, total: 0, months: 0, positive: 0, negative: 0 };
    yearSummary[y].total += c.value;
    yearSummary[y].months++;
    if (c.value > 0) yearSummary[y].positive++;
    else yearSummary[y].negative++;
  }
  const yearComparison = Object.values(yearSummary).sort((a, b) => a.year - b.year);

  // Current streak
  let currentStreak = { count: 0, type: null };
  for (let i = changes.length - 1; i >= 0; i--) {
    const type = changes[i].value >= 0 ? 'positive' : 'negative';
    if (currentStreak.count === 0) {
      currentStreak = { count: 1, type };
    } else if (type === currentStreak.type) {
      currentStreak.count++;
    } else {
      break;
    }
  }

  // Seasonality: average by quarter
  const quarterNames = ['Q1 (Gen-Mar)', 'Q2 (Abr-Jun)', 'Q3 (Jul-Set)', 'Q4 (Oct-Des)'];
  const quarterTotals = [[], [], [], []];
  for (const c of normalChanges) {
    const q = Math.floor(c.month.date.getMonth() / 3);
    quarterTotals[q].push(c.value);
  }
  const seasonality = quarterNames.map((name, i) => ({
    name,
    avg: quarterTotals[i].length ? quarterTotals[i].reduce((s, v) => s + v, 0) / quarterTotals[i].length : 0,
    count: quarterTotals[i].length,
  }));

  // Patterns
  const patterns = detectPatterns(changes);

  return {
    current,
    currentTotal,
    changeVsPrev,
    changeVsPrevPct,
    changeVsYear,
    changeVsYearPct,
    maxTotal,
    minTotal,
    maxMonth: months[maxIdx],
    minMonth: months[minIdx],
    changes,
    avgChange,
    bestMonth,
    worstMonth,
    burnRate,
    negativeMonthCount: negativeMonths.length,
    totalMonthCount: normalChanges.length,
    outlierChanges,
    runway,
    velocity,
    projection1y,
    projection5y,
    volatility,
    maxDrawdownInfo,
    bestStreak,
    worstStreak,
    distribution,
    entityEvolution,
    cashVsInvested,
    allEntities: allEntitiesLiquid,
    heatmap,
    patterns,
    savingsRate,
    yearComparison,
    currentStreak,
    seasonality,
    months,
    liquidTotals,
    hasHousing,
    housing: {
      fullValue: fullPropertyValue,
      fullDebt,
      value: latestHousingValue,
      debt: currentDebt,
      equity: housingEquity,
      totalPaid,
      initialDebt,
      monthlyPayment: monthlyMortgagePayment,
      monthsRemaining: mortgageMonthsRemaining,
      evolution: mortgageEvolution,
    },
  };
}

function findStreak(changes, positive) {
  let best = { total: 0, length: 0, start: null, end: null };
  let current = { total: 0, length: 0, start: null, end: null };

  for (const c of changes) {
    const match = positive ? c.value > 0 : c.value < 0;
    if (match) {
      if (current.length === 0) current.start = c.month;
      current.total += c.value;
      current.length++;
      current.end = c.month;
      if ((positive && current.total > best.total) || (!positive && current.total < best.total)) {
        best = { ...current };
      }
    } else {
      current = { total: 0, length: 0, start: null, end: null };
    }
  }
  return best;
}

function filterOutliers(changes) {
  if (changes.length < 4) return changes;
  const values = changes.map(c => c.value).sort((a, b) => a - b);
  const q1 = values[Math.floor(values.length * 0.25)];
  const q3 = values[Math.floor(values.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  return changes.filter(c => c.value >= lowerBound && c.value <= upperBound);
}

function detectPatterns(changes) {
  const byMonthOfYear = {};
  for (const c of changes) {
    const m = c.month.date.getMonth();
    if (!byMonthOfYear[m]) byMonthOfYear[m] = [];
    byMonthOfYear[m].push(c.value);
  }

  const patterns = [];
  const monthNames = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
    'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];

  for (const [m, values] of Object.entries(byMonthOfYear)) {
    if (values.length < 2) continue;
    const allNeg = values.every(v => v < 0);
    const allPos = values.every(v => v > 0);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;

    if (allNeg) {
      patterns.push({ type: 'negative', month: monthNames[m], avg });
    } else if (allPos) {
      patterns.push({ type: 'positive', month: monthNames[m], avg });
    }
  }

  return patterns;
}
