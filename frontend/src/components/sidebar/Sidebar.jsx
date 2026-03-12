import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Database, Settings, Plus, PanelLeftClose } from 'lucide-react';
import Logo from './Logo';
import NavLink from './NavLink';
import ChatItem from './ChatItem';
import AdminProfile from './AdminProfile';
import { useChat } from '../../hooks/useChat';

const NAV_ITEMS = [
  { to: '/history', icon: History, label: 'Conversation History', disabled: false },
  { to: '/training', icon: Database, label: 'Training Data', disabled: false },
  { to: '/settings', icon: Settings, label: 'Settings', disabled: true },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { conversations, activeConversationId, setActiveConversationId, createNewChat, renameChat, deleteChat } = useChat();

  const handleChatClick = (convId) => {
    setActiveConversationId(convId);
    navigate('/chat');
  };

  const handleNewChat = async () => {
    await createNewChat();
    navigate('/chat');
  };

  return (
    <aside
      className={`flex h-screen flex-col border-r border-[var(--app-border)] bg-[var(--app-surface)] transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between">
        <Logo collapsed={collapsed} onOpen={() => setCollapsed(false)} />
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      <div className="space-y-0.5 px-3 py-2">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
        >
          <Plus size={20} className="shrink-0" />
          {!collapsed && <span className="animate-fade-in">New chat</span>}
        </button>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} {...item} collapsed={collapsed} />
        ))}
      </div>

      {!collapsed && (
        <div className="flex flex-1 flex-col overflow-hidden mt-1">
          <p className="px-5 py-2 text-[11px] font-medium text-[var(--app-text-muted)]">
            Your chats
          </p>
          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            {conversations.map((conv) => (
              <ChatItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConversationId}
                onClick={() => handleChatClick(conv.id)}
                onRename={renameChat}
                onDelete={deleteChat}
              />
            ))}
          </div>
        </div>
      )}

      {collapsed && <div className="flex-1" />}

      <AdminProfile collapsed={collapsed} />
    </aside>
  );
}
