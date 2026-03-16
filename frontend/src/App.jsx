import { Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import Sidebar from './components/sidebar/Sidebar';
import ChatPage from './pages/ChatPage';
import HistoryPage from './pages/HistoryPage';
import TrainingDataPage from './pages/TrainingDataPage';
import SettingsPage from './pages/SettingsPage';

function AppLayout() {
  const { mobileOpen, closeMobile } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--app-bg)]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobile}
        />
      )}
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/training" element={<TrainingDataPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SidebarProvider>
      <AppLayout />
    </SidebarProvider>
  );
}
