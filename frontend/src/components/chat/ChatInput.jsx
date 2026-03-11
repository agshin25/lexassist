import { useState, useRef, useEffect } from 'react';
import { Plus, Mic, AudioLines, ArrowUp } from 'lucide-react';
import { useChat } from '../../hooks/useChat';

export default function ChatInput() {
  const { sendMessage, createNewChat } = useChat();
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [text]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="px-4 pb-4 pt-2 sm:px-6">
      <div className="mx-auto flex max-w-3xl items-end gap-0 rounded-[26px] bg-[var(--app-surface-hover)] px-2 py-2">
        {/* + New chat */}
        <button
          onClick={createNewChat}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-border)] hover:text-[var(--app-text)]"
        >
          <Plus size={20} />
        </button>

        {/* Text area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-[var(--app-text)] placeholder-[var(--app-text-muted)] outline-none"
        />

        {/* Right icons */}
        {hasText ? (
          <button
            onClick={handleSend}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--app-text)] text-[var(--app-bg)] transition-transform hover:scale-105 active:scale-95"
          >
            <ArrowUp size={18} />
          </button>
        ) : (
          <>
            <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-border)] hover:text-[var(--app-text)]">
              <Mic size={20} />
            </button>
            <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--app-text)] text-[var(--app-bg)] transition-colors">
              <AudioLines size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
