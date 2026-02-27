import { useState, useEffect, useRef, useCallback } from 'react';
import { parseCSV, groupByMonth } from './utils/parseCSV';
import { computeStatistics } from './utils/statistics';
import { formatMoney, formatChange, formatPct } from './utils/formatters';
import useGoogleAuth from './hooks/useGoogleAuth';
import { fetchSheetData, checkSheetAccess } from './services/sheetsApi';
import { getTestStats } from './data/testData';
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
const PROFILE_OLGA = { id: 'olga', name: 'Olga', emoji: '👩🏼', sheetId: SPREADSHEET_ID };
const PROFILE_ANDREA = { id: 'andrea', name: 'Andrea', emoji: '👩🏻', sheetId: SPREADSHEET_ID_2 };

function isTestDataPath() {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname;
  return p === '/test' || p.endsWith('/test');
}

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
  const isTestData = isTestDataPath();
  const { user, accessToken, ready, login, logout, needsRefresh } = useGoogleAuth();
  const [profile, setProfile] = useState(getInitialProfile);
  const [sheetAccess, setSheetAccess] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchKey, setFetchKey] = useState(0);

  const effectiveUser = isTestData ? { name: 'Test', email: '', picture: null } : user;

  useEffect(() => {
    if (!isTestData) return;
    setSheetAccess({ id1: true, id2: false });
    setStats(getTestStats());
  }, [isTestData]);

  const effectiveProfiles = !sheetAccess
    ? []
    : [
        ...(sheetAccess.id1 ? [PROFILE_OLGA] : []),
        ...(sheetAccess.id2 && SPREADSHEET_ID_2 ? [PROFILE_ANDREA] : []),
      ];
  const effectiveProfile =
    effectiveProfiles.length === 1
      ? effectiveProfiles[0].id
      : effectiveProfiles.some(p => p.id === profile)
        ? profile
        : effectiveProfiles[0]?.id || 'olga';
  const currentSheetId = effectiveProfiles.find(p => p.id === effectiveProfile)?.sheetId || SPREADSHEET_ID;

  useEffect(() => {
    if (isTestData || !accessToken) {
      if (!isTestData) setSheetAccess(null);
      return;
    }
    let cancelled = false;
    Promise.all([
      checkSheetAccess(accessToken, SPREADSHEET_ID),
      SPREADSHEET_ID_2 ? checkSheetAccess(accessToken, SPREADSHEET_ID_2) : Promise.resolve(false),
    ]).then(([id1, id2]) => {
      if (!cancelled) setSheetAccess({ id1: !!id1, id2: !!id2 });
    });
    return () => { cancelled = true; };
  }, [accessToken, isTestData]);

  useEffect(() => {
    if (isTestData) return;
    if (!accessToken || !sheetAccess || !currentSheetId) return;
    if (!sheetAccess.id1 && !sheetAccess.id2) return;

    setLoading(true);
    setError(null);
    setStats(null);

    fetchSheetData(accessToken, currentSheetId)
      .then(csvText => {
        const rows = parseCSV(csvText);
        const months = groupByMonth(rows);
        const s = computeStatistics(months, { profileId: effectiveProfile });
        setStats(s);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [accessToken, sheetAccess, currentSheetId, fetchKey]);

  const POLL_INTERVAL_MS = 45 * 1000;
  useEffect(() => {
    if (isTestData || !accessToken || !currentSheetId || !stats) return;
    const intervalId = setInterval(() => {
      fetchSheetData(accessToken, currentSheetId)
        .then(csvText => {
          const rows = parseCSV(csvText);
          const months = groupByMonth(rows);
          const s = computeStatistics(months, { profileId: effectiveProfile });
          setStats(s);
        })
        .catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [isTestData, accessToken, currentSheetId, effectiveProfile, stats]);

  const switchProfile = (id) => {
    setProfile(id);
    try {
      localStorage.setItem(PROFILE_KEY, id);
    } catch { /* ignore */ }
  };

  const mainRef = useRef(null);
  const swipeStart = useRef({ x: 0, y: 0 });
  const swipeLock = useRef(false);
  const handleTouchStart = (e) => {
    if (effectiveProfiles.length !== 2) return;
    const t = e.touches[0];
    swipeStart.current = { x: t.clientX, y: t.clientY };
    swipeLock.current = false;
  };
  const handleTouchMove = useCallback((e) => {
    if (effectiveProfiles.length !== 2) return;
    const t = e.touches[0];
    const dx = t.clientX - swipeStart.current.x;
    const dy = t.clientY - swipeStart.current.y;
    if (!swipeLock.current && (Math.abs(dx) > 50 || Math.abs(dy) > 50)) {
      swipeLock.current = Math.abs(dx) > Math.abs(dy);
      if (swipeLock.current) e.preventDefault();
    } else if (swipeLock.current) e.preventDefault();
  }, [effectiveProfiles.length]);
  const handleTouchEnd = (e) => {
    if (effectiveProfiles.length !== 2) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeStart.current.x;
    if (swipeLock.current && Math.abs(dx) > 50) {
      const idx = effectiveProfiles.findIndex(p => p.id === effectiveProfile);
      const next = dx < 0 ? (idx + 1) % effectiveProfiles.length : (idx - 1 + effectiveProfiles.length) % effectiveProfiles.length;
      switchProfile(effectiveProfiles[next].id);
    }
  };
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  }, [handleTouchMove]);

  if (!effectiveUser || (needsRefresh && !isTestData)) {
    return <LoginScreen onLogin={login} ready={ready} />;
  }

  if (!isTestData && accessToken && sheetAccess && !sheetAccess.id1 && !sheetAccess.id2) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-surface-alt/90 rounded-2xl p-8 border border-white/[0.06] shadow-xl text-center max-w-md space-y-4">
          <p className="text-negative text-lg font-medium">Error al carregar les dades</p>
          <p className="text-text-secondary text-sm">No tens accés a cap dels fulls de càlcul configurats.</p>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-all duration-200 underline active:opacity-80"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Tancar sessió
          </button>
        </div>
      </div>
    );
  }

  if (!isTestData && accessToken && sheetAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary">Comprovant accés...</span>
        </div>
      </div>
    );
  }

  if ((loading && !isTestData) || (isTestData && !stats)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary">{isTestData ? 'Carregant dades de test...' : 'Carregant dades...'}</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-surface-alt/90 rounded-2xl p-8 border border-white/[0.06] shadow-xl text-center max-w-md space-y-4">
          <p className="text-negative text-lg font-medium">Error al carregar les dades</p>
          <p className="text-text-secondary text-sm">{error}</p>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-all duration-200 underline active:opacity-80"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Tancar sessió i tornar-ho a provar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-surface/70 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-text-primary">Finances <span className="text-brand">personals</span></h1>
          <div className="flex items-center justify-end gap-1 sm:gap-2">
            {effectiveProfiles.length > 1 && (
              <div className="flex rounded-xl bg-surface-alt/80 border border-white/[0.06] p-0.5 shadow-sm shrink-0">
                {effectiveProfiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => switchProfile(p.id)}
                    className={`px-2 py-1 rounded-md sm:px-3 sm:py-1.5 sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${effectiveProfile === p.id ? 'bg-brand text-white scale-100' : 'text-text-secondary hover:text-text-primary hover:scale-[1.02] active:scale-[0.98]'}`}
                  >
                    {p.emoji} {p.name}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1 sm:gap-2">
              {!isTestData && (
                <>
                  <button
                    type="button"
                    onClick={() => setFetchKey(k => k + 1)}
                    disabled={loading}
                    className="p-2 rounded-lg text-text-secondary hover:text-brand hover:bg-surface transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                    title="Actualitzar dades"
                    aria-label="Actualitzar dades"
                  >
                    <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <a
                    href={`${import.meta.env.BASE_URL || ''}test`}
                    className="p-2 rounded-lg text-text-secondary hover:text-brand hover:bg-surface transition-all duration-200 hover:scale-110 active:scale-95"
                    title="Dades de test"
                    aria-label="Dades de test"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </a>
                </>
              )}
              {effectiveUser && (
                isTestData ? (
                  <a
                    href={import.meta.env.BASE_URL || '/'}
                    className="p-2 rounded-lg text-text-secondary hover:text-brand hover:bg-surface transition-all duration-200 hover:scale-110 active:scale-95"
                    title="Sortir"
                    aria-label="Sortir"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </a>
                ) : (
                  <button
                    onClick={logout}
                    className="p-2 rounded-lg text-text-secondary hover:text-brand hover:bg-surface transition-all duration-200 hover:scale-110 active:scale-95"
                    title="Tancar sessió"
                    aria-label="Tancar sessió"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      <main
        ref={mainRef}
        className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: effectiveProfiles.length === 2 ? 'pan-y' : undefined }}
      >
        <section className={`grid gap-3 sm:gap-4 grid-cols-2 ${stats.hasHousing ? 'lg:grid-cols-3' : ''}`}>
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
              className="col-span-2 lg:col-span-1"
              title="Patrimoni total"
              value={formatMoney(stats.currentTotalWealth)}
              subtitle={null}
              trend={stats.changeVsYearTotal ?? stats.changeVsYear ?? 0}
            />
          )}
        </section>

        <Heatmap data={stats.heatmap} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:items-stretch">
          <div className={`h-full min-h-0 ${stats.hasHousing ? '' : 'lg:col-span-2'}`}>
            <NetWorthChart
              months={stats.netWorthMonths}
              totals={stats.netWorthTotals}
              title="Diners i inversions"
              subtitle={null}
              tooltipLabel="Diners i inversions"
            />
          </div>
          {stats.hasHousing && (
            <MortgageCard housing={stats.housing} />
          )}
          <DistributionChart distribution={stats.distribution} title="Repartiment" />
          <CashVsInvestedChart data={stats.cashVsInvested} />
        </div>

        <Patterns yearComparison={stats.yearComparison} />
      </main>

    </div>
  );
}
