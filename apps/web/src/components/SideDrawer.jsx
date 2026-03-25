import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext.jsx';

const LANG_LABELS = { CAT: 'CA', ES: 'ES', EN: 'EN' };

const COLLAPSED_KEY = 'mt_sidebar_collapsed';
const EXPANDED_W = 240;
const COLLAPSED_W = 64;

function getInitialCollapsed() {
  try { return localStorage.getItem(COLLAPSED_KEY) === '1'; } catch { return false; }
}

export function useSidebarLayout() {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0'); } catch {}
      return next;
    });
  };
  return { collapsed, toggle, width: collapsed ? COLLAPSED_W : EXPANDED_W };
}

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);

const RefreshIcon = ({ spinning }) => (
  <svg className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
);

const TestIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
);

const ExitIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /></svg>
);

const InsightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
);

export default function SideDrawer({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
  user,
  effectiveProfiles,
  effectiveProfile,
  onSwitchProfile,
  onSettings,
  onRefresh,
  onLogout,
  loading,
  isTestData,
  t,
  stats,
  onInsight,
}) {
  const touchStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    if (dx < -60) onClose();
  };

  const { lang, setLang, LANGS } = useI18n();
  const menuAction = (fn) => () => { fn(); onClose(); };

  const langSwitcher = (isCollapsed) => {
    if (isCollapsed) {
      return (
        <div className="flex flex-col items-center gap-0.5">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`w-full py-1.5 rounded-lg text-[10px] font-semibold tracking-wide transition-all duration-150 ${
                l === lang ? 'text-brand bg-brand/10' : 'text-text-secondary/50 hover:text-text-secondary'
              }`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-1.5">
        <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary/40 flex items-center gap-1.5">
          <span>🌐</span>
          <span>{t.sectionLanguage}</span>
        </p>
        <div className="flex rounded-lg bg-white/[0.03] border border-white/[0.06] p-0.5">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all duration-150 ${
                l === lang ? 'bg-brand text-white shadow-sm' : 'text-text-secondary/60 hover:text-text-secondary'
              }`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const userSection = (isCollapsed, extraClass = '') => {
    if (!user) return null;
    return (
      <div className={`border-b border-white/[0.06] ${extraClass}`}>
        <div className={`relative overflow-hidden ${isCollapsed ? 'px-2 py-4' : 'px-4 py-5'}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.08] to-transparent pointer-events-none" />
          <div className={`relative flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            {user.picture ? (
              <img
                src={user.picture}
                alt=""
                className={`rounded-full ring-2 ring-brand/20 shrink-0 shadow-sm ${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'}`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`rounded-full bg-gradient-to-br from-brand/30 to-brand/10 flex items-center justify-center text-brand font-bold text-sm shrink-0 ${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'}`}>
                {user.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{user.name}</p>
                <p className="text-[11px] text-text-secondary/60 truncate">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const profileSection = (isCollapsed, useFn) => {
    if (effectiveProfiles.length <= 1) return null;
    return (
      <div className={`border-b border-white/[0.06] ${isCollapsed ? 'px-2 py-3' : 'px-3 py-3'}`}>
        {!isCollapsed && (
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-text-secondary/40">
            {t.sectionProfiles}
          </p>
        )}
        <div className="space-y-0.5">
          {effectiveProfiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => useFn(p.id)}
              title={isCollapsed ? p.name : undefined}
              className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${isCollapsed ? 'justify-center px-1 py-2' : 'gap-3 px-3 py-2.5'} ${
                effectiveProfile === p.id
                  ? 'bg-brand/12 text-brand shadow-sm shadow-brand/5'
                  : 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary'
              }`}
            >
              <span className={`${isCollapsed ? 'text-xl' : 'text-lg'} ${effectiveProfile === p.id ? 'drop-shadow-sm' : ''}`}>{p.emoji}</span>
              {!isCollapsed && <span>{p.name}</span>}
              {!isCollapsed && effectiveProfile === p.id && (
                <svg className="w-4 h-4 ml-auto text-brand/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const desktopSidebar = (
    <aside
      className="hidden sm:flex fixed top-0 left-0 bottom-0 z-30 bg-surface-alt border-r border-white/[0.06] flex-col transition-all duration-300 ease-in-out"
      style={{ width: collapsed ? COLLAPSED_W : EXPANDED_W }}
    >
      {userSection(collapsed)}
      {profileSection(collapsed, onSwitchProfile)}

      <div className={`flex-1 py-3 space-y-0.5 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`}>
        {!isTestData && (
          <>
            <DrawerItem icon={<SettingsIcon />} label={t.settings} onClick={onSettings} collapsed={collapsed} iconColor="text-sky-400/70" />
            <DrawerItem icon={<RefreshIcon spinning={loading} />} label={t.refreshData} onClick={onRefresh} disabled={loading} collapsed={collapsed} iconColor="text-emerald-400/70" />
            <DrawerItem icon={<InsightIcon />} label={t.insightButton} onClick={onInsight} collapsed={collapsed} iconColor="text-amber-400/70" disabled={!stats} />
            <DrawerItem icon={<TestIcon />} label={t.testData} href={`${import.meta.env.BASE_URL || ''}test`} collapsed={collapsed} iconColor="text-violet-400/70" />
          </>
        )}
        {isTestData && (
          <DrawerItem icon={<ExitIcon />} label={t.exit} href={import.meta.env.BASE_URL || '/'} collapsed={collapsed} iconColor="text-sky-400/70" />
        )}
      </div>

      <div className={`border-t border-white/[0.06] space-y-1.5 py-3 ${collapsed ? 'px-2' : 'px-3'}`}>
        {langSwitcher(collapsed)}
        {!isTestData && user && (
          <DrawerItem icon={<LogoutIcon />} label={t.logout} onClick={onLogout} danger collapsed={collapsed} />
        )}
      </div>

      <button
        type="button"
        onClick={onToggleCollapse}
        className="absolute top-1/2 -translate-y-1/2 -right-3.5 z-40 w-7 h-7 rounded-full bg-surface-alt border border-white/[0.08] shadow-lg flex items-center justify-center text-text-secondary/50 hover:text-text-primary hover:border-brand/30 hover:shadow-brand/10 transition-all duration-200"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </aside>
  );

  const mobileDrawer = (
    <div className="sm:hidden">
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden
      />
      <nav
        className={`fixed top-0 left-0 bottom-0 z-50 w-[280px] max-w-[80vw] bg-surface-alt border-r border-white/[0.06] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top, 0px))' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        {userSection(false, 'mb-1')}
        {profileSection(false, (id) => menuAction(() => onSwitchProfile(id))())}

        <div className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {!isTestData && (
            <>
              <DrawerItem icon={<SettingsIcon />} label={t.settings} onClick={menuAction(onSettings)} iconColor="text-sky-400/70" />
              <DrawerItem icon={<RefreshIcon spinning={loading} />} label={t.refreshData} onClick={menuAction(onRefresh)} disabled={loading} iconColor="text-emerald-400/70" />
              <DrawerItem icon={<InsightIcon />} label={t.insightButton} onClick={() => { onInsight?.(); onClose(); }} iconColor="text-amber-400/70" disabled={!stats} />
              <DrawerItem icon={<TestIcon />} label={t.testData} href={`${import.meta.env.BASE_URL || ''}test`} onClick={onClose} iconColor="text-violet-400/70" />
            </>
          )}
          {isTestData && (
            <DrawerItem icon={<ExitIcon />} label={t.exit} href={import.meta.env.BASE_URL || '/'} onClick={onClose} iconColor="text-sky-400/70" />
          )}
        </div>

        <div className="px-3 py-3 border-t border-white/[0.06] space-y-1.5" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}>
          {langSwitcher(false)}
          {!isTestData && user && (
            <DrawerItem icon={<LogoutIcon />} label={t.logout} onClick={menuAction(onLogout)} danger />
          )}
        </div>
      </nav>
    </div>
  );

  return (
    <>
      {desktopSidebar}
      {mobileDrawer}
    </>
  );
}

function DrawerItem({ icon, label, onClick, href, disabled, danger, collapsed, iconColor }) {
  const cls = `group w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
    collapsed ? 'justify-center px-1 py-2.5' : 'gap-3 px-3 py-2.5'
  } ${
    danger
      ? 'text-negative/70 hover:bg-negative/8 hover:text-negative'
      : 'text-text-secondary hover:bg-white/[0.05] hover:text-text-primary'
  } ${disabled ? 'opacity-40 pointer-events-none' : ''}`;

  const iconWrap = iconColor && !danger
    ? <span className={`${iconColor} group-hover:scale-110 transition-transform duration-200`}>{icon}</span>
    : icon;

  const content = (
    <>
      {iconWrap}
      {!collapsed && label && <span>{label}</span>}
    </>
  );

  if (href) {
    return <a href={href} className={cls} onClick={onClick} title={collapsed ? label : undefined}>{content}</a>;
  }

  return (
    <button type="button" className={cls} onClick={onClick} disabled={disabled} title={collapsed ? label : undefined}>
      {content}
    </button>
  );
}
