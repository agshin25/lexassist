import { MessageSquare, Search } from 'lucide-react';
import { useState } from 'react';
import { useChat } from '../../hooks/useChat';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function RecentChats() {
  const { conversations, activeConversationId, setActiveConversationId } = useChat();
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="hidden w-72 shrink-0 flex-col border-r border-[var(--app-border)] bg-[var(--app-surface)] lg:flex">
      <div className="border-b border-[var(--app-border)] p-4">
        <div className="flex items-center gap-2 text-[var(--app-text)]">
          <MessageSquare size={16} />
          <h2 className="text-sm font-semibold">Recent Chats</h2>
        </div>
        <div className="relative mt-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)]" />
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-hover)] py-2 pl-9 pr-3 text-xs text-[var(--app-text)] placeholder-[var(--app-text-muted)] outline-none transition-colors focus:border-gold-500/30"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {filtered.map((conv) => {
          const lastMsg = conv.messages[conv.messages.length - 1];
          const isActive = conv.id === activeConversationId;
          return (
            <button
              key={conv.id}
              onClick={() => setActiveConversationId(conv.id)}
              className={`w-full rounded-lg p-3 text-left transition-all duration-200 ${
                isActive
                  ? 'bg-gold-500/10 border border-gold-500/20'
                  : 'border border-transparent hover:bg-[var(--app-surface-hover)]'
              }`}
            >
              <p className={`truncate text-sm font-medium ${isActive ? 'text-gold-500' : 'text-[var(--app-text)]'}`}>
                {conv.title}
              </p>
              {lastMsg && (
                <p className="mt-1 truncate text-xs text-[var(--app-text-muted)]">
                  {lastMsg.content.slice(0, 60)}...
                </p>
              )}
              <p className="mt-1.5 text-[10px] text-[var(--app-text-muted)]">
                {timeAgo(conv.createdAt)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
