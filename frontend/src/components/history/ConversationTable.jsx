import { useState } from 'react';
import { Search } from 'lucide-react';
import ConversationRow from './ConversationRow';

const COLUMNS = ['', 'Citizen', 'Date', 'Duration', 'Category', 'Sentiment', 'Handler', 'Priority', 'Status'];

export default function ConversationTable({ conversations }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = [...new Set(conversations.map((c) => c.category))];

  const filtered = conversations.filter((c) => {
    const matchesSearch =
      c.citizen.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.keywords?.some((k) => k.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-5 py-4 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[var(--app-text)]">All Conversations</h2>
          <span className="text-sm text-[var(--app-text-muted)]">({filtered.length})</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)]" />
            <input
              type="text"
              placeholder="Name, case number, keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-hover)] py-2 pl-9 pr-3 text-sm text-[var(--app-text)] placeholder-[var(--app-text-muted)] outline-none transition-colors focus:border-gold-500/30"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-hover)] px-3 py-2 text-sm text-[var(--app-text)] outline-none transition-colors focus:border-gold-500/30 appearance-none cursor-pointer"
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]">
        {/* Table Header */}
        <div className="grid grid-cols-[auto_1fr_1fr_0.7fr_1fr_0.8fr_1fr_0.7fr_0.8fr] items-center gap-4 border-b border-[var(--app-border)] px-5 py-3">
          {COLUMNS.map((col) => (
            <span key={col} className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
              {col}
            </span>
          ))}
        </div>

        {/* Table Body */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-[var(--app-text-muted)]">
              No conversations found
            </div>
          ) : (
            filtered.map((conv) => (
              <ConversationRow key={conv.id} conversation={conv} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
