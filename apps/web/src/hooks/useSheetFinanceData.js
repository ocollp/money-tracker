import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { computeStatistics } from '../utils/statistics';
import {
  fetchSheetData,
  checkSheetAccess,
  fetchSheetDataViaBackend,
  checkSheetAccessViaBackend,
  SHEET_AUTH_ERRORS,
} from '../services/sheetsApi';
import { PROFILE_PRIMARY_ID, PROFILE_SECONDARY_ID, API_URL, HAS_BACKEND } from '../config';
import { financeConfigToStatsOptions } from '../lib/mergeFinanceConfig.js';
import { readCachedMonths, writeCachedMonths } from '../lib/financeStatsCache.js';
import { csvTextToMonths } from '../lib/sheetMonths.js';

const POLL_INTERVAL_MS = 45 * 1000;

function buildStatsFromMonths(months, statsOpts, profileId) {
  if (!months?.length) return null;
  return computeStatistics(months, { ...statsOpts, profileId });
}

function readInitialCache(sheetId, profile) {
  if (!sheetId) return { months: null, stats: null, loading: false };
  const months = readCachedMonths(sheetId, profile);
  if (!months?.length) return { months: null, stats: null, loading: true };
  return { months, stats: null, loading: false };
}

export function useSheetFinanceData({ accessToken, appJwt, profile, financeConfig, onAuthExpired }) {
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

  const housingRef = useRef({
    amount: financeConfig.fixedHousingSheetValue,
    entity: financeConfig.fixedHousingSheetEntity,
  });
  housingRef.current = {
    amount: financeConfig.fixedHousingSheetValue,
    entity: financeConfig.fixedHousingSheetEntity,
  };

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

  const initialCache = readInitialCache(financeConfig.spreadsheetId, profile);

  const [sheetAccess, setSheetAccess] = useState(() =>
    sid1 ? { id1: true, id2: false } : null,
  );
  const [stats, setStats] = useState(() =>
    initialCache.months
      ? buildStatsFromMonths(initialCache.months, statsOpts, profile)
      : null,
  );
  const [loading, setLoading] = useState(initialCache.loading);
  const [error, setError] = useState(null);
  const [fetchKey, setFetchKey] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const statsCacheKeyRef = useRef(null);
  const pendingSecondaryAccessRef = useRef(undefined);
  const sheetAccessRef = useRef(sheetAccess);
  sheetAccessRef.current = sheetAccess;
  const monthsCacheRef = useRef(initialCache.months);

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

  const applyMonthsToStats = useCallback((months, profileId) => {
    const next = buildStatsFromMonths(months, statsOptsRef.current, profileId);
    if (next) {
      setStats(next);
      setLastUpdatedAt(new Date());
      monthsCacheRef.current = months;
    }
    return next;
  }, []);

  const ingestCsv = useCallback(
    (csvText) => csvTextToMonths(csvText, housingRef.current),
    [],
  );

  const persistMonths = useCallback(
    (months, profileId) => {
      writeCachedMonths(currentSheetId, profileId, months);
      monthsCacheRef.current = months;
      return applyMonthsToStats(months, profileId);
    },
    [applyMonthsToStats, currentSheetId],
  );

  const updateSheetAccessAfterFetch = useCallback(() => {
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
  }, [currentSheetId, sid1, sid2]);

  useEffect(() => {
    if (!checkAccess || !sid2) return;
    let cancelled = false;
    checkAccess(sid2).then((ok) => {
      if (cancelled) return;
      pendingSecondaryAccessRef.current = !!ok;
      setSheetAccess((prev) => (prev ? { ...prev, id2: !!ok } : null));
    });
    return () => { cancelled = true; };
  }, [checkAccess, sid2]);

  useEffect(() => {
    if (!statsKey) return;
    if (statsCacheKeyRef.current === statsKey) return;

    statsCacheKeyRef.current = statsKey;
    const cachedMonths = readCachedMonths(currentSheetId, effectiveProfile);
    monthsCacheRef.current = cachedMonths?.length ? cachedMonths : null;
    if (cachedMonths?.length) {
      applyMonthsToStats(cachedMonths, effectiveProfile);
    } else {
      setStats(null);
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

    const hadCachedMonths = Boolean(monthsCacheRef.current?.length);
    if (!hadCachedMonths) setLoading(true);
    setError(null);

    let cancelled = false;

    fetchData(currentSheetId)
      .then((csvText) => {
        if (cancelled) return;
        const months = ingestCsv(csvText);
        persistMonths(months, effectiveProfile);
        updateSheetAccessAfterFetch();
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.message === SHEET_AUTH_ERRORS.JWT_EXPIRED) {
          onAuthExpired?.();
          return;
        }
        if (err.message === SHEET_AUTH_ERRORS.GOOGLE_REAUTH) {
          setError(err.message);
          return;
        }
        if (!hadCachedMonths) setError(err.message);
        setSheetAccess((prev) => {
          if (currentSheetId === sid1) return { id1: false, id2: false };
          if (currentSheetId === sid2 && prev) return { ...prev, id2: false };
          return prev ?? { id1: false, id2: false };
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [
    fetchData,
    currentSheetId,
    fetchKey,
    effectiveProfile,
    sid1,
    sid2,
    ingestCsv,
    persistMonths,
    updateSheetAccessAfterFetch,
    onAuthExpired,
  ]);

  useEffect(() => {
    if (!fetchData || !currentSheetId || !stats) return;

    const intervalId = setInterval(() => {
      fetchData(currentSheetId)
        .then((csvText) => {
          const months = ingestCsv(csvText);
          persistMonths(months, effectiveProfile);
        })
        .catch(() => {});
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [fetchData, currentSheetId, effectiveProfile, stats, ingestCsv, persistMonths]);

  const refresh = useCallback(() => setFetchKey((k) => k + 1), []);

  return {
    sheetAccess,
    effectiveProfiles,
    effectiveProfile,
    currentSheetId,
    stats,
    loading,
    isRefreshing: Boolean(loading && stats),
    error,
    refresh,
    lastUpdatedAt,
  };
}
