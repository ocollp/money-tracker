import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { parseCSV, groupByMonth, mergeFixedHousingSheetRows } from '../utils/parseCSV';
import { computeStatistics } from '../utils/statistics';
import {
  fetchSheetData,
  checkSheetAccess,
  fetchSheetDataViaBackend,
  checkSheetAccessViaBackend,
} from '../services/sheetsApi';
import { getTestStats } from '../data/testData';
import { PROFILE_PRIMARY_ID, PROFILE_SECONDARY_ID, API_URL, HAS_BACKEND } from '../config';
import { financeConfigToStatsOptions } from '../lib/mergeFinanceConfig.js';

const POLL_INTERVAL_MS = 45 * 1000;

export function useSheetFinanceData({ isTestData, accessToken, appJwt, profile, financeConfig }) {
  const sid1 = financeConfig.spreadsheetId;
  const sid2 = financeConfig.spreadsheetId2;
  const labels = financeConfig.profileLabels;
  const emojis = financeConfig.profileEmojis;
  const statsOpts = useMemo(
    () => financeConfigToStatsOptions(financeConfig),
    [financeConfig]
  );

  const { fixedHousingSheetValue, fixedHousingSheetEntity } = financeConfig;

  const useBackend = Boolean(HAS_BACKEND && appJwt);
  const authReady = isTestData || (useBackend ? Boolean(appJwt) : Boolean(accessToken));

  const checkAccess = useMemo(() => {
    if (!authReady || isTestData) return null;
    return useBackend
      ? (s) => checkSheetAccessViaBackend(appJwt, s, API_URL)
      : (s) => checkSheetAccess(accessToken, s);
  }, [authReady, useBackend, appJwt, accessToken, isTestData]);

  const fetchData = useMemo(() => {
    if (!authReady || isTestData) return null;
    return useBackend
      ? (s) => fetchSheetDataViaBackend(appJwt, s, API_URL)
      : (s) => fetchSheetData(accessToken, s);
  }, [authReady, useBackend, appJwt, accessToken, isTestData]);

  const PROFILE_PRIMARY = useMemo(
    () => ({
      id: PROFILE_PRIMARY_ID,
      name: labels[PROFILE_PRIMARY_ID],
      emoji: emojis[PROFILE_PRIMARY_ID],
      sheetId: sid1,
    }),
    [labels, emojis, sid1]
  );

  const PROFILE_SECONDARY = useMemo(
    () => ({
      id: PROFILE_SECONDARY_ID,
      name: labels[PROFILE_SECONDARY_ID],
      emoji: emojis[PROFILE_SECONDARY_ID],
      sheetId: sid2,
    }),
    [labels, emojis, sid2]
  );

  const [sheetAccess, setSheetAccess] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchKey, setFetchKey] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const statsCacheKeyRef = useRef(null);
  /** Result of secondary sheet HEAD-style check when it finishes before primary CSV load. */
  const pendingSecondaryAccessRef = useRef(undefined);
  const sheetAccessRef = useRef(sheetAccess);
  sheetAccessRef.current = sheetAccess;

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

  useEffect(() => {
    if (!isTestData) return;
    setSheetAccess({ id1: true, id2: false });
    setStats(getTestStats());
    setLastUpdatedAt(new Date());
  }, [isTestData]);

  /** Secondary sheet access probe — parallel with primary fetch; does not block first paint. */
  useEffect(() => {
    if (isTestData || !checkAccess || !sid2) return;
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
  }, [checkAccess, sid2, isTestData]);

  useEffect(() => {
    if (isTestData || !fetchData) return;
    if (!currentSheetId) return;
    const access = sheetAccessRef.current;
    if (access !== null && !access.id1 && !access.id2) return;

    const statsKey = `${currentSheetId}\0${effectiveProfile}`;
    if (statsCacheKeyRef.current !== statsKey) {
      statsCacheKeyRef.current = statsKey;
      setStats(null);
    }

    setLoading(true);
    setError(null);

    fetchData(currentSheetId)
      .then((csvText) => {
        const rows = mergeFixedHousingSheetRows(parseCSV(csvText), {
          amount: fixedHousingSheetValue,
          entity: fixedHousingSheetEntity,
        });
        const months = groupByMonth(rows);
        const s = computeStatistics(months, { ...statsOpts, profileId: effectiveProfile });
        setStats(s);
        setLastUpdatedAt(new Date());

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
        setError(err.message);
        setSheetAccess((prev) => {
          if (currentSheetId === sid1) return { id1: false, id2: false };
          if (currentSheetId === sid2 && prev) return { ...prev, id2: false };
          return prev ?? { id1: false, id2: false };
        });
      })
      .finally(() => setLoading(false));
  }, [fetchData, currentSheetId, fetchKey, effectiveProfile, isTestData, statsOpts, fixedHousingSheetValue, fixedHousingSheetEntity, sid1, sid2]);

  useEffect(() => {
    if (isTestData || !fetchData) return;
    if (!currentSheetId || !stats) return;

    const intervalId = setInterval(() => {
      fetchData(currentSheetId)
        .then((csvText) => {
          const rows = mergeFixedHousingSheetRows(parseCSV(csvText), {
            amount: fixedHousingSheetValue,
            entity: fixedHousingSheetEntity,
          });
          const months = groupByMonth(rows);
          const s = computeStatistics(months, { ...statsOpts, profileId: effectiveProfile });
          setStats(s);
          setLastUpdatedAt(new Date());
        })
        .catch(() => {});
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [fetchData, currentSheetId, effectiveProfile, stats, isTestData, statsOpts, fixedHousingSheetValue, fixedHousingSheetEntity]);

  const refresh = useCallback(() => { setFetchKey((k) => k + 1); }, []);

  return {
    sheetAccess,
    effectiveProfiles,
    effectiveProfile,
    currentSheetId,
    stats,
    loading,
    error,
    refresh,
    lastUpdatedAt,
  };
}
