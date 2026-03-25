import { formatMoney, formatPct, formatChange } from './formatters';

const lc = (s) => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;

export function generateInsight(stats, t) {
  if (!stats) return null;

  const pool = [];
  const last3 = stats.changes?.slice(-3) ?? [];
  const last6 = stats.changes?.slice(-6) ?? [];
  const last12 = stats.changes?.slice(-12) ?? [];

  if (stats.bestMonth) {
    pool.push(() => t.insightBestMonth(lc(stats.bestMonth.month.label), formatChange(stats.bestMonth.value)));
  }

  if (stats.worstMonth) {
    pool.push(() => t.insightWorstMonth(lc(stats.worstMonth.month.label), formatChange(stats.worstMonth.value)));
  }

  if (stats.bestStreak?.length > 1) {
    pool.push(() => t.insightBestStreak(stats.bestStreak.length, formatChange(stats.bestStreak.total)));
  }

  if (stats.currentStreak?.count >= 2) {
    const type = stats.currentStreak.type === 'positive' ? t.insightStreakPositive : t.insightStreakNegative;
    pool.push(() => t.insightCurrentStreak(stats.currentStreak.count, type));
  }

  if (stats.runway != null && stats.runway > 0) {
    pool.push(() => t.insightRunway(stats.runway, Math.round(stats.runway / 12)));
  }

  if (stats.projection1y != null && stats.velocity !== 0) {
    pool.push(() => t.insightProjection1y(formatMoney(stats.projection1y)));
  }

  if (stats.projection5y != null && stats.velocity !== 0) {
    pool.push(() => t.insightProjection5y(formatMoney(stats.projection5y)));
  }

  if (stats.savingsRate > 0) {
    pool.push(() => t.insightSavingsRate(formatMoney(stats.savingsRate)));
  }

  if (stats.velocity !== 0) {
    const dir = stats.velocity > 0 ? t.insightVelocityUp : t.insightVelocityDown;
    pool.push(() => t.insightVelocity(formatMoney(Math.abs(stats.velocity)), dir));
  }

  if (stats.seasonality?.length) {
    const best = stats.seasonality.reduce((a, b) => a.avg > b.avg ? a : b);
    const worst = stats.seasonality.reduce((a, b) => a.avg < b.avg ? a : b);
    if (best.avg > 0 && best.count >= 2) {
      pool.push(() => t.insightBestQuarter(best.name, formatChange(best.avg)));
    }
    if (worst.avg < 0 && worst.count >= 2) {
      pool.push(() => t.insightWorstQuarter(worst.name, formatChange(worst.avg)));
    }
  }

  if (stats.maxDrawdownInfo?.pct > 2) {
    pool.push(() => t.insightMaxDrawdown(
      formatPct(stats.maxDrawdownInfo.pct),
      formatMoney(stats.maxDrawdownInfo.value),
    ));
  }

  if (stats.yearComparison?.length >= 2) {
    const years = stats.yearComparison;
    const best = years.reduce((a, b) => a.total > b.total ? a : b);
    const worst = years.reduce((a, b) => a.total < b.total ? a : b);
    pool.push(() => t.insightBestYear(best.year, formatChange(best.total)));
    if (worst.total < 0) {
      pool.push(() => t.insightWorstYear(worst.year, formatChange(worst.total)));
    }
  }

  if (stats.negativeMonthCount != null && stats.totalMonthCount > 3) {
    const pct = Math.round((stats.negativeMonthCount / stats.totalMonthCount) * 100);
    pool.push(() => t.insightNegativeMonths(pct, stats.negativeMonthCount, stats.totalMonthCount));
  }

  if (stats.changeVsYear != null) {
    pool.push(() => t.insightYearChange(formatChange(stats.changeVsYear)));
  }

  if (last3.length === 3) {
    const sum3 = last3.reduce((s, c) => s + c.value, 0);
    pool.push(() => t.insightLast3Months(formatChange(sum3)));
  }

  if (last6.length >= 4) {
    const avg6 = last6.reduce((s, c) => s + c.value, 0) / last6.length;
    pool.push(() => t.insightAvg6Months(formatMoney(avg6)));
  }

  if (stats.volatility > 0 && stats.avgChange !== 0) {
    const ratio = stats.volatility / Math.abs(stats.avgChange);
    if (ratio > 2) {
      pool.push(() => t.insightHighVolatility);
    } else if (ratio < 0.8) {
      pool.push(() => t.insightLowVolatility);
    }
  }

  if (stats.distribution?.length >= 2) {
    const top = stats.distribution[0];
    if (top.pct > 50) {
      pool.push(() => t.insightConcentration(top.name, Math.round(top.pct)));
    }
  }

  if (stats.cashVsInvested?.length > 0) {
    const latest = stats.cashVsInvested[stats.cashVsInvested.length - 1];
    const total = (latest.Cash || 0) + (latest.Invested || 0);
    if (total > 0 && latest.Invested > 0) {
      const investedPct = Math.round((latest.Invested / total) * 100);
      pool.push(() => t.insightInvestedRatio(investedPct));
    }
  }

  if (stats.hasHousing && stats.housing) {
    const h = stats.housing;
    if (h.monthsRemaining > 0) {
      const yearsLeft = (h.monthsRemaining / 12).toFixed(1);
      pool.push(() => t.insightMortgageProgress(
        Math.round((h.totalPaid / h.initialDebt) * 100),
        yearsLeft,
      ));
    }
    if (h.equity > 0) {
      pool.push(() => t.insightHousingEquity(formatMoney(h.equity)));
    }
  }

  if (stats.maxTotal > 0 && stats.current > 0) {
    const fromPeak = ((stats.maxTotal - stats.current) / stats.maxTotal) * 100;
    if (fromPeak < 1) {
      pool.push(() => t.insightAtPeak);
    } else if (fromPeak > 10) {
      pool.push(() => t.insightBelowPeak(Math.round(fromPeak), formatMoney(stats.maxTotal - stats.current)));
    }
  }

  if (last12.length >= 6) {
    const positiveCount = last12.filter(c => c.value > 0).length;
    const winRate = Math.round((positiveCount / last12.length) * 100);
    pool.push(() => t.insightWinRate(winRate, last12.length));
  }

  if (stats.burnRate < 0 && stats.savingsRate > 0) {
    const ratio = stats.savingsRate / Math.abs(stats.burnRate);
    if (ratio > 1) {
      pool.push(() => t.insightSavingsVsBurn(ratio.toFixed(1)));
    }
  }

  if (!pool.length) return t.insightNoData;

  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx]();
}
