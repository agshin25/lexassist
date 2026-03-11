import { MessageSquare, FileText, ClipboardList, Headphones, AlertTriangle, Download, PhoneForwarded } from 'lucide-react';

function TranscriptBubble({ message, index }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-[var(--app-surface-hover)] text-[var(--app-text)] rounded-br-sm'
            : 'bg-navy-800 text-[var(--app-text)] rounded-bl-sm'
        }`}
      >
        {!isUser && (
          <span className="mb-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 text-[10px] float-left mr-2 mt-0.5">
            AI
          </span>
        )}
        {message.content}
      </div>
      {isUser && (
        <span className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-white self-end">
          CM
        </span>
      )}
    </div>
  );
}

export default function ConversationDetail({ conversation }) {
  const { transcript, aiSummary, keywords, emotionScore, operatorNotes, id, handler, priority } = conversation;

  const getEmotionLabel = (score) => {
    if (score >= 70) return 'Positive tone';
    if (score >= 45) return 'Neutral tone';
    return 'Negative tone';
  };

  const getPriorityColor = (p) => {
    if (p === 'critical') return 'text-red-400';
    if (p === 'high') return 'text-orange-400';
    if (p === 'medium') return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3 animate-fade-in">
      {/* Transcript Panel */}
      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] p-4">
        <div className="mb-4 flex items-center gap-2 text-[var(--app-text)]">
          <MessageSquare size={16} className="text-teal-400" />
          <h3 className="text-sm font-semibold">Conversation Transcript</h3>
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {transcript.map((msg, i) => (
            <TranscriptBubble key={i} message={msg} index={i} />
          ))}
        </div>
      </div>

      {/* AI Summary Panel */}
      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] p-4">
        <div className="mb-4 flex items-center gap-2 text-[var(--app-text)]">
          <FileText size={16} className="text-gold-400" />
          <h3 className="text-sm font-semibold">AI Summary</h3>
        </div>
        <p className="text-sm leading-relaxed text-[var(--app-text-muted)]">{aiSummary}</p>

        {keywords?.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-[var(--app-text)]">Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((kw) => (
                <span key={kw} className="rounded-md bg-gold-500/10 px-2 py-0.5 text-xs text-gold-400">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-[var(--app-text)]">Emotion Analysis</p>
          <div className="flex items-center gap-3">
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500">
              <div
                className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--app-bg)] shadow-md transition-all duration-500"
                style={{ left: `${emotionScore}%`, transform: `translate(-50%, -50%)` }}
              />
            </div>
            <span className="text-xs font-medium text-[var(--app-text-muted)] whitespace-nowrap">{emotionScore}%</span>
          </div>
          <p className="mt-1 text-[10px] text-[var(--app-text-muted)]">{getEmotionLabel(emotionScore)}</p>
        </div>
      </div>

      {/* Operator Notes Panel */}
      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] p-4">
        <div className="mb-4 flex items-center gap-2 text-[var(--app-text)]">
          <ClipboardList size={16} className="text-amber-400" />
          <h3 className="text-sm font-semibold">Operator Notes</h3>
        </div>

        {operatorNotes ? (
          <p className="text-sm leading-relaxed text-[var(--app-text-muted)]">{operatorNotes}</p>
        ) : (
          <p className="text-sm italic text-[var(--app-text-muted)] opacity-50">No operator notes</p>
        )}

        <div className="mt-4 space-y-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-xs">
          <div className="flex justify-between">
            <span className="text-[var(--app-text-muted)]">Call ID:</span>
            <span className="font-mono text-[var(--app-text)]">#{id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--app-text-muted)]">Handler:</span>
            <span className="text-[var(--app-text)]">{handler}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--app-text-muted)]">Priority:</span>
            <span className={`font-semibold ${getPriorityColor(priority)}`}>{priority}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-1.5 rounded-lg border border-teal-500/20 bg-teal-500/5 px-3 py-2 text-xs font-medium text-teal-400 transition-colors hover:bg-teal-500/10">
            <Headphones size={13} />
            Audio
          </button>
          <button className="flex items-center justify-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-xs font-medium text-orange-400 transition-colors hover:bg-orange-500/10">
            <AlertTriangle size={13} />
            Escalate
          </button>
          <button className="flex items-center justify-center gap-1.5 rounded-lg border border-gold-500/20 bg-gold-500/5 px-3 py-2 text-xs font-medium text-gold-400 transition-colors hover:bg-gold-500/10">
            <Download size={13} />
            PDF Export
          </button>
          <button className="flex items-center justify-center gap-1.5 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/10">
            <PhoneForwarded size={13} />
            Callback
          </button>
        </div>
      </div>
    </div>
  );
}
