export const MILESTONE_LIQUID_TARGET = 100_000;
export const MILESTONE_PATRIMONY_TARGET = 150_000;

export function buildMilestoneProgress(current, target) {
  const value = Number(current) || 0;
  const goal = Number(target) || 0;
  if (goal <= 0) {
    return { current: value, target: goal, pct: 0, remaining: 0, achieved: false };
  }
  const pct = Math.min(100, Math.max(0, (value / goal) * 100));
  const remaining = Math.max(0, goal - value);
  return {
    current: value,
    target: goal,
    pct,
    remaining,
    achieved: value >= goal,
  };
}
