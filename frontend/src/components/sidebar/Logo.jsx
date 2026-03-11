import { useState } from 'react';
import { Scale, PanelLeft } from 'lucide-react';

export default function Logo({ collapsed, onOpen }) {
  const [hovered, setHovered] = useState(false);

  if (collapsed) {
    return (
      <div className="px-3 py-4">
        <button
          onClick={onOpen}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-gold-500 transition-colors hover:bg-[var(--app-surface-hover)]"
        >
          {hovered ? <PanelLeft size={20} /> : <Scale size={20} />}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-500">
        <Scale size={20} />
      </div>
      <span className="animate-fade-in text-lg font-semibold tracking-tight">
        <span className="text-gold-500">Lex</span>
        <span className="text-[var(--app-text)]">Assist</span>
      </span>
    </div>
  );
}
