import { Plus } from 'lucide-react';
import { useChat } from '../../hooks/useChat';

export default function ConversationTabs() {
  const { conversations, activeConversationId, setActiveConversationId, createNewChat } = useChat();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 sm:px-6 scrollbar-none">
      {conversations.map((conv) => {
        const isActive = conv.id === activeConversationId;
        return (
          <button
            key={conv.id}
            onClick={() => setActiveConversationId(conv.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              isActive
                ? 'bg-gold-500/15 text-gold-400 shadow-sm'
                : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]'
            }`}
          >
            {conv.title}
          </button>
        );
      })}
      <button
        onClick={createNewChat}
        className="flex shrink-0 items-center justify-center rounded-lg p-1.5 text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
