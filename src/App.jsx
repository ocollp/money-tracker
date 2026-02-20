import { useState, useEffect } from 'react';
import { parseCSV, groupByMonth } from './utils/parseCSV';
import { computeStatistics } from './utils/statistics';
import { formatMoney, formatChange, formatPct } from './utils/formatters';
import useGoogleAuth from './hooks/useGoogleAuth';
import { fetchSheetData } from './services/sheetsApi';
import { SPREADSHEET_ID, SPREADSHEET_ID_2 } from './config';
import LoginScreen from './components/LoginScreen';
import KpiCard from './components/KpiCard';
import NetWorthChart from './components/NetWorthChart';
import DistributionChart from './components/DistributionChart';
import CashVsInvestedChart from './components/CashVsInvestedChart';
import Heatmap from './components/Heatmap';
import StatsGrid from './components/StatsGrid';
import Patterns from './components/Patterns';
import MortgageCard from './components/MortgageCard';

const PROFILE_KEY = 'mt_profile';
const PROFILES = [
  { id: 'olga', name: 'Olga', sheetId: SPREADSHEET_ID },
  ...(SPREADSHEET_ID_2 ? [{ id: 'andrea', name: 'Andrea', sheetId: SPREADSHEET_ID_2 }] : []),
];

function getInitialProfile() {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved === 'andrea' && SPREADSHEET_ID_2) return 'andrea';
    return 'olga';
  } catch {
    return 'olga';
  }
}

export default function App() {
  const { user, accessToken, ready, login, logout, isLoggedIn } = useGoogleAuth();
  const [profile, setProfile] = useState(getInitialProfile);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentSheetId = PROFILES.find(p => p.id === profile)?.sheetId || SPREADSHEET_ID;

  useEffect(() => {
    if (!accessToken || !currentSheetId) return;

    setLoading(true);
    setError(null);

    fetchSheetData(accessToken, currentSheetId)
      .then(csvText => {
        const rows = parseCSV(csvText);
        const months = groupByMonth(rows);
        const s = computeStatistics(months);
        setStats(s);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [accessToken, currentSheetId]);

  const switchProfile = (id) => {
    setProfile(id);
    try {
      localStorage.setItem(PROFILE_KEY, id);
    } catch { /* ignore */ }
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={login} ready={ready} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary">Carregant dades...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-surface-alt rounded-2xl p-8 border border-red-500/30 text-center max-w-md space-y-4">
          <p className="text-negative text-lg font-medium">Error al carregar les dades</p>
          <p className="text-text-secondary text-sm">{error}</p>
          <button
            onClick={logout}
            className="text-sm text-text-secondary hover:text-brand transition-colors underline"
          >
            Tancar sessió i tornar-ho a provar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 bg-surface/80 backdrop-blur-xl z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Money<span className="text-brand">Tracker</span></h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {PROFILES.length > 1 && (
              <div className="flex rounded-xl bg-surface border border-border p-0.5">
                {PROFILES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => switchProfile(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${profile === p.id ? 'bg-brand text-white' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            {user && (
              <button
                onClick={logout}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-brand transition-colors"
              >
                {user.picture && (
                  <img src={user.picture} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
                )}
                <span className="hidden sm:inline">Tancar sessió</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            title="Mes actual"
            value={formatChange(stats.changeVsPrev)}
            subtitle={stats.changeVsPrevPct != null ? `vs mes anterior: ${formatPct(stats.changeVsPrevPct)}` : null}
            trend={stats.changeVsPrev}
            icon="📊"
          />
          <KpiCard
            title={`${new Date().getFullYear()}`}
            value={formatMoney(stats.current)}
            subtitle={stats.changeVsYearPct != null ? `vs any passat: ${formatPct(stats.changeVsYearPct)}` : null}
            trend={stats.changeVsYear ?? 0}
            icon="📈"
          />
          <KpiCard
            title="Mitjana mensual"
            value={formatChange(stats.avgChange)}
            subtitle={null}
            trend={stats.avgChange}
            icon="📉"
          />
          <KpiCard
            title="Coixí"
            value={stats.runway != null ? `${stats.runway} mesos` : '—'}
            subtitle={null}
            trend={0}
            icon="🛡️"
          />
        </section>

        <Heatmap data={stats.heatmap} />

        <NetWorthChart months={stats.months} totals={stats.liquidTotals} />

        {stats.hasHousing && <MortgageCard housing={stats.housing} />}

        <DistributionChart distribution={stats.distribution} title="On tens els diners" />

        <CashVsInvestedChart data={stats.cashVsInvested} />

        {stats.outlierChanges.length > 0 && (
          <div className="bg-warning/10 border border-warning/20 rounded-xl px-4 py-3 text-sm text-warning flex items-start gap-2.5">
            <span className="text-lg leading-none mt-0.5">⚡</span>
            <div>
              <span className="font-medium">Mesos atípics detectats: </span>
              <span className="text-text-secondary">
                {stats.outlierChanges.map(c =>
                  `${c.month.label} (${formatChange(c.value)})`
                ).join(', ')}
                . S'exclouen de les mitjanes per reflectir la meva vida normal.
              </span>
            </div>
          </div>
        )}

        <Patterns
          patterns={stats.patterns}
          yearComparison={stats.yearComparison}
        />
      </main>

    </div>
  );
}
