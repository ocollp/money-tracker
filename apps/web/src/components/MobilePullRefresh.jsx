import { memo } from 'react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useI18n } from '../i18n/I18nContext.jsx';

function MobilePullRefresh({ onRefresh, disabled, loading }) {
  const { t } = useI18n();
  const { pullPx, progress, isPulling } = usePullToRefresh({ onRefresh, disabled, loading });

  return (
    <div
      className="fixed left-0 right-0 z-[25] flex justify-center pointer-events-none transition-opacity duration-150 sm:hidden"
      style={{
        top: 'max(4.5rem, calc(env(safe-area-inset-top, 0px) + 3.5rem))',
        opacity: isPulling ? 1 : 0,
        transform: `translateY(${Math.min(pullPx * 0.3, 24)}px)`,
      }}
      aria-hidden
    >
      <div
        className="glass-fab rounded-full px-3 py-1.5 text-xs text-text-secondary flex items-center gap-2"
        style={{ opacity: 0.5 + progress * 0.5 }}
      >
        <span
          className="inline-block w-4 h-4 border-2 border-brand border-t-transparent rounded-full"
          style={{ transform: `rotate(${progress * 250}deg)` }}
        />
        {t.pullToRefresh}
      </div>
    </div>
  );
}

export default memo(MobilePullRefresh);
