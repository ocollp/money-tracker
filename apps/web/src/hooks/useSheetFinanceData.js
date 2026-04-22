import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { parseCSV, groupByMonth } from '../utils/parseCSV';
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

  // ── Single source of truth: do we have a valid auth credential? ──
  // Every effect below gates on `authReady` — nothing runs without it.
  const useBackend = Boolean(HAS_BACKEND && appJwt);
  const authReady = isTestData || (useBackend ? Boolean(appJwt) : Boolean(accessToken));

  const checkAccess = useMemo(() => {
    if (!authReady || isTestData) return null;
    return useBackend
      ? (sid) => checkSheetAccessViaBackend(appJwt, sid, API_URL)
      : (sid) => checkSheetAccess(accessToken, sid);
  }, [authReady, useBackend, appJwt, accessToken, isTestData]);

  const fetchData = useMemo(() => {
    if (!authReady || isTestData) return null;
    return useBackend
      ? (sid) => fetchSheetDataViaBackend(appJwt, sid, API_URL)
      : (sid) => fetchSheetData(accessToken, sid);
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
  /** Only clear stats when sheet or profile context changes — keeps UI during pull-refresh / /me race. */
  const statsCacheKeyRef = useRef(null);

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

  useEffect(() => {
    if (isTestData) return;
    if (!checkAccess) { setSheetAccess(null); return; }

    let cancelled = false;
    Promise.all([
      checkAccess(sid1),
      sid2 ? checkAccess(sid2) : Promise.resolve(false),
    ]).then(([id1, id2]) => {
      if (!cancelled) setSheetAccess({ id1: !!id1, id2: !!id2 });
    });
    return () => { cancelled = true; };
  }, [checkAccess, isTestData, sid1, sid2]);

  useEffect(() => {
    if (isTestData || !fetchData) return;
    if (!sheetAccess || !currentSheetId) return;
    if (!sheetAccess.id1 && !sheetAccess.id2) return;

    const statsKey = `${currentSheetId}\0${effectiveProfile}`;
    if (statsCacheKeyRef.current !== statsKey) {
      statsCacheKeyRef.current = statsKey;
      setStats(null);
    }

    setLoading(true);
    setError(null);

    fetchData(currentSheetId)
      .then((csvText) => {
        const rows = parseCSV(csvText);
        const months = groupByMonth(rows);
        const s = computeStatistics(months, { ...statsOpts, profileId: effectiveProfile });
        setStats(s);
        setLastUpdatedAt(new Date());
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [fetchData, sheetAccess, currentSheetId, fetchKey, effectiveProfile, isTestData, statsOpts]);

  useEffect(() => {
    if (isTestData || !fetchData) return;
    if (!currentSheetId || !stats) return;

    const intervalId = setInterval(() => {
      fetchData(currentSheetId)
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
  }, [fetchData, currentSheetId, effectiveProfile, stats, isTestData, statsOpts]);

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
