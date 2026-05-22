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
  API_URL,
  TRAVEL_PATRIMONY_SHARE,
} from './config';
import LoginScreen from './components/LoginScreen';
import NoSheetAccessScreen from './components/NoSheetAccessScreen';
import { usePasskey } from './hooks/usePasskey.js';
import ProfileSettings from './components/ProfileSettings';
import SideDrawer, { useSidebarLayout } from './components/SideDrawer';
import KpiCard from './components/KpiCard';
import NetWorthChart from './components/NetWorthChart';
import DistributionChart from './components/DistributionChart';
import Heatmap from './components/Heatmap';
import Patterns from './components/Patterns';
import MortgageCard from './components/MortgageCard';
import AddMonthModal from './components/AddMonthModal';
import DashboardLoadingShell from './components/DashboardLoadingShell';
import LoadingProgressRing from './components/LoadingProgressRing';
import DashboardHeader from './components/DashboardHeader';
import { useI18n } from './i18n/I18nContext.jsx';
import { ASSET_CLASS_LABELS } from './utils/assetClassBuckets.js';

const PROFILE_KEY = 'mt_profile';

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
  const {
    user,
    accessToken,
    appJwt,
    login,
    loginWithPasskeyResult,
    logout: googleLogout,
    clearAuth,
    isLoggedIn,
    needsRefresh,
    checkingSession,
    authError,
  } = useGoogleAuth();
  const [profile, setProfile] = useState(getInitialProfile);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addMonthOpen, setAddMonthOpen] = useState(false);
  const [selectedAssetClasses, setSelectedAssetClasses] = useState([]);
  const [loaderCompleteOverlay, setLoaderCompleteOverlay] = useState(false);
  const showedInitialLoaderRef = useRef(false);

  const handleDistributionEntitySelect = useCallback((name) => {
    if (name == null) {
      setSelectedAssetClasses([]);
      return;
    }
    setSelectedAssetClasses((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  }, []);
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar, width: sidebarWidth } = useSidebarLayout();
  const [localProfileUiTick, setLocalProfileUiTick] = useState(0);

  const passkey = usePasskey({ onLoginSuccess: loginWithPasskeyResult });
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
    isRefreshing,
    error,
    refresh,
    lastUpdatedAt,
    currentSheetId,
  } = useSheetFinanceData({ accessToken, appJwt, profile, financeConfig });

  const assetClassNetWorth = useMemo(() => {
    if (!selectedAssetClasses.length || !stats?.assetClassEvolution?.length) return null;
    const series = stats.assetClassEvolution;
    const first = series[0];
    const names = selectedAssetClasses.filter((n) =>
      Object.prototype.hasOwnProperty.call(first, n),
    );
    if (!names.length) return null;
    const totals = series.map((e) =>
      names.reduce((sum, n) => sum + (e[n] ?? 0), 0),
    );
    if (!totals.some((v) => v !== 0)) return null;
    return {
      months: series.map((e) => ({ shortLabel: e.date, key: e.key })),
      totals,
      labels: names,
    };
  }, [selectedAssetClasses, stats]);

  const entityChange = useMemo(() => {
    if (!assetClassNetWorth) return null;
    const t = assetClassNetWorth.totals;
    if (t.length < 2) return null;
    const current = t[t.length - 1];
    const prev = t[t.length - 2];
    const change = current - prev;
    const pct = prev !== 0 ? (change / Math.abs(prev)) * 100 : null;
    return { change, pct, current };
  }, [assetClassNetWorth]);

  useEffect(() => {
    if (!selectedAssetClasses.length || !stats?.assetClassEvolution?.length) return;
    const series = stats.assetClassEvolution;
    const first = series[0];
    const valid = selectedAssetClasses.filter((n) =>
      Object.prototype.hasOwnProperty.call(first, n),
    );
    const totals = series.map((e) =>
      valid.reduce((sum, n) => sum + (e[n] ?? 0), 0),
    );
    if (!valid.length || !totals.some((v) => v !== 0)) {
      setSelectedAssetClasses([]);
      return;
    }
    if (valid.length !== selectedAssetClasses.length) {
      setSelectedAssetClasses(valid);
    }
  }, [selectedAssetClasses, stats]);

  useEffect(() => {
    if (!stats) {
      setLoaderCompleteOverlay(false);
      return;
    }
    if (!showedInitialLoaderRef.current) return;
    showedInitialLoaderRef.current = false;
    setLoaderCompleteOverlay(true);
    const id = setTimeout(() => setLoaderCompleteOverlay(false), 560);
    return () => clearTimeout(id);
  }, [stats]);

  const { pullPx, progress, isPulling } = usePullToRefresh({
    onRefresh: refresh,
    disabled: !stats,
    loading: loading && !stats,
  });

  const handleSaveLocalProfileDisplay = useCallback((patch) => {
    saveLocalProfileDisplay(patch);
    setLocalProfileUiTick((t) => t + 1);
  }, []);

  const effectiveUser = apiUser || user;

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

  if (!isLoggedIn || needsRefresh) {
    return (
      <LoginScreen
        onLogin={() => login(PROFILE_EMAILS[profile])}
        checkingSession={checkingSession}
        authError={authError}
        passkey={passkey}
      />
    );
  }

  if (user && sheetAccess && !sheetAccess.id1 && !sheetAccess.id2) {
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

  if (error && !stats && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md space-y-4">
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

  if (!stats) {
    showedInitialLoaderRef.current = true;
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
            className="rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] px-3 py-1.5 text-xs text-text-secondary shadow-lg flex items-center gap-2"
            style={{ opacity: 0.5 + progress * 0.5 }}
          >
            <span
              className="inline-block w-4 h-4 border-2 border-brand border-t-transparent rounded-full"
              style={{ transform: `rotate(${progress * 250}deg)` }}
            />
            {t.pullToRefresh}
          </div>
        </div>

        <DashboardHeader
          t={t}
          onOpenDrawer={() => setDrawerOpen(true)}
          effectiveProfiles={effectiveProfiles}
          effectiveProfile={effectiveProfile}
        />

        <DashboardLoadingShell
          loading={loading}
          loadingLabel={t.loadingData}
          mainRef={mainRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          touchAction={effectiveProfiles.length === 2 ? 'pan-y' : undefined}
        />

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
          onLogout={() => { googleLogout(); clearAppJwt(); }}
          t={t}
          stats={null}
          onAddMonth={() => { setAddMonthOpen(true); setDrawerOpen(false); }}
          passkey={passkey}
        />
      </div>
    );
  }

  const updatedLabel = formatUpdatedClock(lastUpdatedAt);

  const kpiCount = 2 + (stats.hasTravel ? 1 : 0) + (stats.hasHousing ? 1 : 0);
  const kpiLgCols =
    kpiCount >= 4 ? 'lg:grid-cols-4' : kpiCount === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2';

  const monthDelta = entityChange
    ? entityChange.change
    : (stats.changeVsPrevTotal ?? stats.changeVsPrev);
  const monthDeltaPct = entityChange
    ? entityChange.pct
    : (stats.changeVsPrevPctTotal ?? stats.changeVsPrevPct);

  const liquidDelta = entityChange ? entityChange.change : stats.changeVsPrev;
  const liquidPct = entityChange ? entityChange.pct : stats.changeVsPrevPct;

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
          className="rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] px-3 py-1.5 text-xs text-text-secondary shadow-lg flex items-center gap-2"
          style={{ opacity: 0.5 + progress * 0.5 }}
        >
          <span
            className="inline-block w-4 h-4 border-2 border-brand border-t-transparent rounded-full"
            style={{ transform: `rotate(${progress * 250}deg)` }}
          />
          {t.pullToRefresh}
        </div>
      </div>

      <DashboardHeader
        t={t}
        onOpenDrawer={() => setDrawerOpen(true)}
        effectiveProfiles={effectiveProfiles}
        effectiveProfile={effectiveProfile}
      />

      {loaderCompleteOverlay ? (
        <div
          className="fixed top-0 right-0 bottom-0 z-[28] flex items-center justify-center bg-[#080c10]/80 backdrop-blur-md animate-loader-overlay-out pointer-events-none"
          style={{ left: 'var(--sidebar-w, 0px)' }}
          aria-hidden
        >
          <LoadingProgressRing progress={100} label={t.loadingData} />
        </div>
      ) : null}

      <main
        ref={mainRef}
        className={`mx-auto px-3 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6 touch-pan-y flex-1 pb-2 w-full transition-opacity duration-300 ${
          isRefreshing ? 'opacity-[0.92]' : 'opacity-100'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: effectiveProfiles.length === 2 ? 'pan-y' : undefined }}
        aria-busy={isRefreshing || undefined}
      >
        <section className={`grid gap-3 sm:gap-4 grid-cols-2 ${kpiLgCols}`}>
          <KpiCard
            title={t.kpiCurrentMonth}
            value={formatChange(monthDelta)}
            privacyPct={monthDeltaPct}
            subtitle={
              monthDeltaPct != null && !Number.isNaN(monthDeltaPct)
                ? t.kpiVsPrevMonth(formatPct(monthDeltaPct))
                : null
            }
            trend={monthDelta != null ? monthDelta : 0}
            icon="🗓️"
          />
          <KpiCard
            title={t.kpiMoneyAndInvestments}
            value={formatMoney(entityChange ? entityChange.current : stats.current)}
            privacyPct={liquidPct}
            subtitle={
              liquidPct != null && !Number.isNaN(liquidPct)
                ? t.kpiVsPrevMonth(formatPct(liquidPct))
                : null
            }
            trend={liquidDelta != null ? liquidDelta : 0}
            icon="💰"
          />
          {stats.hasTravel && stats.travel && (
            <KpiCard
              className={stats.hasHousing ? '' : 'col-span-2 lg:col-span-1'}
              title={t.travelTitle}
              value={formatMoney(stats.travel.current ?? 0)}
              subtitle={
                (stats.travel.spentLastMonth ?? 0) > 0
                  ? typeof t.travelSpentLastMonth === 'function'
                    ? t.travelSpentLastMonth(formatMoney(stats.travel.spentLastMonth ?? 0))
                    : `${t.travelSpentLastMonth}: ${formatMoney(stats.travel.spentLastMonth ?? 0)}`
                  : null
              }
              trend={0}
              subtitleColor={(stats.travel.spentLastMonth ?? 0) > 0 ? 'text-text-secondary' : undefined}
              icon="✈️"
            />
          )}
          {stats.hasHousing && (
            <KpiCard
              className={kpiCount === 3 ? 'col-span-2 lg:col-span-1' : ''}
              title={t.kpiTotalWealth}
              value={formatMoney(
                stats.currentTotalWealth -
                  (stats.hasTravel && stats.travel
                    ? (stats.travel.current ?? 0) * (1 - TRAVEL_PATRIMONY_SHARE)
                    : 0),
              )}
              subtitle={
                stats.patrimonyKpiChangeVsPrevPct != null &&
                !Number.isNaN(stats.patrimonyKpiChangeVsPrevPct)
                  ? t.kpiVsPrevMonth(formatPct(stats.patrimonyKpiChangeVsPrevPct))
                  : null
              }
              privacyPct={stats.patrimonyKpiChangeVsPrevPct}
              trend={
                stats.patrimonyKpiChangeVsPrev != null ? stats.patrimonyKpiChangeVsPrev : 0
              }
              icon="💸"
            />
          )}
        </section>

        {stats.assetClassDistribution?.length > 0 && (
          <DistributionChart
              distribution={stats.assetClassDistribution}
              title={t.assetClassTitle}
              privacyToggle
              selectedEntities={selectedAssetClasses}
              onSelectEntity={handleDistributionEntitySelect}
              entityEvolution={stats.assetClassEvolution}
              distributionSparklineExtras={{}}
              hasHousing={stats.hasHousing}
              onShowHousingChange={(show) => {
                if (!show) {
                  setSelectedAssetClasses((p) => p.filter((n) => n !== ASSET_CLASS_LABELS.immo));
                }
              }}
            />
        )}

        <NetWorthChart
            months={assetClassNetWorth?.months ?? stats.netWorthMonths}
            totals={
              assetClassNetWorth?.totals
              ?? stats.netWorthTotals
              ?? stats.netWorthTotalWealth
            }
            title={t.netWorthTitle}
            subtitle={null}
            tooltipLabel={
              assetClassNetWorth?.labels?.length
                ? assetClassNetWorth.labels.join(' · ')
                : t.netWorthTooltip
            }
            selectedEntity={
              assetClassNetWorth?.labels?.length
                ? assetClassNetWorth.labels.join(' · ')
                : null
            }
            onClearEntity={
              assetClassNetWorth?.labels?.length
                ? () => setSelectedAssetClasses([])
                : undefined
            }
          />

        <Heatmap data={stats.heatmap} />

        {stats.hasHousing && (
          <MortgageCard housing={stats.housing} />
        )}

        <Patterns yearComparison={stats.yearComparison} heatmap={stats.heatmap} />
      </main>

      <footer className="mx-auto w-full px-3 sm:px-6 lg:px-10 mt-4 pt-4 border-t border-white/[0.06] text-center text-[11px] sm:text-xs text-text-secondary/90 space-y-1.5 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
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
      </footer>

      {addMonthOpen && stats && (
        <AddMonthModal
          months={stats.months}
          spreadsheetId={effectiveProfile === PROFILE_SECONDARY_ID ? financeConfig.spreadsheetId2 : financeConfig.spreadsheetId}
          appJwt={appJwt}
          apiUrl={API_URL}
          fixedHousingSheetValue={financeConfig.fixedHousingSheetValue}
          fixedHousingSheetEntity={financeConfig.fixedHousingSheetEntity}
          onClose={() => setAddMonthOpen(false)}
          onSaved={refresh}
        />
      )}

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
        onLogout={() => { googleLogout(); clearAppJwt(); }}
        t={t}
        stats={stats}
        onAddMonth={() => { setAddMonthOpen(true); setDrawerOpen(false); }}
        passkey={passkey}
      />
    </div>
  );
}
