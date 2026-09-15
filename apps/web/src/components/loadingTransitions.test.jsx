import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CarGoal from './CarGoal.jsx';
import DistributionChart from './DistributionChart.jsx';

vi.mock('../context/PrivacyContext.jsx', () => ({ usePrivacy: () => ({ hideMoney: false }) }));
vi.mock('../i18n/I18nContext.jsx', () => ({ useI18n: () => ({ t: {} }) }));
vi.mock('../services/sheetsApi.js', () => ({
  fetchSheetData: vi.fn(() => new Promise(() => {})),
  fetchSheetDataViaBackend: vi.fn(() => new Promise(() => {})),
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: () => null,
  PieChart: () => null,
  Pie: () => null,
  Cell: () => null,
  Tooltip: () => null,
}));

let root;
let container;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

describe('dashboard loading transitions', () => {
  it('keeps the car goal visible when profile access resolves to only the current profile', async () => {
    const own = { id: 'primary', name: 'Olga', sheetId: 'own' };
    const peer = { id: 'secondary', name: 'Andrea', sheetId: 'peer' };
    const props = { profile: 'primary', months: [{ entries: [] }], price: 21500, onPriceChange: vi.fn() };
    await act(async () => root.render(<CarGoal {...props} profiles={[own, peer]} />));
    await act(async () => root.render(<CarGoal {...props} profiles={[own]} />));
    expect(container.textContent).toContain('Comprar un cotxe');
    expect(container.textContent).toContain('Saldo no disponible');
  });

  it('renders the car goal without a configured peer sheet on initial load', async () => {
    await act(async () => root.render(<CarGoal profiles={[]} profile="secondary" months={[]} price={21500} onPriceChange={vi.fn()} />));
    expect(container.textContent).toContain('Comprar un cotxe');
  });

  it('supports distribution data disappearing and returning during refresh', async () => {
    const distribution = [{ name: 'Compte remunerat', value: 1000 }];
    const render = async (data) => act(async () => root.render(<DistributionChart distribution={data} title="Distribució" />));
    await render(distribution);
    await render([]);
    expect(container.textContent).toBe('');
    await render(distribution);
    expect(container.textContent).toContain('Distribució');
  });
});
