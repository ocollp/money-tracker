import { useId } from 'react';

const SIZE = 88;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function LoadingProgressRing({ progress = 0, label, className = '' }) {
  const gradientId = useId();
  const clamped = Math.min(100, Math.max(0, progress));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  const complete = clamped >= 100;

  return (
    <div
      className={`flex flex-col items-center gap-3 ${className}`.trim()}
      role="status"
      aria-busy={!complete}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`relative transition-transform duration-500 ease-out ${
          complete ? 'scale-100' : 'scale-100'
        }`}
      >
        {complete ? (
          <div
            className="absolute inset-[-12px] rounded-full bg-brand/25 blur-2xl animate-pulse"
            aria-hidden
          />
        ) : null}
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="relative -rotate-90 drop-shadow-[0_0_14px_rgba(56,189,248,0.4)]"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="55%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-500 ease-out"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums tracking-tight text-text-primary">
          {clamped}%
        </span>
      </div>
      {label ? (
        <p
          className={`text-xs text-text-secondary text-center max-w-[14rem] transition-opacity duration-300 ${
            complete ? 'opacity-90' : 'opacity-60'
          }`}
        >
          {label}
        </p>
      ) : null}
    </div>
  );
}
