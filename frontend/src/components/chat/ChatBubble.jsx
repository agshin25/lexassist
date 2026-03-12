import { Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import SourceTag from './SourceTag';

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatBubble({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-gradient-to-br from-gold-500/20 to-teal-500/10 border border-gold-500/20 px-4 py-3">
          <p className="text-sm leading-relaxed text-[var(--app-text)]">{message.content}</p>
          <p className="mt-1.5 text-right text-[10px] text-[var(--app-text-muted)]">
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-500">
        <Bot size={16} />
      </div>
      <div className="max-w-[80%]">
        <div className="rounded-2xl rounded-bl-sm bg-[var(--app-surface)] border border-[var(--glass-border)] px-4 py-3">
          <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed text-[var(--app-text)]">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          <p className="mt-1.5 text-[10px] text-[var(--app-text-muted)]">
            {formatTime(message.timestamp)}
          </p>
        </div>
        {message.sources?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.sources.map((source, i) => (
              <SourceTag key={i} source={source} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
