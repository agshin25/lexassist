import { useRef, useEffect } from 'react';

export default function TextInput({ value, onChange, onSubmit }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Ask LexAssist a legal question..."
      rows={1}
      className="flex-1 resize-none rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-hover)] px-4 py-3 text-sm text-[var(--app-text)] placeholder-[var(--app-text-muted)] outline-none transition-colors focus:border-gold-500/30 focus:ring-1 focus:ring-gold-500/20"
    />
  );
}
