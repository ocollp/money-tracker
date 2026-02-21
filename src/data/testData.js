import { parseCSV, groupByMonth } from '../utils/parseCSV';
import { computeStatistics } from '../utils/statistics';

const TEST_CSV = `fecha,mes,año,tipo,categoria,entidad,cantidad
15/01/2025,1,2025,Cash,Efectivo,BBVA,1200
15/01/2025,1,2025,Invertido,Fons,Indexa,1800
15/01/2025,1,2025,Cash,Compte,Revolut,600
15/02/2025,2,2025,Cash,Efectivo,BBVA,1450
15/02/2025,2,2025,Invertido,Fons,Indexa,2100
15/02/2025,2,2025,Cash,Compte,Revolut,750
15/03/2025,3,2025,Cash,Efectivo,BBVA,1100
15/03/2025,3,2025,Invertido,Fons,Indexa,2400
15/03/2025,3,2025,Cash,Compte,Revolut,500
15/04/2025,4,2025,Cash,Efectivo,BBVA,1700
15/04/2025,4,2025,Invertido,Fons,Indexa,2500
15/04/2025,4,2025,Cash,Compte,Revolut,900
15/05/2025,5,2025,Cash,Efectivo,BBVA,1550
15/05/2025,5,2025,Invertido,Fons,Indexa,2700
15/05/2025,5,2025,Cash,Compte,Revolut,850
15/06/2025,6,2025,Cash,Efectivo,BBVA,1900
15/06/2025,6,2025,Invertido,Fons,Indexa,2900
15/06/2025,6,2025,Cash,Compte,Revolut,1000
15/07/2025,7,2025,Cash,Efectivo,BBVA,1650
15/07/2025,7,2025,Invertido,Fons,Indexa,3100
15/07/2025,7,2025,Cash,Compte,Revolut,950
15/08/2025,8,2025,Cash,Efectivo,BBVA,1400
15/08/2025,8,2025,Invertido,Fons,Indexa,3300
15/08/2025,8,2025,Cash,Compte,Revolut,800
15/09/2025,9,2025,Cash,Efectivo,BBVA,2100
15/09/2025,9,2025,Invertido,Fons,Indexa,3500
15/09/2025,9,2025,Cash,Compte,Revolut,1100
15/10/2025,10,2025,Cash,Efectivo,BBVA,1850
15/10/2025,10,2025,Invertido,Fons,Indexa,3700
15/10/2025,10,2025,Cash,Compte,Revolut,1050
15/11/2025,11,2025,Cash,Efectivo,BBVA,2200
15/11/2025,11,2025,Invertido,Fons,Indexa,3900
15/11/2025,11,2025,Cash,Compte,Revolut,1200
15/12/2025,12,2025,Cash,Efectivo,BBVA,2400
15/12/2025,12,2025,Invertido,Fons,Indexa,4100
15/12/2025,12,2025,Cash,Compte,Revolut,1300
01/12/2025,12,2025,Cash,Vivienda personal,BBVA,300000
01/12/2025,12,2025,Cash,Hipoteca,BBVA,-280000
15/01/2026,1,2026,Cash,Efectivo,BBVA,2600
15/01/2026,1,2026,Invertido,Fons,Indexa,4300
15/01/2026,1,2026,Cash,Compte,Revolut,1400
15/02/2026,2,2026,Cash,Efectivo,BBVA,2800
15/02/2026,2,2026,Invertido,Fons,Indexa,4500
15/02/2026,2,2026,Cash,Compte,Revolut,1500
01/02/2026,2,2026,Cash,Vivienda personal,BBVA,300000
01/02/2026,2,2026,Cash,Hipoteca,BBVA,-278500`;

export function getTestStats() {
  const rows = parseCSV(TEST_CSV);
  const months = groupByMonth(rows);
  return computeStatistics(months);
}
