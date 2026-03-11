const COLOR_MAP = {
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  orange: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  red: 'bg-red-500/15 text-red-400 border-red-500/20',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  teal: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
};

export default function CategoryBadge({ label, color }) {
  const classes = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
