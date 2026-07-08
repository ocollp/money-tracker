import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { formatMoney, formatChange, formatPct, formatUpdatedClock } from './utils/formatters';
import useGoogleAuth from './hooks/useGoogleAuth';
import { useBackendProfile, clearAppJwt } from './hooks/useBackendProfile';
import { useSheetFinanceData } from './hooks/useSheetFinanceData';
import {
  buildFinanceConfig,
  financeConfigToSettingsFormShape,
  financeConfigToStatsOptions,
  financeConfigSheetIdForProfile,
  applyLocalProfileDisplay,
} from './lib/mergeFinanceConfig.js';
import { getProfileFeatures } from './lib/profileConfig.js';
import { computeStatisticsAsOf } from './lib/statsForMonth.js';
import { loadLocalProfileDisplay, saveLocalProfileDisplay } from './lib/localProfileDisplay.js';
import {
  PROFILE_EMAILS,
  PROFILE_PRIMARY_ID,
  PROFILE_SECONDARY_ID,
  PROFILE_TERTIARY_ID,
  SPREADSHEET_ID_2,
  SPREADSHEET_ID_3,
  API_URL,
  TRAVEL_PATRIMONY_SHARE,
} from './config';
import { SHEET_AUTH_ERRORS } from './services/sheetsApi';
import LoginScreen from './components/LoginScreen';
import NoSheetAccessScreen from './components/NoSheetAccessScreen';
import { usePasskey } from './hooks/usePasskey.js';
import ProfileSettings from './components/ProfileSettings';
import SideDrawer, { useSidebarLayout } from './components/SideDrawer';
import KpiCard from './components/KpiCard';
import NetWorthChart from './components/NetWorthChart';
import DistributionChart from './components/DistributionChart';
import Heatmap from './components/Heatmap';
import MonthViewBanner from './components/MonthViewBanner';
import Patterns from './components/Patterns';
import MilestonesCard from './components/MilestonesCard';
import MortgageCard from './components/MortgageCard';
import AddMonthModal from './components/AddMonthModal';
import DashboardLoadingShell from './components/DashboardLoadingShell';
import DashboardHeader from './components/DashboardHeader';
import MobilePullRefresh from './components/MobilePullRefresh';
import { useI18n } from './i18n/I18nContext.jsx';
import { ASSET_CLASS_LABELS } from './utils/assetClassBuckets.js';

const PROFILE_KEY = 'mt_profile';

function normalizeStoredProfileId(saved) {
  if (!saved) return null;
  if (saved === PROFILE_PRIMARY_ID || saved === 'olga') return PROFILE_PRIMARY_ID;
  if (saved === PROFILE_SECONDARY_ID || saved === 'andrea') return PROFILE_SECONDARY_ID;
  if (saved === PROFILE_TERTIARY_ID) return PROFILE_TERTIARY_ID;
  return null;
}

function getInitialProfile() {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    const id = normalizeStoredProfileId(saved);
    if (id === PROFILE_TERTIARY_ID && SPREADSHEET_ID_3) return PROFILE_TERTIARY_ID;
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
    reconnectGoogle,
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
  const [selectedMonthKey, setSelectedMonthKey] = useState(null);
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
  const onAuthExpiredRef = useRef(clearAuth);
  onAuthExpiredRef.current = clearAuth;
  const handleAuthExpired = useCallback(() => {
    onAuthExpiredRef.current?.();
  }, []);

  const passkey = usePasskey({ onLoginSuccess: loginWithPasskeyResult });
  const { settings, backendReady, patchSettings, hasApi, apiUser } = useBackendProfile(
    accessToken,
    appJwt,
    clearAuth,
  );
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
    if (profile === PROFILE_TERTIARY_ID && !financeConfig.spreadsheetId3) {
      setProfile(PROFILE_PRIMARY_ID);
      try {
        localStorage.setItem(PROFILE_KEY, PROFILE_PRIMARY_ID);
      } catch {}
    }
  }, [financeConfig.spreadsheetId2, financeConfig.spreadsheetId3, profile]);

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
  } = useSheetFinanceData({
    accessToken,
    appJwt,
    profile,
    financeConfig,
    onAuthExpired: handleAuthExpired,
  });

  const statsOpts = useMemo(
    () => ({ ...financeConfigToStatsOptions(financeConfig), profileId: effectiveProfile }),
    [financeConfig, effectiveProfile],
  );

  const displayStats = useMemo(() => {
    if (!stats) return null;
    if (!selectedMonthKey || selectedMonthKey === stats.dataAsOf?.key) return stats;
    return computeStatisticsAsOf(stats.months, selectedMonthKey, statsOpts) ?? stats;
  }, [stats, selectedMonthKey, statsOpts]);

  const selectedMonthLabel = useMemo(() => {
    if (!selectedMonthKey || !stats?.months) return null;
    if (selectedMonthKey === stats.dataAsOf?.key) return null;
    const month = stats.months.find((m) => m.key === selectedMonthKey);
    return month?.label ?? month?.shortLabel ?? selectedMonthKey;
  }, [selectedMonthKey, stats]);

  useEffect(() => {
    setSelectedMonthKey(null);
    setSelectedAssetClasses([]);
  }, [effectiveProfile, currentSheetId]);

  useEffect(() => {
    if (!selectedMonthKey || !stats?.months) return;
    if (!stats.months.some((m) => m.key === selectedMonthKey)) {
      setSelectedMonthKey(null);
    }
  }, [stats, selectedMonthKey]);

  const dataAsOfKey = stats?.dataAsOf?.key;

  const handleHeatmapSelectMonth = useCallback((cell) => {
    if (!cell?.key) return;
    setSelectedMonthKey((prev) => {
      if (cell.key === dataAsOfKey) return null;
      return prev === cell.key ? null : cell.key;
    });
  }, [dataAsOfKey]);

  const clearSelectedMonth = useCallback(() => setSelectedMonthKey(null), []);
  const clearAssetClassSelection = useCallback(() => setSelectedAssetClasses([]), []);

  const assetClassNetWorth = useMemo(() => {
    if (!selectedAssetClasses.length || !displayStats?.assetClassEvolution?.length) return null;
    const series = displayStats.assetClassEvolution;
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
  }, [selectedAssetClasses, displayStats]);

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
    if (!selectedAssetClasses.length || !displayStats?.assetClassEvolution?.length) return;
    const series = displayStats.assetClassEvolution;
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
  }, [selectedAssetClasses, displayStats]);

  const handleSaveLocalProfileDisplay = useCallback((patch) => {
    saveLocalProfileDisplay(patch);
    setLocalProfileUiTick((t) => t + 1);
  }, []);

  const effectiveUser = apiUser || user;

  const switchProfile = useCallback((id) => {
    setProfile(id);
    try {
      localStorage.setItem(PROFILE_KEY, id);
    } catch {}
  }, []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const handleLogout = useCallback(() => {
    googleLogout();
    clearAppJwt();
  }, [googleLogout]);
  const openAddMonth = useCallback(() => {
    setAddMonthOpen(true);
    setDrawerOpen(false);
  }, []);
  const closeAddMonth = useCallback(() => setAddMonthOpen(false), []);
  const handleShowHousingChange = useCallback((show) => {
    if (!show) {
      setSelectedAssetClasses((p) => p.filter((n) => n !== ASSET_CLASS_LABELS.immo));
    }
  }, []);
  const pullRefreshDisabled = !displayStats;
  const pullRefreshLoading = Boolean(loading && !stats);

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

  if (user && sheetAccess && !sheetAccess.id1 && !sheetAccess.id2 && !sheetAccess.id3) {
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

  const needsGoogleReauth = error === SHEET_AUTH_ERRORS.GOOGLE_REAUTH;

  if (error && !stats && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md space-y-4">
          <p className="text-negative text-lg font-medium">{t.errorLoadingData}</p>
          <p className="text-text-secondary text-sm">
            {needsGoogleReauth ? t.googleReauthRequired : error}
          </p>
          {needsGoogleReauth ? (
            <button
              type="button"
              onClick={() => reconnectGoogle(PROFILE_EMAILS[profile])}
              className="w-full flex items-center justify-center gap-2 bg-white/[0.08] text-text-primary border border-white/[0.1] hover:bg-white/[0.12] text-sm font-medium py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.97]"
            >
              {t.googleReauthButton}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { googleLogout(); clearAppJwt(); }}
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-all duration-200 underline active:opacity-80"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t.logoutAndRetry}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen min-h-dvh flex flex-col sidebar-offset" style={{ '--sidebar-w': `${sidebarWidth}px` }}>
        <MobilePullRefresh
          onRefresh={refresh}
          disabled={pullRefreshDisabled}
          loading={pullRefreshLoading}
        />

        <DashboardHeader
          t={t}
          onOpenDrawer={openDrawer}
          effectiveProfiles={effectiveProfiles}
          effectiveProfile={effectiveProfile}
        />

        <DashboardLoadingShell loadingLabel={t.loadingData} />

        <ProfileSettings
          open={settingsOpen}
          onClose={closeSettings}
          settings={settingsModalValues}
          settingsVariant={hasPersistedProfile ? 'api' : 'local-display'}
          onSave={hasPersistedProfile ? patchSettings : undefined}
          onSaveLocalDisplay={!hasPersistedProfile ? handleSaveLocalProfileDisplay : undefined}
          readOnly={false}
          readOnlySubtitle={!hasPersistedProfile ? settingsReadOnlySubtitle : null}
        />

        <SideDrawer
          open={drawerOpen}
          onClose={closeDrawer}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          user={effectiveUser}
          effectiveProfiles={effectiveProfiles}
          effectiveProfile={effectiveProfile}
          onSwitchProfile={switchProfile}
          onSettings={openSettings}
          onLogout={handleLogout}
          t={t}
          stats={null}
          onAddMonth={openAddMonth}
          passkey={passkey}
        />
      </div>
    );
  }

  const updatedLabel = formatUpdatedClock(lastUpdatedAt);
  const viewStats = displayStats;
  const profileFeatures = getProfileFeatures(effectiveProfile);

  const isCategoryGroupedProfile = profileFeatures.assetClassMode === 'categoryGrouped';
  const netWorthChartTitle = isCategoryGroupedProfile
    ? (t.kpiTotalWealth ?? 'Patrimoni total')
    : t.netWorthTitle;
  const kpiCount = isCategoryGroupedProfile
    ? 4
    : 2 +
      (viewStats.hasTravel && profileFeatures.showTravelKpi ? 1 : 0) +
      (viewStats.hasHousing && profileFeatures.showPatrimonyKpi ? 1 : 0);
  const kpiLgCols =
    kpiCount >= 4 ? 'lg:grid-cols-4' : kpiCount === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2';

  const monthDelta = entityChange
    ? entityChange.change
    : (viewStats.changeVsPrevTotal ?? viewStats.changeVsPrev);
  const monthDeltaPct = entityChange
    ? entityChange.pct
    : (viewStats.changeVsPrevPctTotal ?? viewStats.changeVsPrevPct);

  const liquidDelta = entityChange ? entityChange.change : viewStats.changeVsPrev;
  const liquidPct = entityChange ? entityChange.pct : viewStats.changeVsPrevPct;

  const travelPct = viewStats.travel?.changeVsPrevPct;
  const travelDelta = viewStats.travel?.changeVsPrev;

  const groupedKpis = (() => {
    if (!isCategoryGroupedProfile) return null;
    const series = viewStats.assetClassEvolution;
    if (!series?.length) return null;
    const last = series[series.length - 1];
    const prev = series.length >= 2 ? series[series.length - 2] : null;

    const get = (name) => {
      const current = Number(last?.[name] ?? 0) || 0;
      const previous = prev ? (Number(prev?.[name] ?? 0) || 0) : null;
      const change = previous != null ? current - previous : null;
      const pct = previous ? (change / previous) * 100 : null;
      return { current, change, pct };
    };

    return {
      corrents: get('Compte corrent'),
      remunerats: get('Compte remunerat'),
      inversions: get('Inversions'),
      total: {
        current: Number(viewStats.current ?? 0) || 0,
        change: viewStats.changeVsPrev,
        pct: viewStats.changeVsPrevPct,
      },
    };
  })();

  const patrimonyForMilestones =
    viewStats.currentTotalWealth -
    (viewStats.hasTravel && viewStats.travel
      ? (viewStats.travel.current ?? 0) * (1 - TRAVEL_PATRIMONY_SHARE)
      : 0);

  return (
    <div className="min-h-screen min-h-dvh flex flex-col sidebar-offset" style={{ '--sidebar-w': `${sidebarWidth}px` }}>
      <MobilePullRefresh
        onRefresh={refresh}
        disabled={pullRefreshDisabled}
        loading={pullRefreshLoading}
      />

      <DashboardHeader
        t={t}
        onOpenDrawer={openDrawer}
        effectiveProfiles={effectiveProfiles}
        effectiveProfile={effectiveProfile}
      />

      {selectedMonthLabel ? (
        <MonthViewBanner
          label={t.monthViewActive(selectedMonthLabel)}
          clearLabel={t.monthViewClear}
          onClear={clearSelectedMonth}
        />
      ) : null}

      {needsGoogleReauth ? (
        <div className="mx-3 sm:mx-6 lg:mx-10 -mb-1 sm:-mb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
            <p className="text-sm text-text-secondary">{t.googleReauthRequired}</p>
            <button
              type="button"
              onClick={() => reconnectGoogle(PROFILE_EMAILS[profile])}
              className="shrink-0 text-sm font-medium text-warning hover:text-warning/90 underline underline-offset-2 active:opacity-80"
            >
              {t.googleReauthButton}
            </button>
          </div>
        </div>
      ) : null}

      <main
        className={`mx-auto px-3 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6 touch-pan-y flex-1 pb-2 w-full transition-opacity duration-300 ${
          isRefreshing ? 'opacity-[0.92]' : 'opacity-100'
        }`}
        aria-busy={isRefreshing || undefined}
      >
        <section className={`grid gap-3 sm:gap-4 grid-cols-2 ${kpiLgCols}`}>
          {isCategoryGroupedProfile && groupedKpis ? (
            <>
              <KpiCard
                title="Compte corrent"
                value={formatMoney(groupedKpis.corrents.current)}
                privacyPct={groupedKpis.corrents.pct}
                headerRight={
                  groupedKpis.corrents.change != null ? formatChange(groupedKpis.corrents.change) : null
                }
                subtitle={
                  groupedKpis.corrents.pct != null && !Number.isNaN(groupedKpis.corrents.pct)
                    ? t.kpiVsPrevMonth(formatPct(groupedKpis.corrents.pct))
                    : null
                }
                trend={groupedKpis.corrents.change != null ? groupedKpis.corrents.change : 0}
                icon="🏦"
              />
              <KpiCard
                title="Compte remunerat"
                value={formatMoney(groupedKpis.remunerats.current)}
                privacyPct={groupedKpis.remunerats.pct}
                headerRight={
                  groupedKpis.remunerats.change != null ? formatChange(groupedKpis.remunerats.change) : null
                }
                subtitle={
                  groupedKpis.remunerats.pct != null && !Number.isNaN(groupedKpis.remunerats.pct)
                    ? t.kpiVsPrevMonth(formatPct(groupedKpis.remunerats.pct))
                    : null
                }
                trend={groupedKpis.remunerats.change != null ? groupedKpis.remunerats.change : 0}
                icon="💵"
              />
              <KpiCard
                title="Inversions"
                value={formatMoney(groupedKpis.inversions.current)}
                privacyPct={groupedKpis.inversions.pct}
                headerRight={
                  groupedKpis.inversions.change != null ? formatChange(groupedKpis.inversions.change) : null
                }
                subtitle={
                  groupedKpis.inversions.pct != null && !Number.isNaN(groupedKpis.inversions.pct)
                    ? t.kpiVsPrevMonth(formatPct(groupedKpis.inversions.pct))
                    : null
                }
                trend={groupedKpis.inversions.change != null ? groupedKpis.inversions.change : 0}
                icon="📈"
              />
              <KpiCard
                title={t.kpiTotalWealth ?? 'Patrimoni total'}
                value={formatMoney(groupedKpis.total.current)}
                privacyPct={groupedKpis.total.pct}
                headerRight={
                  groupedKpis.total.change != null ? formatChange(groupedKpis.total.change) : null
                }
                subtitle={
                  groupedKpis.total.pct != null && !Number.isNaN(groupedKpis.total.pct)
                    ? t.kpiVsPrevMonth(formatPct(groupedKpis.total.pct))
                    : null
                }
                trend={groupedKpis.total.change != null ? groupedKpis.total.change : 0}
                icon="💰"
              />
            </>
          ) : (
            <>
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
                value={formatMoney(entityChange ? entityChange.current : viewStats.current)}
                privacyPct={liquidPct}
                headerRight={liquidDelta != null ? formatChange(liquidDelta) : null}
                subtitle={
                  liquidPct != null && !Number.isNaN(liquidPct)
                    ? t.kpiVsPrevMonth(formatPct(liquidPct))
                    : null
                }
                trend={liquidDelta != null ? liquidDelta : 0}
                icon="💰"
              />
              {viewStats.hasTravel && viewStats.travel && profileFeatures.showTravelKpi && (
                <KpiCard
                  className={viewStats.hasHousing ? '' : 'col-span-2 lg:col-span-1'}
                  title={t.travelTitle}
                  value={formatMoney(viewStats.travel.current ?? 0)}
                  privacyPct={travelPct}
                  headerRight={travelDelta != null ? formatChange(travelDelta) : null}
                  subtitle={
                    travelPct != null && !Number.isNaN(travelPct)
                      ? t.kpiVsPrevMonth(formatPct(travelPct))
                      : null
                  }
                  trend={travelDelta != null ? travelDelta : 0}
                  icon="✈️"
                />
              )}
              {viewStats.hasHousing && profileFeatures.showPatrimonyKpi && (
                <KpiCard
                  className={kpiCount === 3 ? 'col-span-2 lg:col-span-1' : ''}
                  title={t.kpiTotalWealth}
                  value={formatMoney(
                    viewStats.currentTotalWealth -
                      (viewStats.hasTravel && viewStats.travel
                        ? (viewStats.travel.current ?? 0) * (1 - TRAVEL_PATRIMONY_SHARE)
                        : 0),
                  )}
                  headerRight={
                    viewStats.patrimonyKpiChangeVsPrev != null
                      ? formatChange(viewStats.patrimonyKpiChangeVsPrev)
                      : null
                  }
                  subtitle={
                    viewStats.patrimonyKpiChangeVsPrevPct != null &&
                    !Number.isNaN(viewStats.patrimonyKpiChangeVsPrevPct)
                      ? t.kpiVsPrevMonth(formatPct(viewStats.patrimonyKpiChangeVsPrevPct))
                      : null
                  }
                  privacyPct={viewStats.patrimonyKpiChangeVsPrevPct}
                  trend={
                    viewStats.patrimonyKpiChangeVsPrev != null ? viewStats.patrimonyKpiChangeVsPrev : 0
                  }
                  icon="💸"
                />
              )}
            </>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
          {viewStats.assetClassDistribution?.length > 0 ? (
            <div className="min-w-0 h-full">
              <DistributionChart
                distribution={viewStats.assetClassDistribution}
                title={t.assetClassTitle}
                privacyToggle
                selectedEntities={selectedAssetClasses}
                onSelectEntity={handleDistributionEntitySelect}
                entityEvolution={viewStats.assetClassEvolution}
                distributionSparklineExtras={{}}
                hasHousing={viewStats.hasHousing && profileFeatures.showHousingSection}
                onShowHousingChange={handleShowHousingChange}
              />
            </div>
          ) : null}
          <div
            className={`min-w-0 h-full ${
              viewStats.assetClassDistribution?.length > 0 ? '' : 'lg:col-span-2'
            }`}
          >
            <NetWorthChart
              months={assetClassNetWorth?.months ?? viewStats.netWorthMonths}
              totals={
                assetClassNetWorth?.totals
                ?? viewStats.netWorthTotals
                ?? viewStats.netWorthTotalWealth
              }
              title={netWorthChartTitle}
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
                  ? clearAssetClassSelection
                  : undefined
              }
            />
          </div>
        </section>

        <Heatmap
          data={stats.heatmap}
          selectedMonthKey={selectedMonthKey}
          onSelectMonth={handleHeatmapSelectMonth}
          trimEmptyMonths={profileFeatures.trimEmptyHeatmapMonths}
        />

        {viewStats.hasHousing && profileFeatures.showHousingSection && (
          <MortgageCard housing={viewStats.housing} />
        )}

        {profileFeatures.showPatterns ? (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
          {effectiveProfile === PROFILE_PRIMARY_ID && profileFeatures.showMilestones ? (
            <div className="min-w-0 h-full">
              <MilestonesCard
                liquidCurrent={viewStats.current}
                patrimonyCurrent={patrimonyForMilestones}
              />
            </div>
          ) : null}
          <div
            className={`min-w-0 h-full ${
              effectiveProfile === PROFILE_PRIMARY_ID && profileFeatures.showMilestones
                ? ''
                : 'lg:col-span-2'
            }`}
          >
            <Patterns yearComparison={viewStats.yearComparison} heatmap={viewStats.heatmap} />
          </div>
        </section>
        ) : null}
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
          spreadsheetId={financeConfigSheetIdForProfile(financeConfig, effectiveProfile)}
          appJwt={appJwt}
          apiUrl={API_URL}
          fixedHousingSheetValue={financeConfig.fixedHousingSheetValue}
          fixedHousingSheetEntity={financeConfig.fixedHousingSheetEntity}
          onClose={closeAddMonth}
          onSaved={refresh}
        />
      )}

      <ProfileSettings
        open={settingsOpen}
        onClose={closeSettings}
        settings={settingsModalValues}
        settingsVariant={hasPersistedProfile ? 'api' : 'local-display'}
        onSave={hasPersistedProfile ? patchSettings : undefined}
        onSaveLocalDisplay={!hasPersistedProfile ? handleSaveLocalProfileDisplay : undefined}
        readOnly={false}
        readOnlySubtitle={!hasPersistedProfile ? settingsReadOnlySubtitle : null}
      />

      <SideDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        user={effectiveUser}
        effectiveProfiles={effectiveProfiles}
        effectiveProfile={effectiveProfile}
        onSwitchProfile={switchProfile}
        onSettings={openSettings}
        onLogout={handleLogout}
        t={t}
        stats={stats}
        onAddMonth={openAddMonth}
        passkey={passkey}
      />
    </div>
  );
}
