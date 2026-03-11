import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ collapsed }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--app-text-muted)] transition-all duration-200 hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
    >
      <div className="flex h-5 w-5 shrink-0 items-center justify-center transition-transform duration-300">
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </div>
      {!collapsed && (
        <span className="animate-fade-in">
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
}
