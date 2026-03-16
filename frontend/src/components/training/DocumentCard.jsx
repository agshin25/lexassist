import { FileText, Trash2, Database, Loader2, CheckCircle } from 'lucide-react';

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString('az-AZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DocumentCard({ doc, onDelete }) {
  const isProcessing = doc.status === 'processing';

  return (
    <div className="group flex items-center justify-between rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 transition-all hover:border-gold-500/20 hover:bg-[var(--app-surface-hover)]">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
          <FileText size={20} className="text-red-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--app-text)]">{doc.filename}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-[var(--app-text-muted)]">
            <span>{doc.size_mb} MB</span>
            <span className="h-1 w-1 rounded-full bg-[var(--app-text-muted)]" />
            {isProcessing ? (
              <span className="flex items-center gap-1 text-gold-400">
                <Loader2 size={10} className="animate-spin" />
                Emal olunur...
              </span>
            ) : (
              <>
                <span className="flex items-center gap-1">
                  <Database size={10} />
                  {doc.chunks} chunk
                </span>
                <span className="h-1 w-1 rounded-full bg-[var(--app-text-muted)]" />
                <span className="flex items-center gap-1 text-teal-400">
                  <CheckCircle size={10} />
                  Hazır
                </span>
              </>
            )}
            {doc.uploaded_at && (
              <>
                <span className="h-1 w-1 rounded-full bg-[var(--app-text-muted)]" />
                <span>{formatDate(doc.uploaded_at)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => onDelete(doc.filename)}
        disabled={isProcessing}
        className={`rounded-lg p-2 text-[var(--app-text-muted)] transition-all ${
          isProcessing
            ? 'opacity-30 cursor-not-allowed'
            : 'opacity-0 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100'
        }`}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
