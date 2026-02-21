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
import Patterns from './components/Patterns';
import MortgageCard from './components/MortgageCard';

const PROFILE_KEY = 'mt_profile';
const PROFILES = [
  { id: 'olga', name: 'Olga', emoji: '👩🏼', sheetId: SPREADSHEET_ID },
  ...(SPREADSHEET_ID_2 ? [{ id: 'andrea', name: 'Andrea', emoji: '👩🏻', sheetId: SPREADSHEET_ID_2 }] : []),
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
    setStats(null);

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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">Money<span className="text-brand">Tracker</span></h1>
          <div className="flex items-center gap-2 sm:gap-4">
            {PROFILES.length > 1 && (
              <div className="flex rounded-lg sm:rounded-xl bg-surface border border-border p-0.5">
                {PROFILES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => switchProfile(p.id)}
                    className={`px-2 py-1 rounded-md sm:px-3 sm:py-1.5 sm:rounded-lg text-xs sm:text-sm font-medium transition-colors ${profile === p.id ? 'bg-brand text-white' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    {p.emoji} {p.name}
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

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <section className={`grid grid-cols-2 gap-2 sm:gap-3 ${stats.hasHousing ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          <KpiCard
            title="Mes actual"
            value={formatChange(stats.changeVsPrevTotal ?? stats.changeVsPrev)}
            subtitle={(stats.changeVsPrevPctTotal ?? stats.changeVsPrevPct) != null ? `${formatPct(stats.changeVsPrevPctTotal ?? stats.changeVsPrevPct)} respecte al mes anterior` : null}
            trend={stats.changeVsPrevTotal ?? stats.changeVsPrev ?? 0}
          />
          <KpiCard
            title="Diners i inversions"
            value={formatMoney(stats.current)}
            subtitle={(stats.changeVsYearPctTotal ?? stats.changeVsYearPct) != null ? `${formatPct(stats.changeVsYearPctTotal ?? stats.changeVsYearPct)} respecte l'any passat` : null}
            trend={stats.changeVsYearTotal ?? stats.changeVsYear ?? 0}
          />
          {stats.hasHousing && (
            <KpiCard
              title="Patrimoni total"
              value={formatMoney(stats.currentTotalWealth)}
              subtitle={null}
              trend={stats.changeVsYearTotal ?? stats.changeVsYear ?? 0}
            />
          )}
          <KpiCard
            title="Coixí"
            value={stats.runway != null ? `${stats.runway} mesos` : '—'}
            subtitle={null}
            trend={0}
          />
        </section>

        <Heatmap data={stats.heatmap} />

        <NetWorthChart
          months={stats.netWorthMonths}
          totals={stats.netWorthTotals}
          title="Diners i inversions"
          subtitle="Efectiu, comptes i inversions"
          tooltipLabel="Diners i inversions"
        />

        {stats.hasHousing && <MortgageCard housing={stats.housing} />}

        <CashVsInvestedChart data={stats.cashVsInvested} />

        <DistributionChart distribution={stats.distribution} title="Repartiment" />

        <Patterns yearComparison={stats.yearComparison} />
      </main>

    </div>
  );
}
