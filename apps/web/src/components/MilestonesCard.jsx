import { memo } from 'react';
import { formatMoney } from '../utils/formatters';
import { useI18n } from '../i18n/I18nContext.jsx';
import { usePrivacy } from '../context/PrivacyContext.jsx';
import { DASHBOARD_SECTION_CARD, DASHBOARD_SECTION_TITLE } from '../lib/dashboardSectionStyles.js';
import {
  buildMilestoneProgress,
  MILESTONE_LIQUID_TARGET,
  MILESTONE_PATRIMONY_TARGET,
} from '../lib/milestones.js';

const THEMES = {
  liquid: {
    icon: '💰',
    card: 'border-violet-500/15 bg-gradient-to-br from-violet-500/[0.06] via-white/[0.02] to-indigo-500/[0.03]',
    iconWrap: 'bg-violet-500/12 ring-violet-400/20',
    bar: 'from-violet-500 via-indigo-400 to-violet-300',
    barDone: 'from-emerald-600 to-emerald-400',
    pct: 'text-violet-300/90',
  },
  patrimony: {
    icon: '🏡',
    card: 'border-violet-500/15 bg-gradient-to-br from-violet-500/[0.06] via-white/[0.02] to-indigo-500/[0.03]',
    iconWrap: 'bg-violet-500/12 ring-violet-400/20',
    bar: 'from-violet-500 via-indigo-400 to-violet-300',
    barDone: 'from-emerald-600 to-emerald-400',
    pct: 'text-violet-300/90',
  },
};

function MilestoneRow({ name, target, progress, theme, t }) {
  const { hideMoney } = usePrivacy();
  const styles = THEMES[theme];
  const pctLabel = `${progress.pct.toFixed(1)}%`;
  const goalLabel = formatMoney(target);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3 ${styles.card}`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ring-1 ${styles.iconWrap}`}
          aria-hidden
        >
          {styles.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-medium text-text-secondary leading-snug truncate">{name}</p>
            <span
              className={`text-[11px] font-semibold tabular-nums shrink-0 ${
                progress.achieved ? 'text-positive' : styles.pct
              }`}
            >
              {progress.achieved ? t.milestonesAchieved : pctLabel}
            </span>
          </div>

          {!hideMoney ? (
            <p className="text-sm font-bold tracking-tight text-text-primary tabular-nums mb-2">
              {formatMoney(progress.current)}
              <span className="text-[11px] font-medium text-text-secondary/50">
                {' '}
                / {goalLabel}
              </span>
            </p>
          ) : (
            <p className={`text-sm font-bold tabular-nums mb-2 ${styles.pct}`}>{pctLabel}</p>
          )}

          <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden ring-1 ring-inset ring-white/[0.05]">
            <div
              className={`h-full rounded-full transition-all duration-700 relative ${
                progress.achieved ? styles.barDone : styles.bar
              }`}
              style={{ width: `${progress.pct}%` }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent to-white/20" />
            </div>
          </div>

          {!hideMoney && !progress.achieved ? (
            <p className="text-[10px] text-text-secondary/75 mt-1.5 tabular-nums">
              {t.milestonesRemaining(formatMoney(progress.remaining))}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MilestonesCard({ liquidCurrent, patrimonyCurrent }) {
  const { t } = useI18n();
  const liquid = buildMilestoneProgress(liquidCurrent, MILESTONE_LIQUID_TARGET);
  const patrimony = buildMilestoneProgress(patrimonyCurrent, MILESTONE_PATRIMONY_TARGET);

  return (
    <div className={`h-full ${DASHBOARD_SECTION_CARD}`}>
      <h3 className={`${DASHBOARD_SECTION_TITLE} text-base mb-2.5`}>{t.milestonesTitle}</h3>
      <div className="space-y-2">
        <MilestoneRow
          name={t.milestonesLiquidName}
          target={MILESTONE_LIQUID_TARGET}
          progress={liquid}
          theme="liquid"
          t={t}
        />
        <MilestoneRow
          name={t.milestonesPatrimonyName}
          target={MILESTONE_PATRIMONY_TARGET}
          progress={patrimony}
          theme="patrimony"
          t={t}
        />
      </div>
    </div>
  );
}

export default memo(MilestonesCard);
