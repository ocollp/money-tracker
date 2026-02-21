import { MORTGAGE_END_YEAR, MORTGAGE_END_MONTH, MORTGAGE_MONTHLY_PAYMENT, OWNERSHIP_SHARE } from '../config.js';

function totalWealth(m) {
  return (m.liquidTotal || 0) + (m.housingValue || 0) + (m.mortgageDebt || 0);
}

// Fill missing months between first and last so charts show a continuous timeline
function fillMissingMonths(months) {
  if (months.length <= 1) {
    const tw = months.length ? totalWealth(months[0]) : 0;
    return { filledMonths: months, filledLiquidTotals: months.map(m => m.liquidTotal), filledTotalWealth: months.map(m => totalWealth(m)) };
  }
  const first = months[0].date;
  const last = months[months.length - 1].date;
  const byKey = new Map(months.map(m => [m.key, m]));
  const filledMonths = [];
  const filledLiquidTotals = [];
  const filledTotalWealth = [];
  const monthNamesShort = ['', 'Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
  let lastLiquid = months[0].liquidTotal;
  let lastTW = totalWealth(months[0]);
  for (let d = new Date(first.getFullYear(), first.getMonth(), 1); d <= last; d.setMonth(d.getMonth() + 1)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const existing = byKey.get(key);
    if (existing) {
      filledMonths.push(existing);
      lastLiquid = existing.liquidTotal;
      lastTW = totalWealth(existing);
      filledLiquidTotals.push(existing.liquidTotal);
      filledTotalWealth.push(lastTW);
    } else {
      const shortLabel = `${monthNamesShort[d.getMonth() + 1]} ${String(d.getFullYear()).slice(2)}`;
      filledMonths.push({ key, date: new Date(d), shortLabel, label: `${monthNamesShort[d.getMonth() + 1]} ${d.getFullYear()}`, liquidTotal: lastLiquid });
      filledLiquidTotals.push(lastLiquid);
      filledTotalWealth.push(lastTW);
    }
  }
  return { filledMonths, filledLiquidTotals, filledTotalWealth };
}

export function computeStatistics(months) {
  if (!months.length) return null;

  const { filledMonths, filledLiquidTotals, filledTotalWealth } = fillMissingMonths(months);

  const totals = months.map(m => m.total);
  const liquidTotals = months.map(m => m.liquidTotal);
  const totalWealthByMonth = months.map(m => totalWealth(m));

  const current = liquidTotals[liquidTotals.length - 1];
  const currentTotal = totals[totals.length - 1];
  const currentTotalWealth = totalWealthByMonth[totalWealthByMonth.length - 1];
  const previous = liquidTotals.length > 1 ? liquidTotals[liquidTotals.length - 2] : null;
  const previousTotalWealth = totalWealthByMonth.length > 1 ? totalWealthByMonth[totalWealthByMonth.length - 2] : null;
  const yearAgoIdx = liquidTotals.length > 12 ? liquidTotals.length - 13 : null;

  const changeVsPrev = previous !== null ? current - previous : null;
  const changeVsPrevPct = previous ? ((current - previous) / previous) * 100 : null;
  const changeVsYear = yearAgoIdx !== null ? current - liquidTotals[yearAgoIdx] : null;
  const changeVsYearPct = yearAgoIdx !== null && liquidTotals[yearAgoIdx]
    ? ((current - liquidTotals[yearAgoIdx]) / liquidTotals[yearAgoIdx]) * 100 : null;

  const changeVsPrevTotal = previousTotalWealth != null ? currentTotalWealth - previousTotalWealth : null;
  const changeVsPrevPctTotal = previousTotalWealth ? ((currentTotalWealth - previousTotalWealth) / previousTotalWealth) * 100 : null;
  const changeVsYearTotal = yearAgoIdx != null ? currentTotalWealth - totalWealthByMonth[yearAgoIdx] : null;
  const changeVsYearPctTotal = yearAgoIdx != null && totalWealthByMonth[yearAgoIdx]
    ? ((currentTotalWealth - totalWealthByMonth[yearAgoIdx]) / totalWealthByMonth[yearAgoIdx]) * 100 : null;

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

  // Burn rate (monthly spend when balance goes down)
  const negativeMonths = normalChanges.filter(c => c.value < 0);
  const burnRate = negativeMonths.length
    ? negativeMonths.reduce((s, c) => s + c.value, 0) / negativeMonths.length
    : 0;

  // Runway: months of runway at current burn; use P75 of negative months for a conservative estimate.
  const absNegatives = negativeMonths.map(c => Math.abs(c.value)).sort((a, b) => a - b);
  const p75Index = Math.floor(absNegatives.length * 0.75);
  const conservativeExpense = absNegatives.length
    ? (absNegatives[p75Index] ?? absNegatives[absNegatives.length - 1])
    : (burnRate ? Math.abs(burnRate) : null);
  const runway = conservativeExpense && conservativeExpense > 0
    ? Math.floor(current / conservativeExpense)
    : null;

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

  // Distribution by entity (latest month): liquid + housing equity per entity.
  const latestMonth = months[months.length - 1];
  const byEntityHousing = latestMonth.byEntityHousing || {};
  const allEntityNames = [...new Set([
    ...Object.keys(latestMonth.byEntity),
    ...Object.keys(latestMonth.byEntityLiquid),
    ...Object.keys(byEntityHousing),
  ])];
  const totalForDistribution = current + (latestMonth.housingValue || 0) + (latestMonth.mortgageDebt || 0);
  const distribution = allEntityNames
    .map((name) => {
      const liquid = latestMonth.byEntityLiquid[name] ?? 0;
      const housing = byEntityHousing[name];
      const equity = housing ? (housing.value || 0) + (housing.debt || 0) : 0;
      const value = liquid + equity;
      return {
        name,
        value,
        pct: totalForDistribution !== 0 ? (value / totalForDistribution) * 100 : 0,
      };
    })
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

  // Monthly changes in total wealth (liquid + housing equity) so investing in housing is not shown as "spent"
  const changesTotal = [];
  for (let i = 1; i < months.length; i++) {
    const liquidChange = liquidTotals[i] - liquidTotals[i - 1];
    const housingEquityPrev = (months[i - 1].housingValue || 0) + (months[i - 1].mortgageDebt || 0);
    const housingEquityCurr = (months[i].housingValue || 0) + (months[i].mortgageDebt || 0);
    const totalChange = liquidChange + (housingEquityCurr - housingEquityPrev);
    const prevTotal = liquidTotals[i - 1] + housingEquityPrev;
    const pct = prevTotal ? (totalChange / prevTotal) * 100 : 0;
    changesTotal.push({ month: months[i], value: totalChange, pct });
  }
  const normalChangesTotal = filterOutliers(changesTotal);
  const avgChangeTotal = normalChangesTotal.length
    ? normalChangesTotal.reduce((s, c) => s + c.value, 0) / normalChangesTotal.length
    : 0;

  // Heatmap: total wealth change so housing investment is not shown as spent
  const heatmap = changesTotal.map(c => ({
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
    }
  }
  const monthlyMortgagePayment = currentDebt > 0 && MORTGAGE_MONTHLY_PAYMENT != null ? MORTGAGE_MONTHLY_PAYMENT : 0;
  const fullPropertyValue = latestHousingValue / share;
  const fullDebt = currentDebt / share;
  // totalEquity = full property equity when share < 1 (user's sheet holds their share).
  const totalEquity = share > 0 && share < 1 ? housingEquity / share : housingEquity;

  // Savings rate (average of positive months, excluding outliers)
  const positiveMonths = normalChanges.filter(c => c.value > 0);
  const savingsRate = positiveMonths.length
    ? positiveMonths.reduce((s, c) => s + c.value, 0) / positiveMonths.length
    : 0;

  // Year over year: total wealth change (includes housing, not as spending)
  const yearSummary = {};
  for (const c of changesTotal) {
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
    currentTotalWealth,
    changeVsPrev,
    changeVsPrevPct,
    changeVsPrevTotal,
    changeVsPrevPctTotal,
    changeVsYear,
    changeVsYearPct,
    changeVsYearTotal,
    changeVsYearPctTotal,
    avgChangeTotal,
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
    netWorthMonths: filledMonths,
    netWorthTotals: filledLiquidTotals,
    netWorthTotalWealth: filledTotalWealth,
    hasHousing,
    housing: {
      fullValue: fullPropertyValue,
      fullDebt,
      value: latestHousingValue,
      debt: currentDebt,
      equity: housingEquity,
      totalEquity,
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
