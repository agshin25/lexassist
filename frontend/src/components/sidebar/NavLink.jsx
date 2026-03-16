import { NavLink as RouterNavLink } from 'react-router-dom';

export default function NavLink({ to, icon: Icon, label, disabled, collapsed, onNavigate }) {
  if (disabled) {
    return (
      <div className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[var(--app-text-muted)] opacity-40 cursor-not-allowed">
        <Icon size={20} className="shrink-0" />
        {!collapsed && <span className="text-sm font-medium">{label}</span>}
        <div className="pointer-events-none absolute left-full ml-2 hidden rounded-md bg-navy-800 px-2.5 py-1.5 text-xs text-[var(--app-text)] shadow-glass group-hover:block z-50">
          Coming Soon
        </div>
      </div>
    );
  }

  return (
    <RouterNavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-gold-500/10 text-gold-500 border-l-2 border-gold-500'
            : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]'
        }`
      }
    >
      <Icon size={20} className="shrink-0" />
      {!collapsed && <span className="animate-fade-in">{label}</span>}
      {collapsed && (
        <div className="pointer-events-none absolute left-full ml-2 hidden rounded-md bg-navy-800 px-2.5 py-1.5 text-xs text-[var(--app-text)] shadow-glass group-hover:block z-50">
          {label}
        </div>
      )}
    </RouterNavLink>
  );
}
