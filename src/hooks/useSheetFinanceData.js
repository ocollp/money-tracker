import { useState, useEffect, useCallback } from 'react';
import { parseCSV, groupByMonth } from '../utils/parseCSV';
import { computeStatistics } from '../utils/statistics';
import { fetchSheetData, checkSheetAccess } from '../services/sheetsApi';
import { getTestStats } from '../data/testData';
import { SPREADSHEET_ID, SPREADSHEET_ID_2 } from '../config';

const PROFILE_OLGA = { id: 'olga', name: 'Olga', emoji: '👩🏼', sheetId: SPREADSHEET_ID };
const PROFILE_ANDREA = { id: 'andrea', name: 'Andrea', emoji: '👩🏻', sheetId: SPREADSHEET_ID_2 };

const POLL_INTERVAL_MS = 45 * 1000;

export function useSheetFinanceData({ isTestData, accessToken, profile }) {
  const [sheetAccess, setSheetAccess] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchKey, setFetchKey] = useState(0);

  const effectiveProfiles = !sheetAccess
    ? []
    : [
        ...(sheetAccess.id1 ? [PROFILE_OLGA] : []),
        ...(sheetAccess.id2 && SPREADSHEET_ID_2 ? [PROFILE_ANDREA] : []),
      ];

  const effectiveProfile =
    effectiveProfiles.length === 1
      ? effectiveProfiles[0].id
      : effectiveProfiles.some((p) => p.id === profile)
        ? profile
        : effectiveProfiles[0]?.id || 'olga';

  const currentSheetId =
    effectiveProfiles.find((p) => p.id === effectiveProfile)?.sheetId || SPREADSHEET_ID;

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
      checkSheetAccess(accessToken, SPREADSHEET_ID),
      SPREADSHEET_ID_2 ? checkSheetAccess(accessToken, SPREADSHEET_ID_2) : Promise.resolve(false),
    ]).then(([id1, id2]) => {
      if (!cancelled) setSheetAccess({ id1: !!id1, id2: !!id2 });
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, isTestData]);

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
        const s = computeStatistics(months, { profileId: effectiveProfile });
        setStats(s);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [accessToken, sheetAccess, currentSheetId, fetchKey, effectiveProfile, isTestData]);

  useEffect(() => {
    if (isTestData || !accessToken || !currentSheetId || !stats) return;
    const intervalId = setInterval(() => {
      fetchSheetData(accessToken, currentSheetId)
        .then((csvText) => {
          const rows = parseCSV(csvText);
          const months = groupByMonth(rows);
          const s = computeStatistics(months, { profileId: effectiveProfile });
          setStats(s);
        })
        .catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [isTestData, accessToken, currentSheetId, effectiveProfile, stats]);

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
