import { useEffect, useRef, useState } from 'react';
import PrivacyMenuItem from './PrivacyMenuItem.jsx';

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

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
);

const FaceIdIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h.01M15 12h.01M9.5 15.5a3.5 3.5 0 005 0M7 3.5A1.5 1.5 0 003.5 5v2M17 3.5A1.5 1.5 0 0120.5 5v2M7 20.5A1.5 1.5 0 003.5 19v-2M17 20.5A1.5 1.5 0 0020.5 19v-2" /></svg>
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
  onLogout,
  t,
  stats,
  onAddMonth,
  passkey,
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

  const menuAction = (fn) => () => { fn(); onClose(); };

  const userSection = (isCollapsed, extraClass = '') => {
    if (!user) return null;
    return (
      <div className={`border-b border-white/[0.06] ${extraClass}`}>
        <div className={`relative overflow-hidden ${isCollapsed ? 'px-2 py-4' : 'px-4 py-5'}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/[0.06] via-transparent to-indigo-500/[0.04] pointer-events-none" />
          <div className={`relative flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            {user.picture ? (
              <img
                src={user.picture}
                alt=""
                className={`rounded-full ring-2 ring-sky-500/25 shrink-0 shadow-sm ${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'}`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`rounded-full bg-gradient-to-br from-sky-500/25 to-sky-600/10 flex items-center justify-center text-sky-200 font-bold text-sm shrink-0 ${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'}`}>
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
      className="hidden sm:flex fixed top-0 left-0 bottom-0 z-30 glass-sidebar flex-col transition-all duration-300 ease-in-out"
      style={{ width: collapsed ? COLLAPSED_W : EXPANDED_W }}
    >
      {userSection(collapsed)}
      {profileSection(collapsed, onSwitchProfile)}

      <div className={`flex-1 ${collapsed ? 'px-2' : 'px-3'}`} />

      <div className={`border-t border-white/[0.06] space-y-1.5 py-3 ${collapsed ? 'px-2' : 'px-3'}`}>
        <PrivacyMenuItem collapsed={collapsed} />
        <DrawerItem
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16m8-8H4" /></svg>}
          label={t.addMonth ?? 'Afegir mes'}
          onClick={onAddMonth}
          collapsed={collapsed}
          iconColor="text-emerald-400/70"
          disabled={!stats}
        />
        <DrawerItem icon={<SettingsIcon />} label={t.settings} onClick={onSettings} collapsed={collapsed} iconColor="text-sky-400/70" />
        {user && passkey?.supported && !passkey.hasRegistered && (
          <DrawerItem
            icon={<FaceIdIcon />}
            label={t.registerFaceId ?? 'Activar Face ID'}
            onClick={passkey.register}
            collapsed={collapsed}
            iconColor="text-emerald-400/70"
            disabled={passkey.registering}
          />
        )}
        {user && (
          <DrawerItem icon={<LogoutIcon />} label={t.logout} onClick={onLogout} danger collapsed={collapsed} />
        )}
      </div>

      <button
        type="button"
        onClick={onToggleCollapse}
        className="absolute top-1/2 -translate-y-1/2 -right-3.5 z-40 w-7 h-7 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-lg flex items-center justify-center text-text-secondary/50 hover:text-text-primary hover:border-brand/35 hover:shadow-brand/10 transition-all duration-200"
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
        className={`fixed top-0 left-0 bottom-0 z-50 w-[280px] max-w-[80vw] glass-sidebar shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top, 0px))' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        {userSection(false, 'mb-1')}
        {profileSection(false, (id) => menuAction(() => onSwitchProfile(id))())}

        <div className="flex-1 px-3" />

        <div className="px-3 py-3 border-t border-white/[0.06] space-y-1.5" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}>
          <PrivacyMenuItem collapsed={false} onAfterToggle={onClose} />
          <DrawerItem
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16m8-8H4" /></svg>}
            label={t.addMonth ?? 'Afegir mes'}
            onClick={menuAction(onAddMonth)}
            iconColor="text-emerald-400/70"
            disabled={!stats}
          />
          <DrawerItem icon={<SettingsIcon />} label={t.settings} onClick={menuAction(onSettings)} iconColor="text-sky-400/70" />
          {user && passkey?.supported && !passkey.hasRegistered && (
            <DrawerItem
              icon={<FaceIdIcon />}
              label={t.registerFaceId ?? 'Activar Face ID'}
              onClick={() => { passkey.register(); onClose(); }}
              iconColor="text-emerald-400/70"
              disabled={passkey.registering}
            />
          )}
          {user && (
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
