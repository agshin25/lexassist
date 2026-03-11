import { History, Search, Bell } from 'lucide-react';
import ConversationTable from '../components/history/ConversationTable';
import { CONVERSATIONS_DATA } from '../services/historyService';

export default function HistoryPage() {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  return (
    <div className="flex h-full flex-col">
      {/* Page Header */}
      <header className="flex items-center justify-between border-b border-[var(--app-border)] bg-[var(--glass-bg)] px-6 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <History size={20} className="text-gold-400" />
          <h1 className="text-lg font-semibold text-[var(--app-text)]">Conversation History</h1>
          <span className="text-sm text-[var(--app-text-muted)]">{now}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)]" />
            <input
              type="text"
              placeholder="Quick search..."
              className="w-44 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-hover)] py-1.5 pl-9 pr-3 text-xs text-[var(--app-text)] placeholder-[var(--app-text-muted)] outline-none transition-colors focus:border-gold-500/30"
            />
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-400">Online</span>
          </div>
          <div className="relative">
            <Bell size={18} className="text-[var(--app-text-muted)]" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              2
            </span>
          </div>
        </div>
      </header>

      {/* Table Content */}
      <div className="flex-1 overflow-hidden p-5">
        <ConversationTable conversations={CONVERSATIONS_DATA} />
      </div>
    </div>
  );
}
