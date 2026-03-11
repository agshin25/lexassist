export default function AdminProfile({ collapsed }) {
  return (
    <div className="border-t border-[var(--app-border)] px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-teal-500 text-sm font-semibold text-navy-950">
          AD
        </div>
        {!collapsed && (
          <div className="animate-fade-in min-w-0">
            <p className="truncate text-sm font-medium text-[var(--app-text)]">Admin User</p>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-[var(--app-text-muted)]">System Admin</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
