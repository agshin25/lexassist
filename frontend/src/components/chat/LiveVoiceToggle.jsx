import { useState } from 'react';
import { Radio, PhoneOff } from 'lucide-react';

function EqualizerBars() {
  return (
    <div className="flex items-end gap-0.5 h-5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-teal-400"
          style={{
            animation: `equalizer 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
            height: '40%',
          }}
        />
      ))}
      <style>{`
        @keyframes equalizer {
          0% { height: 20%; }
          100% { height: 100%; }
        }
      `}</style>
    </div>
  );
}

export default function LiveVoiceToggle() {
  const [isActive, setIsActive] = useState(false);

  if (!isActive) {
    return (
      <button
        onClick={() => setIsActive(true)}
        className="flex flex-1 items-center justify-center gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-hover)] py-3 text-sm text-[var(--app-text-muted)] transition-all duration-200 hover:border-teal-500/30 hover:text-[var(--app-text)]"
      >
        <Radio size={18} />
        Start Live Voice
      </button>
    );
  }

  return (
    <div className="flex flex-1 items-center gap-4 rounded-xl border border-teal-500/30 bg-teal-500/5 px-4 py-3">
      <EqualizerBars />
      <div className="flex-1">
        <p className="text-sm font-medium text-teal-400">Listening...</p>
        <p className="text-xs text-[var(--app-text-muted)]">Speak naturally, AI will respond with voice</p>
      </div>
      <button
        onClick={() => setIsActive(false)}
        className="flex h-9 items-center gap-2 rounded-lg bg-red-500/10 px-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
      >
        <PhoneOff size={14} />
        End
      </button>
    </div>
  );
}
