import { ArrowUp } from 'lucide-react';

export default function SendButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
        disabled
          ? 'bg-navy-700 text-[var(--app-text-muted)] cursor-not-allowed'
          : 'bg-gold-500 text-navy-950 hover:scale-105 hover:shadow-glow-gold active:scale-95'
      }`}
    >
      <ArrowUp size={18} />
    </button>
  );
}
