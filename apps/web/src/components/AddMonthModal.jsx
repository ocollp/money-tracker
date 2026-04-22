import { useState, useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext.jsx';
import { appendRowsViaBackend } from '../services/sheetsApi.js';
import { formatMoney } from '../utils/formatters.js';

const MONTH_NAMES = ['', 'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
  'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];

function nextMonth(lastMonth) {
  if (!lastMonth) {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }
  const m = lastMonth.date.getMonth() + 2;
  const y = lastMonth.date.getFullYear();
  return m > 12 ? { month: 1, year: y + 1 } : { month: m, year: y };
}

function detectDateFormat(lastMonth) {
  const sample = lastMonth?.entries?.[0]?.date || '';
  if (sample.includes('-')) return 'dd-mm-yy';
  return 'd/mm/yyyy';
}

function formatDate(month, year, format) {
  if (format === 'dd-mm-yy') {
    return `01-${String(month).padStart(2, '0')}-${String(year).slice(2)}`;
  }
  return `1/${String(month).padStart(2, '0')}/${year}`;
}

export default function AddMonthModal({
  months,
  spreadsheetId,
  appJwt,
  apiUrl,
  onClose,
  onSaved,
  fixedHousingSheetValue,
  fixedHousingSheetEntity,
}) {
  const { t } = useI18n();
  const lastMonth = months?.[months.length - 1];
  const target = nextMonth(lastMonth);
  const dateFormat = detectDateFormat(lastMonth);

  const fixedHousing = useMemo(() => {
    const a = fixedHousingSheetValue;
    if (a == null || !Number.isFinite(a) || a === 0) return null;
    const entityTrim = (fixedHousingSheetEntity || 'BBVA').trim() || 'BBVA';
    return { amount: a, entity: entityTrim };
  }, [fixedHousingSheetValue, fixedHousingSheetEntity]);

  const initialRows = useMemo(() => {
    if (!lastMonth?.entries?.length) return [];
    const entNorm = fixedHousing?.entity.toLowerCase();
    return lastMonth.entries
      .filter((e) => {
        if (e.category !== 'Vivienda personal') return true;
        if (!fixedHousing) return false;
        return String(e.entity).trim().toLowerCase() !== entNorm;
      })
      .map(e => ({
        type: e.type,
        category: e.category,
        entity: e.entity,
        prevAmount: e.amount,
        amount: '',
      }));
  }, [lastMonth, fixedHousing]);

  const [rows, setRows] = useState(initialRows);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const updateAmount = (i, val) => {
    setRows(prev => prev.map((r, j) => j === i ? { ...r, amount: val } : r));
  };

  const allFilled = rows.every(r => r.amount !== '' && r.entity && r.category);

  const handleSave = async () => {
    if (!allFilled) return;
    setSaving(true);
    setError(null);

    const date = formatDate(target.month, target.year, dateFormat);
    const payload = rows.map(r => ({
      date,
      month: target.month,
      year: target.year,
      type: r.type,
      category: r.category,
      entity: r.entity,
      amount: parseFloat(String(r.amount).replace(',', '.')),
    }));

    const housingEntry = lastMonth?.entries?.find(e => e.category === 'Vivienda personal');
    if (!fixedHousing && housingEntry) {
      payload.push({
        date, month: target.month, year: target.year,
        type: housingEntry.type, category: housingEntry.category,
        entity: housingEntry.entity, amount: housingEntry.amount,
      });
    }

    try {
      await appendRowsViaBackend(appJwt, spreadsheetId, payload, apiUrl);
      setSuccess(true);
      setTimeout(() => {
        onSaved?.();
        onClose();
      }, 1200);
    } catch (e) {
      setError(e.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const total = rows.reduce((s, r) => {
    const v = parseFloat(String(r.amount).replace(',', '.'));
    return s + (isNaN(v) ? 0 : v);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface-alt w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl border border-white/[0.06] shadow-2xl max-h-[90svh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {t.addMonthTitle ?? 'Afegir mes'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {MONTH_NAMES[target.month]} {target.year}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-text-secondary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2 group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-text-secondary truncate">{r.entity}</span>
                  <span className="text-[10px] text-text-secondary/50 truncate">{r.category}</span>
                  <span className="text-[10px] text-text-secondary/40">{r.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={r.amount}
                    onChange={e => updateAmount(i, e.target.value)}
                    placeholder={String(r.prevAmount)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-white/[0.15] transition-colors tabular-nums"
                  />
                  {r.prevAmount !== 0 && r.amount !== '' && (
                    <span className={`text-[10px] shrink-0 tabular-nums ${
                      parseFloat(String(r.amount).replace(',', '.')) > r.prevAmount ? 'text-positive' :
                      parseFloat(String(r.amount).replace(',', '.')) < r.prevAmount ? 'text-negative' : 'text-text-secondary/40'
                    }`}>
                      {parseFloat(String(r.amount).replace(',', '.')) > r.prevAmount ? '+' : ''}
                      {formatMoney(parseFloat(String(r.amount).replace(',', '.')) - r.prevAmount)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-white/[0.06] space-y-3">
          {error && <p className="text-negative text-xs">{error}</p>}
          {success && <p className="text-positive text-xs">{t.addMonthSuccess ?? 'Dades afegides correctament!'}</p>}

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">
              {t.addMonthTotal ?? 'Total'}: <span className="font-semibold text-text-primary tabular-nums">{formatMoney(total)}</span>
            </span>
            <button
              onClick={handleSave}
              disabled={!allFilled || saving || success}
              className="px-5 py-2.5 rounded-xl bg-white/[0.08] text-text-primary text-sm font-medium hover:bg-white/[0.12] transition-all active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {saving ? t.loading : success ? (t.addMonthSaved ?? 'Desat!') : (t.addMonthSave ?? 'Desar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
