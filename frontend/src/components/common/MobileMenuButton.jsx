import { useSidebar } from '../../context/SidebarContext';

export default function MobileMenuButton() {
  const { toggleMobile } = useSidebar();

  return (
    <button
      onClick={toggleMobile}
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--app-surface-hover)] text-[var(--app-text-muted)] transition-colors hover:text-[var(--app-text)] md:hidden"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="6" width="12" height="1.5" rx="0.75" fill="currentColor" />
        <rect x="3" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
      </svg>
    </button>
  );
}
