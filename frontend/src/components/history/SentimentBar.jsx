export default function SentimentBar({ score }) {
  const getColor = (s) => {
    if (s >= 70) return 'bg-emerald-500';
    if (s >= 45) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--app-surface-hover)]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs text-[var(--app-text-muted)]">{score}%</span>
    </div>
  );
}
