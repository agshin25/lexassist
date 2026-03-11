const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-emerald-400' },
  medium: { label: 'Medium', color: 'text-amber-400' },
  high: { label: 'High', color: 'text-orange-400' },
  critical: { label: 'Critical', color: 'text-red-400' },
};

export default function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;

  return (
    <span className={`text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
}
