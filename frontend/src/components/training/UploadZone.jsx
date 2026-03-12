import { useState, useRef } from 'react';
import { Upload, FileUp, Loader2 } from 'lucide-react';

export default function UploadZone({ onUpload }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || !file.name.endsWith('.pdf')) return;
    setIsUploading(true);
    try {
      await onUpload(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !isUploading && inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all ${
        isDragging
          ? 'border-gold-500 bg-gold-500/5'
          : 'border-[var(--app-border)] hover:border-gold-500/30 hover:bg-[var(--app-surface-hover)]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      {isUploading ? (
        <>
          <Loader2 size={32} className="animate-spin text-gold-500" />
          <p className="text-sm font-medium text-[var(--app-text)]">Yüklənir...</p>
        </>
      ) : (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/10">
            {isDragging ? <FileUp size={24} className="text-gold-500" /> : <Upload size={24} className="text-gold-500" />}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--app-text)]">PDF faylını buraya sürükləyin</p>
            <p className="mt-1 text-xs text-[var(--app-text-muted)]">və ya klikləyərək seçin</p>
          </div>
        </>
      )}
    </div>
  );
}
