import { useState } from 'react';
import { formatMoney } from '../utils/formatters';

const PRESET_GOALS = [50000, 75000, 100000, 150000, 200000, 500000];

export default function GoalTracker({ current, velocity }) {
  const [goal, setGoal] = useState(() => {
    const saved = localStorage.getItem('financialGoal');
    return saved ? Number(saved) : 50000;
  });
  const [editing, setEditing] = useState(false);
  const [customGoal, setCustomGoal] = useState('');

  const pct = Math.min((current / goal) * 100, 100);
  const remaining = goal - current;
  const monthsToGoal = velocity > 0 && remaining > 0 ? Math.ceil(remaining / velocity) : null;

  const updateGoal = (v) => {
    setGoal(v);
    localStorage.setItem('financialGoal', String(v));
    setEditing(false);
  };

  return (
    <div className="bg-surface-alt rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Objetivo financiero</h3>
        <button
          onClick={() => setEditing(!editing)}
          className="text-xs text-text-secondary hover:text-brand transition-colors"
        >
          {editing ? 'Cerrar' : 'Cambiar meta'}
        </button>
      </div>

      {editing && (
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {PRESET_GOALS.map(g => (
              <button
                key={g}
                onClick={() => updateGoal(g)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  goal === g ? 'bg-brand text-white' : 'bg-surface text-text-secondary hover:text-text-primary'
                }`}
              >
                {formatMoney(g)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Cantidad personalizada..."
              value={customGoal}
              onChange={e => setCustomGoal(e.target.value)}
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand"
            />
            <button
              onClick={() => { if (customGoal > 0) updateGoal(Number(customGoal)); }}
              className="px-3 py-1.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end justify-between mb-3">
        <div>
          <span className="text-3xl font-bold text-brand">{pct.toFixed(1)}%</span>
          <span className="text-text-secondary text-sm ml-2">completado</span>
        </div>
        <span className="text-text-secondary text-sm">Meta: {formatMoney(goal)}</span>
      </div>
      <div className="w-full bg-surface rounded-full h-4 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-dark to-brand-light transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-3 text-sm text-text-secondary">
        <span>Actual: {formatMoney(current)}</span>
        <span>Faltan: {formatMoney(Math.max(remaining, 0))}</span>
      </div>
      {monthsToGoal && (
        <p className="text-sm text-text-secondary mt-2">
          A este ritmo, llegarás en <span className="text-brand font-semibold">{monthsToGoal} meses</span> ({(monthsToGoal / 12).toFixed(1)} años)
        </p>
      )}
      {remaining <= 0 && (
        <p className="text-sm text-positive mt-2 font-semibold">Objetivo alcanzado!</p>
      )}
    </div>
  );
}
