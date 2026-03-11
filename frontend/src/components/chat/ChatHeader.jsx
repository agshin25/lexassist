import { Bot } from 'lucide-react';

export default function ChatHeader() {
  return (
    <header className="flex items-center border-b border-[var(--app-border)] bg-[var(--glass-bg)] px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
          <Bot size={18} />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-[var(--app-text)]">LexAssist AI</h1>
          <p className="text-xs text-[var(--app-text-muted)]">Legal Research Assistant</p>
        </div>
      </div>
    </header>
  );
}
