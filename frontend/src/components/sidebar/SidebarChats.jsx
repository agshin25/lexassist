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

export default function SidebarChats() {
  const { conversations, activeConversationId, setActiveConversationId } = useChat();

  return (
    <div className="flex flex-1 flex-col overflow-hidden border-t border-[var(--app-border)] mt-2">
      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
        Recent
      </p>
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {conversations.map((conv) => {
          const isActive = conv.id === activeConversationId;
          return (
            <button
              key={conv.id}
              onClick={() => setActiveConversationId(conv.id)}
              className={`w-full rounded-lg px-3 py-2 text-left transition-all duration-200 mt-0.5 ${
                isActive
                  ? 'bg-gold-500/10 text-gold-400'
                  : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]'
              }`}
            >
              <p className="truncate text-sm">{conv.title}</p>
              <p className="text-[10px] opacity-60 mt-0.5">{timeAgo(conv.createdAt)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
