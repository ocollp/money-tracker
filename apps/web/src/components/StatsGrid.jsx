import { formatMoney, formatChange, formatPct } from '../utils/formatters';

export default function StatsGrid({ stats }) {
  const sections = [
    {
      title: 'El meu mes a mes',
      tooltip: 'Sense comptar mesos atípics',
      items: [
        { label: 'Mitjana mensual', value: formatChange(stats.avgChange) },
        { label: 'Millor mes', value: stats.bestMonth ? `${stats.bestMonth.month.label}: ${formatChange(stats.bestMonth.value)}` : '—' },
        { label: 'Pitjor mes', value: stats.worstMonth ? `${stats.worstMonth.month.label}: ${formatChange(stats.worstMonth.value)}` : '—' },
        { label: 'Volatilitat', value: formatMoney(stats.volatility), hint: 'Quant varien els meus diners d\'un mes a l\'altre. Més baix = més estable.' },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map(section => (
        <div key={section.title} className="bg-surface-alt/80 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/10">
          <div className="mb-4">
            <h4 className="text-lg font-semibold">{section.title}</h4>
            {section.tooltip && (
              <p className="text-xs text-text-secondary mt-0.5">{section.tooltip}</p>
            )}
          </div>
          <div className="space-y-2.5">
            {section.items.map(item => (
              <div key={item.label}>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">{item.label}</span>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
                {item.hint && (
                  <p className="text-[10px] text-text-secondary/50 mt-0.5">{item.hint}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
