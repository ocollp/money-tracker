import { useState, memo } from 'react';
import { usePrivacy } from '../context/PrivacyContext.jsx';
import { formatPct } from '../utils/formatters';

function KpiCard({
  title,
  value,
  subtitle,
  detail,
  trend,
  icon,
  iconLabel,
  headerRight,
  tooltip,
  className = '',
  highlight = false,
  subtitleColor,
  privacyPct,
}) {
  const { hideMoney } = usePrivacy();
  const [showTip, setShowTip] = useState(false);
  const trendColor = subtitleColor ?? (trend > 0 ? 'text-positive' : trend < 0 ? 'text-negative' : 'text-text-secondary');
  const arrow = trend > 0 ? '↑' : trend < 0 ? '↓' : '';

  const hasPrivacyPct = hideMoney && privacyPct != null && !Number.isNaN(privacyPct);
  const displayValue = hideMoney
    ? (hasPrivacyPct ? formatPct(privacyPct) : '—')
    : value;
  const displaySubtitle = hideMoney && hasPrivacyPct ? null : subtitle;
  const displayDetail = hideMoney ? null : detail;
  const displayHeaderRight = hideMoney ? null : headerRight;
  const displayIconLabel = hideMoney ? null : iconLabel;

  return (
    <div className={`glass-card p-3 sm:p-5 relative min-w-0 overflow-hidden ${highlight ? 'ring-1 ring-brand/35' : ''} ${className}`.trim()}>
      <div className="flex items-center justify-between mb-1.5 sm:mb-3 gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-text-secondary text-xs sm:text-sm font-medium break-words leading-snug">
            {title}
          </span>
          {tooltip && (
            <button
              type="button"
              className="text-text-secondary/50 hover:text-brand transition-colors duration-150 active:scale-95 shrink-0"
              onMouseEnter={() => setShowTip(true)}
              onMouseLeave={() => setShowTip(false)}
              onClick={() => setShowTip(p => !p)}
              aria-label="Info"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        {icon ? <span className="text-lg sm:text-2xl shrink-0">{icon}</span> : null}
      </div>
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div
          className={`min-w-0 break-words text-lg sm:text-2xl font-bold tracking-tight ${
            hasPrivacyPct ? trendColor : 'text-text-primary'
          }`}
        >
          {displayValue}
        </div>
        {displayIconLabel ? (
          <div className="max-w-[55%] shrink-0 text-right text-[10px] sm:text-xs font-medium text-text-secondary leading-snug tabular-nums whitespace-pre-line">
            {displayIconLabel}
          </div>
        ) : displayHeaderRight ? (
          <span className="min-w-0 max-w-[55%] text-right text-[10px] sm:text-xs font-medium text-text-secondary leading-snug tabular-nums break-words">
            {displayHeaderRight}
          </span>
        ) : null}
      </div>
      {displaySubtitle || displayDetail ? (
        <div className="mt-0.5 sm:mt-1.5 flex flex-row flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 min-w-0">
          {displaySubtitle ? (
            <div className={`text-xs sm:text-sm ${trendColor} font-medium min-w-0 max-w-full break-words leading-snug`}>
              {arrow ? `${arrow} ` : ''}{displaySubtitle}
            </div>
          ) : null}
          {displayDetail ? (
            <div className="text-[10px] sm:text-xs text-text-secondary leading-snug tabular-nums text-right min-w-0 break-words">
              {displayDetail}
            </div>
          ) : null}
        </div>
      ) : null}
      {tooltip && showTip && (
        <div className="absolute z-20 left-3 right-3 top-full mt-1 glass-card p-3 text-xs text-text-secondary leading-relaxed shadow-xl">
          {tooltip}
        </div>
      )}
    </div>
  );
}

export default memo(KpiCard);
