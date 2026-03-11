import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import CategoryBadge from './CategoryBadge';
import SentimentBar from './SentimentBar';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import ConversationDetail from './ConversationDetail';

export default function ConversationRow({ conversation }) {
  const [expanded, setExpanded] = useState(false);
  const { citizen, date, duration, category, categoryColor, sentiment, handler, priority, status } = conversation;

  return (
    <div className={`border-b border-[var(--app-border)] transition-colors ${expanded ? 'bg-[var(--app-surface)]' : 'hover:bg-[var(--app-surface-hover)]'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="grid w-full grid-cols-[auto_1fr_1fr_0.7fr_1fr_0.8fr_1fr_0.7fr_0.8fr] items-center gap-4 px-5 py-3.5 text-left"
      >
        <ChevronDown
          size={16}
          className={`text-[var(--app-text-muted)] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-xs font-semibold text-gold-400">
            {citizen.initials}
          </span>
          <span className="truncate text-sm font-medium text-[var(--app-text)]">{citizen.name}</span>
        </div>
        <span className="text-sm text-[var(--app-text-muted)]">{date}</span>
        <span className="text-sm text-[var(--app-text-muted)]">{duration}</span>
        <CategoryBadge label={category} color={categoryColor} />
        <SentimentBar score={sentiment} />
        <span className="text-sm text-[var(--app-text-muted)]">{handler}</span>
        <PriorityBadge priority={priority} />
        <StatusBadge status={status} />
      </button>
      {expanded && <ConversationDetail conversation={conversation} />}
    </div>
  );
}
