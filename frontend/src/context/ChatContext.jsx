import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { chatService, INITIAL_CONVERSATIONS } from '../services/chatService';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState(INITIAL_CONVERSATIONS[0]?.id || null);
  const [inputMode, setInputMode] = useState('text');
  const [isTyping, setIsTyping] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId]
  );

  const messages = useMemo(
    () => activeConversation?.messages || [],
    [activeConversation]
  );

  const createNewChat = useCallback(() => {
    const newConv = {
      id: `conv-${Date.now()}`,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  }, []);

  const sendMessage = useCallback(
    async (content) => {
      if (!content.trim()) return;

      const userMsg = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== activeConversationId) return conv;
          const updated = { ...conv, messages: [...conv.messages, userMsg] };
          if (conv.messages.length === 0) {
            updated.title = content.trim().slice(0, 40) + (content.length > 40 ? '...' : '');
          }
          return updated;
        })
      );

      setIsTyping(true);

      try {
        const aiResponse = await chatService.sendMessage(content);
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversationId
              ? { ...conv, messages: [...conv.messages, userMsg, aiResponse].filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i) }
              : conv
          )
        );
      } finally {
        setIsTyping(false);
      }
    },
    [activeConversationId]
  );

  const value = useMemo(
    () => ({
      conversations,
      activeConversationId,
      activeConversation,
      messages,
      inputMode,
      isTyping,
      setActiveConversationId,
      setInputMode,
      sendMessage,
      createNewChat,
    }),
    [conversations, activeConversationId, activeConversation, messages, inputMode, isTyping, sendMessage, createNewChat]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
}
