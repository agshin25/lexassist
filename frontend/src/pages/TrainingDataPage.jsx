import { useState, useEffect, useRef } from 'react';
import { Database, FileText, Layers } from 'lucide-react';
import UploadZone from '../components/training/UploadZone';
import DocumentCard from '../components/training/DocumentCard';
import { trainingService } from '../services/trainingService';
import MobileMenuButton from '../components/common/MobileMenuButton';

export default function TrainingDataPage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const pollRef = useRef(null);

  const loadData = async () => {
    try {
      const docs = await trainingService.getDocuments();
      setDocuments(docs);
      return docs;
    } catch (err) {
      console.error('Failed to load training data:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Start/stop polling based on whether any doc is processing
  const updatePolling = (docs) => {
    const hasProcessing = docs.some((d) => d.status === 'processing');
    if (hasProcessing && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        const updated = await loadData();
        if (!updated.some((d) => d.status === 'processing')) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, 5000);
    }
  };

  useEffect(() => {
    loadData().then(updatePolling);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleUpload = async (file) => {
    try {
      await trainingService.uploadDocument(file);
      const docs = await loadData();
      updatePolling(docs);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleDelete = async (filename) => {
    try {
      await trainingService.deleteDocument(filename);
      await loadData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const totalChunks = documents.reduce((sum, doc) => sum + (doc.chunks || 0), 0);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--app-border)] bg-[var(--glass-bg)] px-4 py-3.5 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <MobileMenuButton />
          </div>
          <Database size={20} className="text-gold-400" />
          <h1 className="text-lg font-semibold text-[var(--app-text)]">Training Data</h1>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--app-text-muted)]">
          <div className="flex items-center gap-1.5">
            <FileText size={14} />
            <span>{documents.length} <span className="hidden sm:inline">sənəd</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers size={14} />
            <span>{totalChunks} <span className="hidden sm:inline">chunk</span></span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-6">

          {/* Upload */}
          <UploadZone onUpload={handleUpload} />

          {/* Documents */}
          {isLoading ? (
            <p className="text-center text-sm text-[var(--app-text-muted)]">Yüklənir...</p>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--app-surface)] border border-[var(--app-border)]">
                <FileText size={28} className="text-[var(--app-text-muted)]" />
              </div>
              <p className="text-sm text-[var(--app-text-muted)]">Hələ heç bir sənəd yüklənməyib</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-widest text-[var(--app-text-muted)]">
                Yüklənmiş sənədlər
              </p>
              {documents.map((doc) => (
                <DocumentCard key={doc.filename} doc={doc} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
