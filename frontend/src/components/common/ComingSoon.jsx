import { Construction } from 'lucide-react';

export default function ComingSoon({ icon: Icon = Construction, title, description }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gold-500/5 blur-2xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--app-surface)] border border-[var(--app-border)]">
          <Icon size={36} className="text-[var(--app-text-muted)]" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold-500">Coming Soon</p>
        <h2 className="mt-2 text-xl font-semibold text-[var(--app-text)]">{title}</h2>
        {description && (
          <p className="mt-1.5 max-w-sm text-sm text-[var(--app-text-muted)]">{description}</p>
        )}
      </div>
    </div>
  );
}
