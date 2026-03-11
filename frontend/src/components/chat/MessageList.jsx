import { useEffect, useRef } from 'react';
import { Scale } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';

const SUGGESTIONS = [
  'What are the remedies for breach of contract?',
  'Explain the doctrine of res judicata',
  'What does Article 21 guarantee?',
  'How is electronic evidence admitted in court?',
];

export default function MessageList() {
  const { messages, isTyping, sendMessage } = useChat();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-500">
          <Scale size={32} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--app-text)]">How can I assist you?</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">Ask any legal question to get started</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 w-full max-w-lg">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-left text-sm text-[var(--app-text-muted)] transition-all duration-200 hover:border-gold-500/30 hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
