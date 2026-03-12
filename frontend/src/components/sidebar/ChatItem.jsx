import { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, Check, X, Ellipsis } from 'lucide-react';

export default function ChatItem({ conv, isActive, onClick, onRename, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(conv.title);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleSave = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== conv.title) {
      onRename(conv.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(conv.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 rounded-lg bg-[var(--app-surface-hover)] px-2 py-1.5">
        <input
          ref={inputRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 bg-transparent text-sm text-[var(--app-text)] outline-none"
        />
        <button onClick={handleSave} className="shrink-0 p-0.5 text-emerald-400 hover:text-emerald-300">
          <Check size={14} />
        </button>
        <button onClick={handleCancel} className="shrink-0 p-0.5 text-red-400 hover:text-red-300">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="group relative" ref={menuRef}>
      <button
        onClick={onClick}
        className={`w-full cursor-pointer truncate rounded-lg px-3 py-2 pr-9 text-left text-sm transition-colors ${
          isActive
            ? 'bg-[var(--app-surface-hover)] text-[var(--app-text)]'
            : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]'
        }`}
      >
        {conv.title}
      </button>

      {/* Three dot button — visible on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((prev) => !prev);
        }}
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 cursor-pointer text-[var(--app-text-muted)] transition-opacity hover:text-[var(--app-text)] ${
          menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <Ellipsis size={16} />
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] shadow-lg">
          <button
            onClick={() => {
              setMenuOpen(false);
              setIsEditing(true);
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
          >
            <Pencil size={14} />
            Rename
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              onDelete(conv.id);
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
