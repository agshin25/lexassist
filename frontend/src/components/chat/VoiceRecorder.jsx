import { Mic, Square, Send, X } from 'lucide-react';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function VoiceRecorder({ onSend }) {
  const { isRecording, recordingDuration, startRecording, stopRecording, cancelRecording } = useVoiceRecorder();

  const handleStop = async () => {
    await stopRecording();
    onSend(`🎤 Voice message (${formatDuration(recordingDuration)})`);
  };

  if (!isRecording) {
    return (
      <button
        onClick={startRecording}
        className="flex flex-1 items-center justify-center gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-hover)] py-3 text-sm text-[var(--app-text-muted)] transition-all duration-200 hover:border-gold-500/30 hover:text-[var(--app-text)]"
      >
        <Mic size={18} />
        Tap to record
      </button>
    );
  }

  return (
    <div className="flex flex-1 items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3">
      <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
      <span className="text-sm font-medium text-red-400">{formatDuration(recordingDuration)}</span>
      <span className="text-xs text-[var(--app-text-muted)]">Recording...</span>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={cancelRecording}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
        >
          <X size={16} />
        </button>
        <button
          onClick={handleStop}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-navy-950 transition-transform hover:scale-105"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
