import { useState, useEffect } from 'react';
import SettingsIcon from './icons/SettingsIcon';

const fields = [
  { key: 'spreadsheetId', label: 'ID full principal (Google Sheets)', type: 'text' },
  { key: 'spreadsheetId2', label: 'ID segon full (opcional)', type: 'text' },
  { key: 'profilePrimaryLabel', label: 'Nom perfil principal', type: 'text' },
  { key: 'profileSecondaryLabel', label: 'Nom perfil secundari', type: 'text' },
  { key: 'profilePrimaryEmoji', label: 'Emoji perfil principal', type: 'text' },
  { key: 'profileSecondaryEmoji', label: 'Emoji perfil secundari', type: 'text' },
  { key: 'mortgageEndYear', label: 'Any fi hipoteca', type: 'number' },
  { key: 'mortgageEndMonth', label: 'Mes fi hipoteca (1–12)', type: 'number' },
  { key: 'mortgageMonthlyPayment', label: 'Quota hipoteca mensual (€)', type: 'number' },
  { key: 'ownershipShare', label: 'Quota de propietat (ex. 0,5)', type: 'text' },
  { key: 'assumedUnemployment', label: 'Atur assumit (€/mes)', type: 'number' },
];

const LOCAL_EDIT_KEYS = new Set([
  'profilePrimaryLabel',
  'profileSecondaryLabel',
  'profilePrimaryEmoji',
  'profileSecondaryEmoji',
]);

function buildPatchFromForm(form) {
  const patch = {};
  for (const { key } of fields) {
    const raw = form[key]?.trim?.() ?? '';
    if (raw === '') patch[key] = null;
    else if (['mortgageEndYear', 'mortgageEndMonth', 'mortgageMonthlyPayment', 'assumedUnemployment'].includes(key)) {
      const n = Number(raw);
      patch[key] = Number.isNaN(n) ? null : n;
    } else if (key === 'ownershipShare') {
      const n = Number(raw.replace(',', '.'));
      patch[key] = Number.isNaN(n) ? null : n;
    } else {
      patch[key] = raw;
    }
  }
  return patch;
}

export default function ProfileSettings({
  open,
  onClose,
  settings,
  onSave,
  onSaveLocalDisplay,
  readOnly = false,
  readOnlySubtitle = null,
  settingsVariant = 'api',
}) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const isLocalDisplay = settingsVariant === 'local-display';

  useEffect(() => {
    if (!open || !settings) return;
    const next = {};
    for (const { key } of fields) {
      const v = settings[key];
      next[key] = v == null ? '' : String(v);
    }
    setForm(next);
    setErr(null);
  }, [open, settings]);

  if (!open) return null;

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const fieldLocked = (key) => {
    if (isLocalDisplay) return !LOCAL_EDIT_KEYS.has(key);
    return readOnly;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      if (isLocalDisplay) {
        if (!onSaveLocalDisplay) return;
        const full = buildPatchFromForm(form);
        const patch = {};
        for (const k of LOCAL_EDIT_KEYS) {
          patch[k] = full[k];
        }
        await Promise.resolve(onSaveLocalDisplay(patch));
        onClose();
        return;
      }
      if (readOnly || !onSave) return;
      const patch = buildPatchFromForm(form);
      await onSave(patch);
      onClose();
    } catch (er) {
      setErr(er.message || 'Error en guardar');
    } finally {
      setSaving(false);
    }
  };

  const showSave =
    (isLocalDisplay && onSaveLocalDisplay) || (!isLocalDisplay && !readOnly && onSave);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="bg-surface-alt border border-white/[0.08] rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-white/[0.06] flex justify-between items-center gap-2">
          <h2 id="settings-title" className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 shrink-0 text-text-secondary" />
            Configuració
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface shrink-0"
            aria-label="Tancar"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {readOnlySubtitle ? (
            <p className="text-sm text-text-secondary leading-relaxed border border-white/[0.06] rounded-lg p-3 bg-black/20">
              {readOnlySubtitle}
            </p>
          ) : null}
          {isLocalDisplay ? (
            <p className="text-sm text-text-secondary border border-brand/20 rounded-lg p-3 bg-brand/5">
              Pots editar <strong>noms i emojis</strong> dels perfils; es desen al navegador (aquest dispositiu). La
              resta ve del <code className="text-brand">.env</code> — edita’l i reinicia Vite per canviar fulls o
              hipoteca.
            </p>
          ) : !readOnlySubtitle ? (
            <p className="text-sm text-text-secondary">
              Els valors buits al servidor fan servir el <code className="text-brand">.env</code> o els predeterminats.
            </p>
          ) : null}
          {fields.map(({ key, label, type }) => {
            const locked = fieldLocked(key);
            return (
              <label key={key} className="block space-y-1">
                <span className="text-xs font-medium text-text-secondary">{label}</span>
                <input
                  type={type}
                  value={form[key] ?? ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  readOnly={locked}
                  disabled={locked}
                  className="w-full rounded-lg bg-surface border border-white/[0.08] px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 disabled:opacity-80 disabled:cursor-not-allowed"
                />
              </label>
            );
          })}
          {err && <p className="text-sm text-negative">{err}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface"
            >
              Tancar
            </button>
            {showSave ? (
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-brand text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Guardant…' : 'Guardar'}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
