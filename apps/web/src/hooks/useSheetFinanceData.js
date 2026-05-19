import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { parseCSV, groupByMonth, mergeFixedHousingSheetRows } from '../utils/parseCSV';
import { computeStatistics } from '../utils/statistics';
import {
  fetchSheetData,
  checkSheetAccess,
  fetchSheetDataViaBackend,
  checkSheetAccessViaBackend,
} from '../services/sheetsApi';
import { PROFILE_PRIMARY_ID, PROFILE_SECONDARY_ID, API_URL, HAS_BACKEND } from '../config';
import { financeConfigToStatsOptions } from '../lib/mergeFinanceConfig.js';
import { readCachedMonths, writeCachedMonths } from '../lib/financeStatsCache.js';

const POLL_INTERVAL_MS = 45 * 1000;

function buildStatsFromMonths(months, statsOpts, profileId) {
  if (!months?.length) return null;
  return computeStatistics(months, { ...statsOpts, profileId });
}

export function useSheetFinanceData({ accessToken, appJwt, profile, financeConfig }) {
  const sid1 = financeConfig.spreadsheetId;
  const sid2 = financeConfig.spreadsheetId2;
  const labels = financeConfig.profileLabels;
  const emojis = financeConfig.profileEmojis;
  const statsOpts = useMemo(
    () => financeConfigToStatsOptions(financeConfig),
    [financeConfig],
  );
  const statsOptsRef = useRef(statsOpts);
  statsOptsRef.current = statsOpts;

  const { fixedHousingSheetValue, fixedHousingSheetEntity } = financeConfig;
  const housingRef = useRef({ fixedHousingSheetValue, fixedHousingSheetEntity });
  housingRef.current = { fixedHousingSheetValue, fixedHousingSheetEntity };

  const useBackend = Boolean(HAS_BACKEND && appJwt);
  const authReady = useBackend ? Boolean(appJwt) : Boolean(accessToken);

  const checkAccess = useMemo(() => {
    if (!authReady) return null;
    return useBackend
      ? (s) => checkSheetAccessViaBackend(appJwt, s, API_URL)
      : (s) => checkSheetAccess(accessToken, s);
  }, [authReady, useBackend, appJwt, accessToken]);

  const fetchData = useMemo(() => {
    if (!authReady) return null;
    return useBackend
      ? (s) => fetchSheetDataViaBackend(appJwt, s, API_URL)
      : (s) => fetchSheetData(accessToken, s);
  }, [authReady, useBackend, appJwt, accessToken]);

  const PROFILE_PRIMARY = useMemo(
    () => ({
      id: PROFILE_PRIMARY_ID,
      name: labels[PROFILE_PRIMARY_ID],
      emoji: emojis[PROFILE_PRIMARY_ID],
      sheetId: sid1,
    }),
    [labels, emojis, sid1],
  );

  const PROFILE_SECONDARY = useMemo(
    () => ({
      id: PROFILE_SECONDARY_ID,
      name: labels[PROFILE_SECONDARY_ID],
      emoji: emojis[PROFILE_SECONDARY_ID],
      sheetId: sid2,
    }),
    [labels, emojis, sid2],
  );

  const [sheetAccess, setSheetAccess] = useState(() =>
    sid1 ? { id1: true, id2: false } : null,
  );
  const [stats, setStats] = useState(() => {
    const sid = financeConfig.spreadsheetId;
    if (!sid) return null;
    const months = readCachedMonths(sid, profile);
    if (!months?.length) return null;
    return buildStatsFromMonths(months, statsOpts, profile);
  });
  const [loading, setLoading] = useState(() => {
    const sid = financeConfig.spreadsheetId;
    if (!sid) return false;
    return true;
  });
  const [error, setError] = useState(null);
  const [fetchKey, setFetchKey] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const statsCacheKeyRef = useRef(null);
  const pendingSecondaryAccessRef = useRef(undefined);
  const sheetAccessRef = useRef(sheetAccess);
  sheetAccessRef.current = sheetAccess;
  const monthsCacheRef = useRef(
    !financeConfig.spreadsheetId
      ? null
      : readCachedMonths(financeConfig.spreadsheetId, profile),
  );

  const effectiveProfiles = !sheetAccess
    ? []
    : [
        ...(sheetAccess.id1 ? [PROFILE_PRIMARY] : []),
        ...(sheetAccess.id2 && sid2 ? [PROFILE_SECONDARY] : []),
      ];

  const effectiveProfile =
    effectiveProfiles.length === 1
      ? effectiveProfiles[0].id
      : effectiveProfiles.some((p) => p.id === profile)
        ? profile
        : effectiveProfiles[0]?.id || PROFILE_PRIMARY_ID;

  const currentSheetId =
    effectiveProfiles.find((p) => p.id === effectiveProfile)?.sheetId || sid1;

  const statsKey = currentSheetId ? `${currentSheetId}\0${effectiveProfile}` : '';

  const applyMonthsToStats = useCallback(
    (months, profileId) => {
      const s = buildStatsFromMonths(months, statsOptsRef.current, profileId);
      if (s) {
        setStats(s);
        setLastUpdatedAt(new Date());
        monthsCacheRef.current = months;
      }
      return s;
    },
    [],
  );

  useEffect(() => {
    if (!checkAccess || !sid2) return;
    let cancelled = false;
    checkAccess(sid2).then((ok) => {
      if (cancelled) return;
      pendingSecondaryAccessRef.current = !!ok;
      setSheetAccess((prev) => {
        if (!prev) return null;
        return { ...prev, id2: !!ok };
      });
    });
    return () => {
      cancelled = true;
    };
  }, [checkAccess, sid2]);

  useEffect(() => {
    if (!statsKey) return;

    const keyChanged = statsCacheKeyRef.current !== statsKey;
    if (keyChanged) {
      statsCacheKeyRef.current = statsKey;
      monthsCacheRef.current = null;
      const cachedMonths = readCachedMonths(currentSheetId, effectiveProfile);
      if (cachedMonths?.length) {
        monthsCacheRef.current = cachedMonths;
        applyMonthsToStats(cachedMonths, effectiveProfile);
      } else {
        setStats(null);
      }
    }
  }, [statsKey, currentSheetId, effectiveProfile, applyMonthsToStats]);

  useEffect(() => {
    if (!monthsCacheRef.current?.length) return;
    applyMonthsToStats(monthsCacheRef.current, effectiveProfile);
  }, [statsOpts, effectiveProfile, applyMonthsToStats]);

  useEffect(() => {
    if (!fetchData || !currentSheetId) return;
    const access = sheetAccessRef.current;
    if (access !== null && !access.id1 && !access.id2) return;

    const hadStats = Boolean(monthsCacheRef.current?.length);
    setLoading(true);
    setError(null);

    let cancelled = false;

    fetchData(currentSheetId)
      .then((csvText) => {
        if (cancelled) return;
        const { fixedHousingSheetValue: hv, fixedHousingSheetEntity: he } = housingRef.current;
        const rows = mergeFixedHousingSheetRows(parseCSV(csvText), {
          amount: hv,
          entity: he,
        });
        const months = groupByMonth(rows);
        writeCachedMonths(currentSheetId, effectiveProfile, months);
        monthsCacheRef.current = months;
        applyMonthsToStats(months, effectiveProfile);

        setSheetAccess((prev) => {
          const nextId1 = currentSheetId === sid1 ? true : (prev?.id1 ?? false);
          const nextId2 =
            currentSheetId === sid2
              ? true
              : pendingSecondaryAccessRef.current !== undefined
                ? pendingSecondaryAccessRef.current
                : (prev?.id2 ?? false);
          return { id1: nextId1, id2: nextId2 };
        });
      })
      .catch((err) => {
        if (cancelled) return;
        if (!hadStats) setError(err.message);
        setSheetAccess((prev) => {
          if (currentSheetId === sid1) return { id1: false, id2: false };
          if (currentSheetId === sid2 && prev) return { ...prev, id2: false };
          return prev ?? { id1: false, id2: false };
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    fetchData,
    currentSheetId,
    fetchKey,
    effectiveProfile,
    sid1,
    sid2,
    applyMonthsToStats,
  ]);

  useEffect(() => {
    if (!fetchData) return;
    if (!currentSheetId || !stats) return;

    const intervalId = setInterval(() => {
      fetchData(currentSheetId)
        .then((csvText) => {
          const { fixedHousingSheetValue: hv, fixedHousingSheetEntity: he } = housingRef.current;
          const rows = mergeFixedHousingSheetRows(parseCSV(csvText), {
            amount: hv,
            entity: he,
          });
          const months = groupByMonth(rows);
          writeCachedMonths(currentSheetId, effectiveProfile, months);
          monthsCacheRef.current = months;
          applyMonthsToStats(months, effectiveProfile);
        })
        .catch(() => {});
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [fetchData, currentSheetId, effectiveProfile, stats, applyMonthsToStats]);

  const refresh = useCallback(() => { setFetchKey((k) => k + 1); }, []);

  const isRefreshing = Boolean(loading && stats);

  return {
    sheetAccess,
    effectiveProfiles,
    effectiveProfile,
    currentSheetId,
    stats,
    loading,
    isRefreshing,
    error,
    refresh,
    lastUpdatedAt,
  };
}
