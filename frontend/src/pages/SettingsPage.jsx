import { Settings } from 'lucide-react';
import ComingSoon from '../components/common/ComingSoon';
import MobileMenuButton from '../components/common/MobileMenuButton';

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col">
      {/* Mobile header */}
      <header className="flex items-center border-b border-[var(--app-border)] bg-[var(--glass-bg)] px-4 py-3 backdrop-blur-md md:hidden">
        <div className="mr-3">
          <MobileMenuButton />
        </div>
        <div className="flex items-center gap-2.5">
          <Settings size={20} className="text-gold-400" />
          <h1 className="text-lg font-semibold text-[var(--app-text)]">Settings</h1>
        </div>
      </header>
      <div className="flex-1">
        <ComingSoon icon={Settings} title="Settings" description="Configure your LexAssist instance" />
      </div>
    </div>
  );
}
