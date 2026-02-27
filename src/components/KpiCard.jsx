import { useState } from 'react';

export default function KpiCard({ title, value, subtitle, trend, icon, tooltip, className = '', highlight = false }) {
  const [showTip, setShowTip] = useState(false);
  const trendColor = trend > 0 ? 'text-positive' : trend < 0 ? 'text-negative' : 'text-text-secondary';
  const arrow = trend > 0 ? '↑' : trend < 0 ? '↓' : '';

  return (
    <div className={`bg-surface-alt/80 rounded-2xl p-3 sm:p-5 border border-white/[0.06] shadow-lg shadow-black/10 relative ${highlight ? 'ring-1 ring-brand/30' : ''} ${className}`.trim()}>
      <div className="flex items-center justify-between mb-1.5 sm:mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-text-secondary text-xs sm:text-sm font-medium">{title}</span>
          {tooltip && (
            <button
              className="text-text-secondary/50 hover:text-brand transition-colors duration-150 active:scale-95"
              onMouseEnter={() => setShowTip(true)}
              onMouseLeave={() => setShowTip(false)}
              onClick={() => setShowTip(p => !p)}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        {icon && <span className="text-lg sm:text-2xl">{icon}</span>}
      </div>
      <div className="text-lg sm:text-2xl font-bold tracking-tight text-text-primary">{value}</div>
      {subtitle && (
        <div className={`text-xs sm:text-sm mt-0.5 sm:mt-1.5 ${trendColor} font-medium`}>
          {arrow} {subtitle}
        </div>
      )}
      {tooltip && showTip && (
        <div className="absolute z-20 left-3 right-3 top-full mt-1 bg-surface-alt border border-white/[0.08] rounded-xl p-3 text-xs text-text-secondary leading-relaxed shadow-xl backdrop-blur-sm">
          {tooltip}
        </div>
      )}
    </div>
  );
}
