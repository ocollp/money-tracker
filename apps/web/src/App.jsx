import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { formatMoney, formatChange, formatPct, formatUpdatedClock } from './utils/formatters';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import useGoogleAuth from './hooks/useGoogleAuth';
import { useBackendProfile, clearAppJwt } from './hooks/useBackendProfile';
import { useSheetFinanceData } from './hooks/useSheetFinanceData';
import {
  buildFinanceConfig,
  financeConfigToSettingsFormShape,
  applyLocalProfileDisplay,
} from './lib/mergeFinanceConfig.js';
import { loadLocalProfileDisplay, saveLocalProfileDisplay } from './lib/localProfileDisplay.js';
import {
  PROFILE_EMAILS,
  PROFILE_PRIMARY_ID,
  PROFILE_SECONDARY_ID,
  SPREADSHEET_ID_2,
} from './config';
import LoginScreen from './components/LoginScreen';
import NoSheetAccessScreen from './components/NoSheetAccessScreen';
import ProfileSettings from './components/ProfileSettings';
import SideDrawer, { useSidebarLayout } from './components/SideDrawer';
import KpiCard from './components/KpiCard';
import NetWorthChart from './components/NetWorthChart';
import DistributionChart from './components/DistributionChart';
import Heatmap from './components/Heatmap';
import Patterns from './components/Patterns';
import MortgageCard from './components/MortgageCard';
import { useI18n } from './i18n/I18nContext.jsx';
import { generateInsight } from './utils/insights.js';

const PROFILE_KEY = 'mt_profile';

function isTestDataPath() {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname;
  return p === '/test' || p.endsWith('/test');
}

function normalizeStoredProfileId(saved) {
  if (!saved) return null;
  if (saved === PROFILE_PRIMARY_ID || saved === 'olga') return PROFILE_PRIMARY_ID;
  if (saved === PROFILE_SECONDARY_ID || saved === 'andrea') return PROFILE_SECONDARY_ID;
  return null;
}

function getInitialProfile() {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    const id = normalizeStoredProfileId(saved);
    if (id === PROFILE_SECONDARY_ID && SPREADSHEET_ID_2) return PROFILE_SECONDARY_ID;
    return PROFILE_PRIMARY_ID;
  } catch {
    return PROFILE_PRIMARY_ID;
  }
}

export default function App() {
  const { t } = useI18n();
  const isTestData = isTestDataPath();
  const {
    user,
    accessToken,
    appJwt,
    login,
    logout: googleLogout,
    clearAuth,
    needsRefresh,
    checkingSession,
    canLogin,
    authError,
  } = useGoogleAuth();
  const [profile, setProfile] = useState(getInitialProfile);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [insightToast, setInsightToast] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const insightTimer = useRef(null);
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar, width: sidebarWidth } = useSidebarLayout();
  const [localProfileUiTick, setLocalProfileUiTick] = useState(0);

  const { settings, backendReady, patchSettings, hasApi, apiUser } = useBackendProfile(accessToken, appJwt, clearAuth);
  const hasPersistedProfile = settings != null;
  const financeConfig = useMemo(() => {
    const base = buildFinanceConfig(settings);
    if (hasPersistedProfile) return base;
    return applyLocalProfileDisplay(base, loadLocalProfileDisplay());
  }, [settings, hasPersistedProfile, localProfileUiTick]);
  const settingsModalValues = useMemo(
    () => (hasPersistedProfile ? settings : financeConfigToSettingsFormShape(financeConfig)),
    [hasPersistedProfile, settings, financeConfig]
  );
  const settingsReadOnlySubtitle = hasPersistedProfile ? null : hasApi
      ? t.settingsApiNoProfile
      : t.settingsNoApi;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw === 'olga') localStorage.setItem(PROFILE_KEY, PROFILE_PRIMARY_ID);
      if (raw === 'andrea') localStorage.setItem(PROFILE_KEY, PROFILE_SECONDARY_ID);
    } catch {}
  }, []);

  useEffect(() => {
    if (profile === PROFILE_SECONDARY_ID && !financeConfig.spreadsheetId2) {
      setProfile(PROFILE_PRIMARY_ID);
      try {
        localStorage.setItem(PROFILE_KEY, PROFILE_PRIMARY_ID);
      } catch {}
    }
  }, [financeConfig.spreadsheetId2, profile]);

  const {
    sheetAccess,
    effectiveProfiles,
    effectiveProfile,
    stats,
    loading,
    error,
    refresh,
    lastUpdatedAt,
  } = useSheetFinanceData({ isTestData, accessToken, appJwt, profile, financeConfig });

  const { pullPx, progress, isPulling } = usePullToRefresh({
    onRefresh: refresh,
    disabled: isTestData,
    loading,
  });

  const showInsight = useCallback(() => {
    if (!stats) return;
    const msg = generateInsight(stats, t);
    if (!msg) return;
    if (insightTimer.current) clearTimeout(insightTimer.current);
    setInsightToast(msg);
    insightTimer.current = setTimeout(() => setInsightToast(null), 12000);
  }, [stats, t]);

  useEffect(() => () => { if (insightTimer.current) clearTimeout(insightTimer.current); }, []);

  const handleSaveLocalProfileDisplay = useCallback((patch) => {
    saveLocalProfileDisplay(patch);
    setLocalProfileUiTick((t) => t + 1);
  }, []);

  const entityNetWorth = useMemo(() => {
    if (!selectedEntity || !stats) return null;

    const liquidTotals = stats.entityEvolution.map(e => e[selectedEntity] || 0);
    const hasLiquidData = liquidTotals.some(v => v !== 0);

    if (hasLiquidData) {
      return {
        months: stats.entityEvolution.map(e => ({ shortLabel: e.date, key: e.key })),
        totals: liquidTotals,
      };
    }

    // Entity not in liquid evolution — try housing data (e.g. "Hipoteca BBVA" → BBVA in byEntityHousing)
    const housingKey = selectedEntity.replace(/^Hipoteca\s+|^Compte corrent\s+/i, '').trim();
    const housingTotals = stats.months.map(m => {
      const h = m.byEntityHousing?.[housingKey] || m.byEntityHousing?.[selectedEntity];
      if (!h) return 0;
      return (h.value || 0) + (h.debt || 0);
    });
    const hasHousingData = housingTotals.some(v => v !== 0);
    if (hasHousingData) {
      return {
        months: stats.months.map(m => ({ shortLabel: m.shortLabel, key: m.key })),
        totals: housingTotals,
      };
    }

    return {
      months: stats.entityEvolution.map(e => ({ shortLabel: e.date, key: e.key })),
      totals: liquidTotals,
    };
  }, [selectedEntity, stats]);

  const effectiveUser = isTestData ? { name: 'Test', email: '', picture: null } : (apiUser || user);

  const switchProfile = (id) => {
    setProfile(id);
    try {
      localStorage.setItem(PROFILE_KEY, id);
    } catch {}
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

  if (!isTestData && (!user || needsRefresh)) {
    return (
      <LoginScreen
        onLogin={() => login(PROFILE_EMAILS[profile])}
        checkingSession={checkingSession}
        canLogin={canLogin}
        authError={authError}
      />
    );
  }

  if (!isTestData && user && sheetAccess && !sheetAccess.id1 && !sheetAccess.id2) {
    const primarySid = String(financeConfig.spreadsheetId || '').trim();
    const hasPrimarySheetId = Boolean(primarySid);
    const hasSecondarySheetConfigured = Boolean(String(financeConfig.spreadsheetId2 || '').trim());
    return (
      <NoSheetAccessScreen
        onLogout={() => { googleLogout(); clearAppJwt(); }}
        hasPrimarySheetId={hasPrimarySheetId}
        primarySpreadsheetId={primarySid}
        hasSecondarySheetConfigured={hasSecondarySheetConfigured}
        userEmail={effectiveUser?.email}
        canSaveSpreadsheetViaApi={Boolean(hasApi && backendReady && settings)}
        patchSettings={patchSettings}
      />
    );
  }

  if (!isTestData && hasApi && !backendReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary">{t.syncingProfile}</span>
        </div>
      </div>
    );
  }

  if (!isTestData && user && sheetAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary">{t.checkingAccess}</span>
        </div>
      </div>
    );
  }

  if ((loading && !isTestData) || (isTestData && !stats)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary">{isTestData ? t.loadingTestData : t.loadingData}</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-surface-alt/90 rounded-2xl p-8 border border-white/[0.06] shadow-xl text-center max-w-md space-y-4">
          <p className="text-negative text-lg font-medium">{t.errorLoadingData}</p>
          <p className="text-text-secondary text-sm">{error}</p>
          <button
            onClick={() => { googleLogout(); clearAppJwt(); }}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-all duration-200 underline active:opacity-80"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t.logoutAndRetry}
          </button>
        </div>
      </div>
    );
  }

  const updatedLabel = formatUpdatedClock(lastUpdatedAt);

  const kpiCount = 2 + (stats.hasTravel ? 1 : 0) + (stats.hasHousing ? 1 : 0);
  const kpiLgCols =
    kpiCount >= 4 ? 'lg:grid-cols-4' : kpiCount === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2';

  return (
    <div className="min-h-screen min-h-dvh flex flex-col sidebar-offset" style={{ '--sidebar-w': `${sidebarWidth}px` }}>
      <div
        className="fixed left-0 right-0 z-[25] flex justify-center pointer-events-none transition-opacity duration-150 sm:hidden"
        style={{
          top: 'max(4.5rem, calc(env(safe-area-inset-top, 0px) + 3.5rem))',
          opacity: isPulling ? 1 : 0,
          transform: `translateY(${Math.min(pullPx * 0.3, 24)}px)`,
        }}
        aria-hidden
      >
        <div
          className="rounded-full bg-surface-alt/95 border border-white/10 px-3 py-1.5 text-xs text-text-secondary shadow-lg flex items-center gap-2"
          style={{ opacity: 0.5 + progress * 0.5 }}
        >
          <span
            className="inline-block w-4 h-4 border-2 border-brand border-t-transparent rounded-full"
            style={{ transform: `rotate(${progress * 250}deg)` }}
          />
          {t.pullToRefresh}
        </div>
      </div>

      <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-xl border-b border-white/[0.06] pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
        <div className="mx-auto px-3 sm:px-6 lg:px-10 pb-2 sm:pb-3 pt-1 sm:pt-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 shrink min-w-0">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="sm:hidden min-h-11 min-w-11 -ml-1 rounded-lg text-text-secondary hover:text-text-primary transition-colors inline-flex items-center justify-center"
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-text-primary shrink min-w-0">
                {t.appTitle}
              </h1>
            </div>

            {(() => {
              const active = effectiveProfiles.find((p) => p.id === effectiveProfile);
              if (!active) return null;
              return (
                <span className="sm:hidden text-xl shrink-0" aria-label={active.name}>
                  {active.emoji}
                </span>
              );
            })()}
          </div>

        </div>
      </header>

      <main
        ref={mainRef}
        className="mx-auto px-3 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6 touch-pan-y flex-1 pb-2 w-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: effectiveProfiles.length === 2 ? 'pan-y' : undefined }}
      >
        <section className={`grid gap-3 sm:gap-4 grid-cols-2 ${kpiLgCols}`}>
          <KpiCard
            title={t.kpiCurrentMonth}
            value={formatChange(stats.changeVsPrevTotal ?? stats.changeVsPrev)}
            subtitle={(stats.changeVsPrevPctTotal ?? stats.changeVsPrevPct) != null ? t.kpiVsPrevMonth(formatPct(stats.changeVsPrevPctTotal ?? stats.changeVsPrevPct)) : null}
            trend={stats.changeVsPrevTotal ?? stats.changeVsPrev ?? 0}
            icon="🗓️"
          />
          <KpiCard
            title={t.kpiMoneyAndInvestments}
            value={formatMoney(stats.current)}
            subtitle={(stats.changeVsYearPctTotal ?? stats.changeVsYearPct) != null ? t.kpiVsPrevYear(formatPct(stats.changeVsYearPctTotal ?? stats.changeVsYearPct)) : null}
            trend={stats.changeVsYearTotal ?? stats.changeVsYear ?? 0}
            icon="💰"
          />
          {stats.hasTravel && stats.travel && (
            <KpiCard
              className={stats.hasHousing ? '' : 'col-span-2 lg:col-span-1'}
              title={t.travelTitle}
              value={formatMoney((stats.travel.current ?? 0) * 2)}
              subtitle={
                (stats.travel.spentLastMonth ?? 0) > 0
                  ? `${t.travelSpentLastMonth}: ${formatMoney((stats.travel.spentLastMonth ?? 0) * 2)}`
                  : null
              }
              trend={0}
              subtitleColor={(stats.travel.spentLastMonth ?? 0) > 0 ? 'text-negative' : undefined}
              icon="✈️"
            />
          )}
          {stats.hasHousing && (
            <KpiCard
              className={kpiCount === 3 ? 'col-span-2 lg:col-span-1' : ''}
              title={t.kpiTotalWealth}
              value={formatMoney(stats.currentTotalWealth)}
              subtitle={null}
              trend={0}
              icon="💸"
            />
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:items-stretch">
          <DistributionChart
            distribution={stats.distribution}
            title={t.distributionTitle}
            selectedEntity={selectedEntity}
            onSelectEntity={setSelectedEntity}
            entityEvolution={stats.entityEvolution}
          />
          <div className="h-full min-h-0">
            <NetWorthChart
              months={entityNetWorth ? entityNetWorth.months : stats.netWorthMonths}
              totals={entityNetWorth ? entityNetWorth.totals : stats.netWorthTotals}
              title={selectedEntity || t.netWorthTitle}
              subtitle={null}
              tooltipLabel={selectedEntity || t.netWorthTooltip}
            />
          </div>
        </div>

        <Heatmap data={stats.heatmap} />

        {stats.hasHousing && (
          <MortgageCard housing={stats.housing} />
        )}

        <Patterns yearComparison={stats.yearComparison} />
      </main>

      <footer className="mx-auto w-full px-3 sm:px-6 lg:px-10 mt-4 pt-4 border-t border-white/[0.06] text-center text-[11px] sm:text-xs text-text-secondary/90 space-y-1.5 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
        {isTestData ? (
          <p>{t.testMode}</p>
        ) : (
          <>
            {updatedLabel ? (
              <p className="text-text-secondary">
                {t.dataUpdatedAt}{' '}
                <time
                  dateTime={
                    lastUpdatedAt instanceof Date && !Number.isNaN(lastUpdatedAt.getTime())
                      ? lastUpdatedAt.toISOString()
                      : undefined
                  }
                >
                  {updatedLabel}
                </time>
              </p>
            ) : null}
            <p className="sm:hidden text-text-secondary/80">{t.pullDownHint}</p>
          </>
        )}
      </footer>

      <ProfileSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settingsModalValues}
        settingsVariant={hasPersistedProfile ? 'api' : 'local-display'}
        onSave={hasPersistedProfile ? patchSettings : undefined}
        onSaveLocalDisplay={!hasPersistedProfile ? handleSaveLocalProfileDisplay : undefined}
        readOnly={false}
        readOnlySubtitle={!hasPersistedProfile ? settingsReadOnlySubtitle : null}
      />

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        user={effectiveUser}
        effectiveProfiles={effectiveProfiles}
        effectiveProfile={effectiveProfile}
        onSwitchProfile={switchProfile}
        onSettings={() => setSettingsOpen(true)}
        onRefresh={refresh}
        onLogout={() => { googleLogout(); clearAppJwt(); }}
        loading={loading}
        isTestData={isTestData}
        t={t}
        stats={stats}
        onInsight={showInsight}
      />

      {insightToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] animate-[fadeSlideUp_0.3s_ease-out]"
        >
          <div className="relative bg-surface-alt/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-5 py-4 shadow-2xl">
            <p className="text-sm text-text-primary leading-relaxed pr-6">{insightToast}</p>
            <button
              type="button"
              onClick={() => { if (insightTimer.current) clearTimeout(insightTimer.current); setInsightToast(null); }}
              className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-text-secondary/50 hover:text-text-primary hover:bg-white/[0.06] transition-colors"
              aria-label="Close"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
