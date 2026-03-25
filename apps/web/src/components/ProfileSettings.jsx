import { useState, useEffect, useRef } from 'react';
import SettingsIcon from './icons/SettingsIcon';
import { useI18n } from '../i18n/I18nContext.jsx';

const LANG_LABELS = { CAT: 'Català', ES: 'Español', EN: 'English' };

const SHEET_FIELDS = [
  { key: 'spreadsheetId', labelKey: 'sheetIdPrimary', type: 'text' },
  { key: 'spreadsheetId2', labelKey: 'sheetIdSecondary', type: 'text' },
];

const PROFILE_FIELDS = [
  { key: 'profilePrimaryLabel', labelKey: 'profileName', type: 'text' },
  { key: 'profileSecondaryLabel', labelKey: 'profileName', type: 'text' },
];

const EMOJI_KEYS = {
  primary: 'profilePrimaryEmoji',
  secondary: 'profileSecondaryEmoji',
};

const MORTGAGE_FIELDS = [
  { key: 'mortgageEndYear', labelKey: 'mortgageEndYear', type: 'number' },
  { key: 'mortgageEndMonth', labelKey: 'mortgageEndMonth', type: 'number' },
  { key: 'mortgageMonthlyPayment', labelKey: 'mortgageMonthlyPayment', type: 'number' },
  { key: 'ownershipShare', labelKey: 'ownershipShare', type: 'text' },
];

const OTHER_FIELDS = [
  { key: 'assumedUnemployment', labelKey: 'assumedUnemployment', type: 'number' },
];

const ALL_FIELDS = [
  ...SHEET_FIELDS,
  ...PROFILE_FIELDS,
  { key: EMOJI_KEYS.primary },
  { key: EMOJI_KEYS.secondary },
  ...MORTGAGE_FIELDS,
  ...OTHER_FIELDS,
];

const LOCAL_EDIT_KEYS = new Set([
  'profilePrimaryLabel',
  'profileSecondaryLabel',
  'profilePrimaryEmoji',
  'profileSecondaryEmoji',
]);

function buildPatchFromForm(form) {
  const patch = {};
  for (const { key } of ALL_FIELDS) {
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

function EmojiPicker({ value, onChange, disabled }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleInput = (e) => {
    const raw = e.target.value;
    const segments = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(raw)];
    const last = segments.at(-1)?.segment ?? '';
    if (/\p{Emoji_Presentation}/u.test(last)) {
      onChange(last);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="w-12 h-12 rounded-xl bg-surface border border-white/[0.08] text-2xl flex items-center justify-center hover:border-brand/40 hover:bg-surface-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
      >
        {value || '😀'}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 z-10 bg-surface-alt border border-white/[0.08] rounded-xl shadow-xl p-3 w-56">
          <p className="text-[11px] text-text-secondary mb-2">{t.emojiPickerHint}</p>
          <input
            ref={inputRef}
            type="text"
            className="w-full rounded-lg bg-surface border border-white/[0.08] px-3 py-2.5 text-center text-2xl text-text-primary focus:border-brand/50 focus:outline-none transition-colors"
            value=""
            onChange={handleInput}
            placeholder="🙂"
          />
          <p className="text-[10px] text-text-secondary/60 mt-2 text-center">{t.emojiSystemHint}</p>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon, title, children }) {
  return (
    <div className="flex items-center justify-between gap-2 pt-2 first:pt-0">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary/70 flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function ToggleSwitch({ checked, onChange, disabled, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <span className="text-xs text-text-secondary">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 ${
          checked ? 'bg-brand' : 'bg-white/[0.1]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-[18px]' : ''
          }`}
        />
      </button>
    </label>
  );
}

function extractSheetId(raw) {
  const m = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function SheetIdInput({ label, value, onChange, locked }) {
  const { t } = useI18n();
  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text');
    const id = extractSheetId(text);
    if (id) {
      e.preventDefault();
      onChange(id);
    }
  };

  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const id = extractSheetId(e.target.value);
          onChange(id ?? e.target.value);
        }}
        onPaste={handlePaste}
        readOnly={locked}
        disabled={locked}
        placeholder={t.sheetPlaceholder}
        className="w-full rounded-lg bg-surface border border-white/[0.08] px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40 focus:border-brand/40 focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-mono text-xs"
      />
    </label>
  );
}

function FieldInput({ label, type, value, onChange, locked }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={locked}
        disabled={locked}
        className="w-full rounded-lg bg-surface border border-white/[0.08] px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-brand/40 focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </label>
  );
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
  const { t, lang, setLang, LANGS } = useI18n();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [mortgageEnabled, setMortgageEnabled] = useState(false);

  const isLocalDisplay = settingsVariant === 'local-display';

  useEffect(() => {
    if (!open || !settings) return;
    const next = {};
    for (const { key } of ALL_FIELDS) {
      const v = settings[key];
      next[key] = v == null ? '' : String(v);
    }
    setForm(next);
    setErr(null);

    const hasMortgage = [settings.mortgageEndYear, settings.mortgageMonthlyPayment]
      .some((v) => v != null && v !== '' && v !== 0);
    setMortgageEnabled(hasMortgage);
  }, [open, settings]);

  if (!open) return null;

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const fieldLocked = (key) => {
    if (isLocalDisplay) return !LOCAL_EDIT_KEYS.has(key);
    return readOnly;
  };

  const handleMortgageToggle = (enabled) => {
    setMortgageEnabled(enabled);
    if (!enabled) {
      setForm((f) => ({
        ...f,
        mortgageEndYear: '',
        mortgageEndMonth: '',
        mortgageMonthlyPayment: '',
        ownershipShare: '',
      }));
    }
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
      setErr(er.message || t.settingsErrorSave);
    } finally {
      setSaving(false);
    }
  };

  const showSave =
    (isLocalDisplay && onSaveLocalDisplay) || (!isLocalDisplay && !readOnly && onSave);

  const sheetsLocked = fieldLocked('spreadsheetId');
  const mortgageLocked = fieldLocked('mortgageEndYear');
  const profileLocked = fieldLocked('profilePrimaryLabel');
  const emojiLocked = fieldLocked('profilePrimaryEmoji');

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
            {t.settingsTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface shrink-0"
            aria-label={t.settingsClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {readOnlySubtitle && (
            <p className="text-sm text-text-secondary leading-relaxed border border-white/[0.06] rounded-lg p-3 bg-black/20">
              {readOnlySubtitle}
            </p>
          )}
          {isLocalDisplay ? (
            <p className="text-sm text-text-secondary border border-brand/20 rounded-lg p-3 bg-brand/5">
              {t.settingsLocalHint}
            </p>
          ) : !readOnlySubtitle ? (
            <p className="text-sm text-text-secondary">{t.settingsApiHint}</p>
          ) : null}

          <section className="space-y-3">
            <SectionHeader icon="👤" title={t.sectionProfiles} />
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: t.profilePrimary, nameField: PROFILE_FIELDS[0], emojiKey: EMOJI_KEYS.primary },
                { label: t.profileSecondary, nameField: PROFILE_FIELDS[1], emojiKey: EMOJI_KEYS.secondary },
              ].map(({ label, nameField, emojiKey }) => (
                <div key={emojiKey} className="rounded-xl bg-surface/50 border border-white/[0.06] p-3 space-y-3">
                  <p className="text-[11px] font-medium text-text-secondary/70 uppercase tracking-wider">{label}</p>
                  <div className="flex items-center gap-3">
                    <EmojiPicker
                      value={form[emojiKey] ?? ''}
                      onChange={(emoji) => handleChange(emojiKey, emoji)}
                      disabled={emojiLocked}
                    />
                    <div className="flex-1">
                      <FieldInput
                        label={t[nameField.labelKey]}
                        type={nameField.type}
                        value={form[nameField.key] ?? ''}
                        onChange={(v) => handleChange(nameField.key, v)}
                        locked={profileLocked}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeader icon="📊" title={t.sectionSheets} />
            <div className="rounded-xl bg-surface/50 border border-white/[0.06] p-3 space-y-3">
              <p className="text-[11px] text-text-secondary/70 leading-relaxed">
                {t.sheetPasteHint}{' '}
                <a
                  href="https://docs.google.com/spreadsheets/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:text-brand-light underline underline-offset-2 transition-colors"
                >
                  {t.sheetOpenLink}
                </a>
              </p>
              {SHEET_FIELDS.map(({ key, labelKey }) => (
                <SheetIdInput
                  key={key}
                  label={t[labelKey]}
                  value={form[key] ?? ''}
                  onChange={(v) => handleChange(key, v)}
                  locked={sheetsLocked}
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeader icon="🏠" title={t.sectionMortgage}>
              <ToggleSwitch
                checked={mortgageEnabled}
                onChange={handleMortgageToggle}
                disabled={mortgageLocked}
                label={mortgageEnabled ? t.mortgageActive : t.mortgageInactive}
              />
            </SectionHeader>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                mortgageEnabled
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="rounded-xl bg-surface/50 border border-white/[0.06] p-3 space-y-3">
                  {MORTGAGE_FIELDS.map(({ key, labelKey, type }) => (
                    <FieldInput
                      key={key}
                      label={t[labelKey]}
                      type={type}
                      value={form[key] ?? ''}
                      onChange={(v) => handleChange(key, v)}
                      locked={mortgageLocked}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeader icon="🌐" title={t.sectionLanguage} />
            <div className="rounded-xl bg-surface/50 border border-white/[0.06] p-3">
              <div className="flex rounded-xl bg-surface border border-white/[0.08] p-0.5">
                {LANGS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      l === lang
                        ? 'bg-brand text-white shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeader icon="⚙️" title={t.sectionOther} />
            <div className="rounded-xl bg-surface/50 border border-white/[0.06] p-3 space-y-3">
              {OTHER_FIELDS.map(({ key, labelKey, type }) => (
                <FieldInput
                  key={key}
                  label={t[labelKey]}
                  type={type}
                  value={form[key] ?? ''}
                  onChange={(v) => handleChange(key, v)}
                  locked={fieldLocked(key)}
                />
              ))}
            </div>
          </section>

          {err && (
            <p className="text-sm text-negative bg-negative/10 border border-negative/20 rounded-lg p-3">{err}</p>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface transition-colors"
            >
              {t.settingsClose}
            </button>
            {showSave && (
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-brand text-white hover:bg-brand-dark active:scale-[0.97] transition-all disabled:opacity-50"
              >
                {saving ? t.settingsSaving : t.settingsSave}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
