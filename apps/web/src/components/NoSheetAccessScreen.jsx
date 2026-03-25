import { useState } from 'react';
import { getAppJwt } from '../hooks/useBackendProfile';
import { useI18n } from '../i18n/I18nContext.jsx';

function NoSheetStep1Line({ t }) {
  const s = t.noSheetStep1;
  const d = '/d/';
  const i = s.indexOf(d);
  const j = s.indexOf('/edit');
  if (i === -1 || j === -1 || j < i) {
    return <>{s}</>;
  }
  const before = s.slice(0, i);
  const between = s.slice(i + d.length, j);
  const after = s.slice(j + '/edit'.length);
  return (
    <>
      {before}
      <code className="text-xs bg-white/10 px-1 rounded">{d}</code>
      {between}
      <code className="text-xs bg-white/10 px-1 rounded">/edit</code>
      {after}
    </>
  );
}

function NoSheetStep3Intro({ t }) {
  const s = t.noSheetStep3;
  const pathKey = 'apps/web/.env';
  const i = s.indexOf('.env');
  if (i === -1) {
    return s;
  }
  const before = s.slice(0, i);
  const rest = s.slice(i + '.env'.length);
  const k = rest.indexOf(pathKey);
  if (k === -1) {
    return (
      <>
        {before}
        <code className="text-xs bg-white/10 px-1 rounded">.env</code>
        {rest}
      </>
    );
  }
  const mid = rest.slice(0, k);
  const tail = rest.slice(k + pathKey.length);
  return (
    <>
      {before}
      <code className="text-xs bg-white/10 px-1 rounded">.env</code>
      {mid}
      <code className="text-xs bg-white/10 px-1 rounded">{pathKey}</code>
      {tail}
    </>
  );
}

function NoSheetStep3RestartLine({ t }) {
  const s = t.noSheetStep3Restart;
  const cmd = 'npm run dev';
  const k = s.indexOf(cmd);
  if (k === -1) {
    return s;
  }
  return (
    <>
      {s.slice(0, k)}
      <code className="text-xs">{cmd}</code>
      {s.slice(k + cmd.length)}
    </>
  );
}

export default function NoSheetAccessScreen({
  onLogout,
  hasPrimarySheetId,
  primarySpreadsheetId,
  hasSecondarySheetConfigured,
  userEmail,
  canSaveSpreadsheetViaApi,
  patchSettings,
}) {
  const { t } = useI18n();
  const [sheetId, setSheetId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(null);

  const handleSaveApi = async (e) => {
    e.preventDefault();
    const id = sheetId.trim();
    if (!id) {
      setSaveErr(t.noSheetPasteError);
      return;
    }
    const extracted = extractSpreadsheetId(id);
    if (!extracted) {
      setSaveErr(t.noSheetIdError);
      return;
    }
    setSaveErr(null);
    setSaving(true);
    try {
      await patchSettings({ spreadsheetId: extracted });
    } catch (err) {
      setSaveErr(err?.message || t.settingsErrorSave);
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="bg-surface-alt/90 rounded-2xl p-8 border border-white/[0.06] shadow-xl text-left max-w-lg w-full space-y-5">
        <div className="text-center space-y-2">
          <p className="text-negative text-lg font-medium">{t.noSheetError}</p>
          <p className="text-text-secondary text-sm">
            {hasPrimarySheetId ? t.noSheetNoAccess : t.noSheetNotConfigured}
          </p>
        </div>

        <div className="text-text-secondary text-sm space-y-3 border border-white/[0.06] rounded-xl p-4 bg-black/20">
          {hasPrimarySheetId ? (
            <>
              <p className="font-medium text-text-primary">{t.noSheetHasId}</p>
              <p className="leading-relaxed">
                {t.noSheetReadingId}{' '}
                <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded break-all text-text-primary">
                  {summarizeSpreadsheetId(primarySpreadsheetId, t.noSheetEmpty)}
                </code>
                . {t.noSheetPermissions}
              </p>
              {primarySpreadsheetId ? (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${encodeURIComponent(primarySpreadsheetId)}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-sm text-brand hover:underline font-medium"
                >
                  {t.noSheetOpenLink}
                </a>
              ) : null}
              <ol className="list-decimal list-inside space-y-2 leading-relaxed pt-1">
                <li>{t.noSheetShare(userEmail)}</li>
                <li>{t.noSheetCheckAccount}</li>
                {hasSecondarySheetConfigured ? <li>{t.noSheetSecondary}</li> : null}
                {canSaveSpreadsheetViaApi ? <li>{t.noSheetApiHint}</li> : null}
              </ol>
            </>
          ) : (
            <>
              <p className="font-medium text-text-primary">{t.noSheetHowTo}</p>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>
                  <NoSheetStep1Line t={t} />
                </li>
                <li>{t.noSheetStep2(userEmail)}</li>
                <li>
                  <NoSheetStep3Intro t={t} />
                  <br />
                  <code className="block mt-2 text-xs bg-white/10 p-2 rounded break-all">{t.noSheetEnvLine}</code>
                  <br />
                  <span className="inline-block mt-2">
                    <NoSheetStep3RestartLine t={t} />
                  </span>
                </li>
              </ol>
            </>
          )}
        </div>

        {canSaveSpreadsheetViaApi && getAppJwt() ? (
          <form onSubmit={handleSaveApi} className="space-y-3">
            <p className="text-sm text-text-secondary">
              {hasPrimarySheetId ? t.noSheetFixApi : t.noSheetSaveApi}
            </p>
            <input
              type="text"
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value)}
              placeholder={t.noSheetPlaceholder}
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50"
              disabled={saving}
            />
            {saveErr ? <p className="text-negative text-sm">{saveErr}</p> : null}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-brand text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? t.noSheetSavingBtn : t.noSheetSaveBtn}
            </button>
          </form>
        ) : null}

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-all duration-200 underline active:opacity-80"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {t.logout}
          </button>
        </div>
      </div>
    </div>
  );
}

function summarizeSpreadsheetId(id, emptyLabel) {
  const s = String(id || '').trim();
  if (!s) return emptyLabel;
  if (s.length <= 18) return s;
  return `${s.slice(0, 8)}…${s.slice(-8)}`;
}

function extractSpreadsheetId(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const m = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9-_]+$/.test(trimmed) && trimmed.length > 20) return trimmed;
  return '';
}
