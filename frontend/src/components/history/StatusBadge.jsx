const STATUS_CONFIG = {
  completed: { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  answered: { label: 'Answered', bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  'in review': { label: 'In Review', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  pending: { label: 'Pending', bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
