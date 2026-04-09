import { useState, useEffect, useCallback, useMemo } from 'react';
import { parseCSV, groupByMonth } from '../utils/parseCSV';
import { computeStatistics } from '../utils/statistics';
import {
  fetchSheetData,
  checkSheetAccess,
  fetchSheetDataViaBackend,
  checkSheetAccessViaBackend,
} from '../services/sheetsApi';
import { getTestStats } from '../data/testData';
import { PROFILE_PRIMARY_ID, PROFILE_SECONDARY_ID, API_URL } from '../config';
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

  // True when we should use the backend proxy instead of calling Google directly
  const useBackend = Boolean(appJwt && API_URL);

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

  // Test data
  useEffect(() => {
    if (!isTestData) return;
    setSheetAccess({ id1: true, id2: false });
    setStats(getTestStats());
    setLastUpdatedAt(new Date());
  }, [isTestData]);

  // Check sheet access
  useEffect(() => {
    if (isTestData) return;
    if (!useBackend && !accessToken) {
      setSheetAccess(null);
      return;
    }

    let cancelled = false;

    if (useBackend) {
      Promise.all([
        checkSheetAccessViaBackend(appJwt, sid1, API_URL),
        sid2 ? checkSheetAccessViaBackend(appJwt, sid2, API_URL) : Promise.resolve(false),
      ]).then(([id1, id2]) => {
        if (!cancelled) setSheetAccess({ id1: !!id1, id2: !!id2 });
      });
    } else {
      Promise.all([
        checkSheetAccess(accessToken, sid1),
        sid2 ? checkSheetAccess(accessToken, sid2) : Promise.resolve(false),
      ]).then(([id1, id2]) => {
        if (!cancelled) setSheetAccess({ id1: !!id1, id2: !!id2 });
      });
    }

    return () => { cancelled = true; };
  }, [accessToken, appJwt, useBackend, isTestData, sid1, sid2]);

  // Fetch sheet data
  useEffect(() => {
    if (isTestData) return;
    if (!sheetAccess || !currentSheetId) return;
    if (!useBackend && !accessToken) return;
    if (!sheetAccess.id1 && !sheetAccess.id2) return;

    setLoading(true);
    setError(null);
    setStats(null);

    const fetchData = useBackend
      ? () => fetchSheetDataViaBackend(appJwt, currentSheetId, API_URL)
      : () => fetchSheetData(accessToken, currentSheetId);

    fetchData()
      .then((csvText) => {
        const rows = parseCSV(csvText);
        const months = groupByMonth(rows);
        const s = computeStatistics(months, { ...statsOpts, profileId: effectiveProfile });
        setStats(s);
        setLastUpdatedAt(new Date());
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [
    accessToken,
    appJwt,
    useBackend,
    sheetAccess,
    currentSheetId,
    fetchKey,
    effectiveProfile,
    isTestData,
    statsOpts,
  ]);

  // Poll for updates
  useEffect(() => {
    if (isTestData) return;
    if (!useBackend && !accessToken) return;
    if (!currentSheetId || !stats) return;

    const fetchData = useBackend
      ? () => fetchSheetDataViaBackend(appJwt, currentSheetId, API_URL)
      : () => fetchSheetData(accessToken, currentSheetId);

    const intervalId = setInterval(() => {
      fetchData()
        .then((csvText) => {
          const rows = parseCSV(csvText);
          const months = groupByMonth(rows);
          const s = computeStatistics(months, { ...statsOpts, profileId: effectiveProfile });
          setStats(s);
          setLastUpdatedAt(new Date());
        })
        .catch(() => {});
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isTestData, accessToken, appJwt, useBackend, currentSheetId, effectiveProfile, stats, statsOpts]);

  const refresh = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

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
