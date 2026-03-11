import { FileText } from 'lucide-react';

export default function SourceTag({ source }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-medium text-teal-400 transition-colors hover:bg-teal-500/20">
      <FileText size={12} />
      {source.label}
    </span>
  );
}
