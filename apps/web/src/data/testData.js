import { parseCSV, groupByMonth } from '../utils/parseCSV';
import { computeStatistics } from '../utils/statistics';

function buildTestCsv() {
  const lines = ['date,month,year,type,category,entity,amount'];
  let bbva = 180;
  let indexa = 420;
  let revolut = 80;
  const debtStart = 268000;
  const debtPerMonth = 2000;
  const gastosMonths = new Set(['2024-6', '2024-12', '2025-4', '2025-8', '2025-12', '2026-1']);
  const gastosBbva = 200;
  const gastosIndexa = 120;
  const gastosRevolut = 80;

  const travelTripMonths = new Set(['2024-7', '2025-4', '2025-12']);
  const travelTripCost = 1500;
  const travelMonthlySave = 400;
  let travelBalance = 0;

  for (let y = 2024; y <= 2026; y++) {
    const monthEnd = y === 2026 ? 2 : 12;
    for (let m = 1; m <= monthEnd; m++) {
      if (y === 2024 && m < 1) continue;
      const key = `${y}-${m}`;
      if (gastosMonths.has(key)) {
        bbva = Math.max(80, bbva - gastosBbva);
        indexa = Math.max(150, indexa - gastosIndexa);
        revolut = Math.max(20, revolut - gastosRevolut);
      } else {
        bbva += 28;
        indexa += 62;
        revolut += 8;
      }
      const date = `15/${String(m).padStart(2, '0')}/${y}`;
      lines.push(`${date},${m},${y},Cash,Efectivo,BBVA,${bbva}`);
      lines.push(`${date},${m},${y},Invertido,Fons,Indexa,${indexa}`);
      lines.push(`${date},${m},${y},Cash,Compte,Revolut,${revolut}`);

      travelBalance += travelMonthlySave;
      if (travelTripMonths.has(key)) {
        travelBalance -= travelTripCost;
      }
      if (travelBalance !== 0) {
        lines.push(`${date},${m},${y},Cash,Cuenta compartida flexible,Cuenta flexible,${travelBalance}`);
      }

      if (y >= 2025) {
        const debtTotal = Math.max(0, debtStart - (y - 2025) * 12 * debtPerMonth - (m - 1) * debtPerMonth);
        const debtHalf = Math.round(debtTotal / 2);
        lines.push(`01/${String(m).padStart(2, '0')}/${y},${m},${y},Cash,Vivienda personal,BBVA,175000`);
        lines.push(`01/${String(m).padStart(2, '0')}/${y},${m},${y},Cash,Hipoteca,BBVA,-${debtHalf}`);
      }
    }
  }
  return lines.join('\n');
}

const TEST_CSV = buildTestCsv();

export function getTestStats() {
  const rows = parseCSV(TEST_CSV);
  const months = groupByMonth(rows);
  const stats = computeStatistics(months, { ownershipShare: 0.5 });
  if (stats?.housing) {
    stats.housing.monthsRemaining = 100;
    stats.housing.monthlyPayment = 1200;
  }
  return stats;
}
