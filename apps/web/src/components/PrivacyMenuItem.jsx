import { usePrivacy } from '../context/PrivacyContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';

function EyeOffIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

export default function PrivacyMenuItem({ collapsed, onAfterToggle }) {
  const { hideMoney, toggleHideMoney } = usePrivacy();
  const { t } = useI18n();

  const label = hideMoney ? t.distributionPrivacyShowMoney : t.distributionPrivacyHideMoney;
  const Icon = hideMoney ? EyeIcon : EyeOffIcon;

  const handleClick = () => {
    toggleHideMoney();
    onAfterToggle?.();
  };

  const cls = `group w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
    collapsed ? 'justify-center px-1 py-2.5' : 'gap-3 px-3 py-2.5'
  } ${
    hideMoney
      ? 'bg-brand/12 text-brand border border-brand/25'
      : 'text-text-secondary hover:bg-white/[0.05] hover:text-text-primary border border-transparent'
  }`;

  const iconCls = hideMoney
    ? 'shrink-0 text-brand'
    : 'shrink-0 text-amber-400/70 group-hover:scale-110 transition-transform duration-200';

  return (
    <button
      type="button"
      className={cls}
      onClick={handleClick}
      aria-pressed={hideMoney}
      title={collapsed ? label : undefined}
    >
      <span className={iconCls}>
        <Icon />
      </span>
      {!collapsed && <span>{label}</span>}
    </button>
  );
}
