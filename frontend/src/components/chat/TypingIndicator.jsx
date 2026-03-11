import { Bot } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-500">
        <Bot size={16} />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-[var(--app-surface)] border border-[var(--glass-border)] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse-dot" />
          <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse-dot [animation-delay:0.2s]" />
          <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse-dot [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  );
}
