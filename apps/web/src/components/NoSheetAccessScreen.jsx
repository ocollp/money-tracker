import { useState } from 'react';
import { getAppJwt } from '../hooks/useBackendProfile';

export default function NoSheetAccessScreen({
  onLogout,
  hasPrimarySheetId,
  primarySpreadsheetId,
  hasSecondarySheetConfigured,
  userEmail,
  canSaveSpreadsheetViaApi,
  patchSettings,
}) {
  const [sheetId, setSheetId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(null);

  const handleSaveApi = async (e) => {
    e.preventDefault();
    const id = sheetId.trim();
    if (!id) {
      setSaveErr('Enganxa l’ID del full (o l’URL sencer).');
      return;
    }
    const extracted = extractSpreadsheetId(id);
    if (!extracted) {
      setSaveErr('No s’ha pogut llegir l’ID. Prova només la part entre /d/ i /edit a l’URL del full.');
      return;
    }
    setSaveErr(null);
    setSaving(true);
    try {
      await patchSettings({ spreadsheetId: extracted });
    } catch (err) {
      setSaveErr(err?.message || 'Error en desar');
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="bg-surface-alt/90 rounded-2xl p-8 border border-white/[0.06] shadow-xl text-left max-w-lg w-full space-y-5">
        <div className="text-center space-y-2">
          <p className="text-negative text-lg font-medium">Error al carregar les dades</p>
          <p className="text-text-secondary text-sm">
            {hasPrimarySheetId
              ? 'El teu compte de Google no pot llegir el full configurat, o l’ID no és vàlid.'
              : 'Encara no hi ha cap full de càlcul configurat.'}
          </p>
        </div>

        <div className="text-text-secondary text-sm space-y-3 border border-white/[0.06] rounded-xl p-4 bg-black/20">
          {hasPrimarySheetId ? (
            <>
              <p className="font-medium text-text-primary">Ja tens un full principal configurat</p>
              <p className="leading-relaxed">
                L’app està intentant llegir l’ID{' '}
                <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded break-all text-text-primary">
                  {summarizeSpreadsheetId(primarySpreadsheetId)}
                </code>
                . El problema sol ser de <strong>permisos</strong>, no del fitxer <code className="text-xs">.env</code>.
              </p>
              {primarySpreadsheetId ? (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${encodeURIComponent(primarySpreadsheetId)}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-sm text-brand hover:underline font-medium"
                >
                  Obrir el full a Google Sheets ↗
                </a>
              ) : null}
              <ol className="list-decimal list-inside space-y-2 leading-relaxed pt-1">
                <li>
                  A Google Sheets, <strong>Comparteix</strong> aquest full amb el mateix compte amb què has iniciat
                  sessió
                  {userEmail ? (
                    <>
                      {' '}
                      (<span className="text-text-primary">{userEmail}</span>)
                    </>
                  ) : null}
                  , amb rol de <strong>lector</strong> o superior.
                </li>
                <li>
                  Comprova que has iniciat sessió a l’app amb aquest compte (si tens diversos Gmail, tanca sessió i
                  torna a entrar amb el correcte).
                </li>
                {hasSecondarySheetConfigured ? (
                  <li>
                    També tens un <strong>segon full</strong> configurat: comparte’l amb el mateix compte si vols usar
                    el perfil secundari.
                  </li>
                ) : null}
                {canSaveSpreadsheetViaApi ? (
                  <li>
                    Si fas servir l’API de perfil, revisa al modal <strong>Perfil</strong> que l’ID del full coincideixi
                    amb el del teu <code className="text-xs bg-white/10 px-1 rounded">.env</code> (el servidor pot
                    sobreescriure el valor per defecte).
                  </li>
                ) : null}
              </ol>
            </>
          ) : (
            <>
              <p className="font-medium text-text-primary">Com configurar el primer full</p>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>
                  Obre el full a Google Sheets. Copia l’ID de la URL: la part entre{' '}
                  <code className="text-xs bg-white/10 px-1 rounded">/d/</code> i{' '}
                  <code className="text-xs bg-white/10 px-1 rounded">/edit</code>.
                </li>
                <li>
                  Comparteix el full amb el compte amb què entraràs a l’app
                  {userEmail ? (
                    <>
                      {' '}
                      (<span className="text-text-primary">{userEmail}</span>)
                    </>
                  ) : null}
                  , com a <strong>lector</strong> com a mínim.
                </li>
                <li>
                  Afegeix al <code className="text-xs bg-white/10 px-1 rounded">.env</code> (arrel del repositori o{' '}
                  <code className="text-xs bg-white/10 px-1 rounded">apps/web/.env</code>):
                  <br />
                  <code className="block mt-2 text-xs bg-white/10 p-2 rounded break-all">
                    VITE_SPREADSHEET_ID=l’ID_que_has_copiat
                  </code>
                  Després <strong>atura i torna a arrencar</strong> <code className="text-xs">npm run dev</code>.
                </li>
              </ol>
            </>
          )}
        </div>

        {canSaveSpreadsheetViaApi && getAppJwt() ? (
          <form onSubmit={handleSaveApi} className="space-y-3">
            <p className="text-sm text-text-secondary">
              {hasPrimarySheetId
                ? 'Si l’ID al servidor és incorrecte, pots corregir-lo al perfil (sense tocar el .env local):'
                : 'O desa l’ID del full al teu perfil (API activa), sense editar el .env:'}
            </p>
            <input
              type="text"
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value)}
              placeholder="ID del full o URL sencer"
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50"
              disabled={saving}
            />
            {saveErr ? <p className="text-negative text-sm">{saveErr}</p> : null}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-brand text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Desant…' : 'Desar i tornar a provar'}
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
            Tancar sessió
          </button>
        </div>
      </div>
    </div>
  );
}

function summarizeSpreadsheetId(id) {
  const s = String(id || '').trim();
  if (!s) return '(buit)';
  if (s.length <= 18) return s;
  return `${s.slice(0, 8)}…${s.slice(-8)}`;
}

function extractSpreadsheetId(raw) {
  const t = raw.trim();
  if (!t) return '';
  const m = t.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9-_]+$/.test(t) && t.length > 20) return t;
  return '';
}
