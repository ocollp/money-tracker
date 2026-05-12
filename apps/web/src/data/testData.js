import { parseCSV, groupByMonth } from '../utils/parseCSV';
import { computeStatistics } from '../utils/statistics';
import { TRAVEL_MONTHLY_SAVING } from '../config.js';

/** Inclusive Y-M range (month 1–12). */
function* eachMonth(fromY, fromM, toY, toM) {
  let y = fromY;
  let m = fromM;
  for (;;) {
    yield { y, m, key: `${y}-${String(m).padStart(2, '0')}` };
    if (y === toY && m === toM) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
}

function buildTestCsv() {
  const lines = ['date,month,year,type,category,entity,amount'];

  let bbva = 1850;
  let indexa = 4100;
  let revolut = 620;
  let crowdcube = 800;

  /** Months with a simulated drawdown on liquid (labels, trips, etc.). */
  const gastosMonths = new Set([
    '2024-06',
    '2024-12',
    '2025-04',
    '2025-08',
    '2025-12',
    '2026-02',
  ]);
  const gastosBbva = 420;
  const gastosIndexa = 280;
  const gastosRevolut = 140;
  const gastosCrowd = 100;

  const travelTripMonths = new Set(['2024-07', '2025-04', '2025-12']);
  const travelTripCost = 3200;
  const travelMonthlySave = TRAVEL_MONTHLY_SAVING;
  let travelBalance = 0;

  const housingBase = 268000;
  const mortgageStart = 192000;
  const principalPerMonth = 720;
  let monthIdx = 0;

  for (const { y, m, key } of eachMonth(2024, 1, 2026, 5)) {
    if (gastosMonths.has(key)) {
      bbva = Math.max(400, bbva - gastosBbva);
      indexa = Math.max(1200, indexa - gastosIndexa);
      revolut = Math.max(80, revolut - gastosRevolut);
      crowdcube = Math.max(200, crowdcube - gastosCrowd);
    } else {
      bbva += 55;
      indexa += 120;
      revolut += 18;
      crowdcube += 12;
    }

    const date = `15/${String(m).padStart(2, '0')}/${y}`;
    lines.push(`${date},${m},${y},Cash,Efectivo,BBVA,${Math.round(bbva)}`);
    lines.push(`${date},${m},${y},Invertido,Fons,Indexa,${Math.round(indexa)}`);
    lines.push(`${date},${m},${y},Cash,Compte,Revolut,${Math.round(revolut)}`);
    lines.push(`${date},${m},${y},Invertido,Inversión,Crowdcube,${Math.round(crowdcube)}`);

    travelBalance += travelMonthlySave;
    if (travelTripMonths.has(key)) {
      travelBalance -= travelTripCost;
    }
    if (travelBalance !== 0) {
      lines.push(
        `${date},${m},${y},Cash,Cuenta compartida flexible,Cuenta flexible,${Math.round(travelBalance)}`,
      );
    }

    const housingValue = housingBase + Math.floor(monthIdx / 14) * 2500;
    const remainingPrincipal = Math.max(9500, mortgageStart - monthIdx * principalPerMonth);
    lines.push(
      `01/${String(m).padStart(2, '0')}/${y},${m},${y},Invertido,Vivienda personal,BBVA,${housingValue}`,
    );
    lines.push(
      `01/${String(m).padStart(2, '0')}/${y},${m},${y},Cash,Hipoteca,BBVA,-${remainingPrincipal}`,
    );

    monthIdx += 1;
  }

  return lines.join('\n');
}

const TEST_CSV = buildTestCsv();

export function getTestStats() {
  const rows = parseCSV(TEST_CSV);
  const months = groupByMonth(rows);
  return computeStatistics(months, {
    ownershipShare: 0.5,
    mortgageEndYear: 2046,
    mortgageEndMonth: 6,
    mortgageMonthlyPayment: 1180,
    travelMonthlySaving: TRAVEL_MONTHLY_SAVING,
  });
}

/** For tests: raw grouped months from the same synthetic sheet. */
export function getTestMonths() {
  const rows = parseCSV(TEST_CSV);
  return groupByMonth(rows);
}
