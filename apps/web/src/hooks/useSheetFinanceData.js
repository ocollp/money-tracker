import { useState, useEffect, useCallback, useMemo } from 'react';
import { parseCSV, groupByMonth } from '../utils/parseCSV';
import { computeStatistics } from '../utils/statistics';
import { fetchSheetData, checkSheetAccess } from '../services/sheetsApi';
import { getTestStats } from '../data/testData';
import {
  PROFILE_PRIMARY_ID,
  PROFILE_SECONDARY_ID,
} from '../config';
import { financeConfigToStatsOptions } from '../lib/mergeFinanceConfig.js';

const POLL_INTERVAL_MS = 45 * 1000;

export function useSheetFinanceData({ isTestData, accessToken, profile, financeConfig }) {
  const sid1 = financeConfig.spreadsheetId;
  const sid2 = financeConfig.spreadsheetId2;
  const labels = financeConfig.profileLabels;
  const emojis = financeConfig.profileEmojis;
  const statsOpts = useMemo(
    () => financeConfigToStatsOptions(financeConfig),
    [financeConfig]
  );

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
  }, [isTestData]);

  useEffect(() => {
    if (isTestData || !accessToken) {
      if (!isTestData) setSheetAccess(null);
      return;
    }
    let cancelled = false;
    Promise.all([
      checkSheetAccess(accessToken, sid1),
      sid2 ? checkSheetAccess(accessToken, sid2) : Promise.resolve(false),
    ]).then(([id1, id2]) => {
      if (!cancelled) setSheetAccess({ id1: !!id1, id2: !!id2 });
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, isTestData, sid1, sid2]);

  useEffect(() => {
    if (isTestData) return;
    if (!accessToken || !sheetAccess || !currentSheetId) return;
    if (!sheetAccess.id1 && !sheetAccess.id2) return;

    setLoading(true);
    setError(null);
    setStats(null);

    fetchSheetData(accessToken, currentSheetId)
      .then((csvText) => {
        const rows = parseCSV(csvText);
        const months = groupByMonth(rows);
        const s = computeStatistics(months, {
          ...statsOpts,
          profileId: effectiveProfile,
        });
        setStats(s);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [
    accessToken,
    sheetAccess,
    currentSheetId,
    fetchKey,
    effectiveProfile,
    isTestData,
    statsOpts,
  ]);

  useEffect(() => {
    if (isTestData || !accessToken || !currentSheetId || !stats) return;
    const intervalId = setInterval(() => {
      fetchSheetData(accessToken, currentSheetId)
        .then((csvText) => {
          const rows = parseCSV(csvText);
          const months = groupByMonth(rows);
          const s = computeStatistics(months, {
            ...statsOpts,
            profileId: effectiveProfile,
          });
          setStats(s);
        })
        .catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [isTestData, accessToken, currentSheetId, effectiveProfile, stats, statsOpts]);

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
  };
}
