import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { chatService } from '../services/chatService';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [inputMode, setInputMode] = useState('text');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations from backend on first render
  useEffect(() => {
    chatService
      .getConversations()
      .then((convs) => {
        setConversations(convs);
        if (convs.length > 0) {
          setActiveConversationId(convs[0].id);
        }
      })
      .catch((err) => console.error('Failed to load conversations:', err))
      .finally(() => setIsLoading(false));
  }, []);

  // When active conversation changes, load its messages from backend
  useEffect(() => {
    if (!activeConversationId) return;

    const conv = conversations.find((c) => c.id === activeConversationId);

    // Only fetch if we don't have messages yet
    if (conv && conv.messages) return;

    chatService
      .getConversation(activeConversationId)
      .then((fullConv) => {
        setConversations((prev) =>
          prev.map((c) => (c.id === fullConv.id ? fullConv : c))
        );
      })
      .catch((err) => console.error('Failed to load conversation:', err));
  }, [activeConversationId]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId]
  );

  const messages = useMemo(
    () => activeConversation?.messages || [],
    [activeConversation]
  );

  const renameChat = useCallback(async (conversationId, newTitle) => {
    try {
      await chatService.updateConversationTitle(conversationId, newTitle);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, title: newTitle } : conv
        )
      );
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  }, []);

  const deleteChat = useCallback(async (conversationId) => {
    try {
      await chatService.deleteConversation(conversationId);
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== conversationId);
        if (conversationId === activeConversationId) {
          setActiveConversationId(remaining[0]?.id || null);
        }
        return remaining;
      });
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  }, [activeConversationId]);

  const createNewChat = useCallback(() => {
    // If current active chat is already empty (no messages), just stay on it
    const activeConv = conversations.find((c) => c.id === activeConversationId);
    if (activeConv && (!activeConv.messages || activeConv.messages.length === 0)) {
      return;
    }

    // Create local-only empty chat (not saved to DB until first message)
    const tempId = `temp-${Date.now()}`;
    const tempConv = {
      id: tempId,
      title: 'Yeni söhbət',
      messages: [],
      createdAt: new Date().toISOString(),
    };
    setConversations((prev) => [tempConv, ...prev]);
    setActiveConversationId(tempId);
  }, [conversations, activeConversationId]);

  const sendMessage = useCallback(
    async (content) => {
      if (!content.trim()) return;

      let currentConvId = activeConversationId;

      // Auto-create a temporary conversation if none is active
      if (!currentConvId) {
        const tempId = `temp-${Date.now()}`;
        const tempConv = {
          id: tempId,
          title: content.trim().slice(0, 40) + (content.length > 40 ? '...' : ''),
          messages: [],
          createdAt: new Date().toISOString(),
        };
        setConversations((prev) => [tempConv, ...prev]);
        setActiveConversationId(tempId);
        currentConvId = tempId;
      }

      const userMsg = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      // Immediately show user message in UI
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== currentConvId) return conv;
          const updated = { ...conv, messages: [...(conv.messages || []), userMsg] };
          if (!conv.messages || conv.messages.length === 0) {
            updated.title = content.trim().slice(0, 40) + (content.length > 40 ? '...' : '');
          }
          return updated;
        })
      );

      setIsTyping(true);

      try {
        // Send null for conversation_id if it's a temp ID so backend creates a new one
        const backendConvId = String(currentConvId).startsWith('temp-') ? null : currentConvId;
        const response = await chatService.sendMessage(content, backendConvId);

        const aiMsg = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: response.answer,
          sources: response.sources,
          timestamp: new Date().toISOString(),
        };

        // If backend created a new conversation, update the temp ID to real ID
        if (response.conversationId !== currentConvId) {
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === currentConvId
                ? { ...conv, id: response.conversationId, messages: [...(conv.messages || []), aiMsg] }
                : conv
            )
          );
          setActiveConversationId(response.conversationId);
        } else {
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === currentConvId
                ? { ...conv, messages: [...(conv.messages || []), aiMsg] }
                : conv
            )
          );
        }
      } catch (err) {
        console.error('Failed to send message:', err);
        const errorMsg = {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          content: 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.',
          sources: [],
          timestamp: new Date().toISOString(),
        };
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConvId
              ? { ...conv, messages: [...(conv.messages || []), errorMsg] }
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
      isLoading,
      setActiveConversationId,
      setInputMode,
      sendMessage,
      createNewChat,
      renameChat,
      deleteChat,
    }),
    [conversations, activeConversationId, activeConversation, messages, inputMode, isTyping, isLoading, sendMessage, createNewChat, renameChat, deleteChat]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
}
