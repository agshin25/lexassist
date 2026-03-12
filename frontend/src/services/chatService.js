import { apiRequest } from "./api";

// Transform backend conversation to frontend format
function formatConversation(conv) {
  return {
    id: conv.id,
    title: conv.title,
    createdAt: conv.created_at,
    messages: conv.messages
      ? conv.messages.map(formatMessage)
      : [],
  };
}

// Transform backend message to frontend format
function formatMessage(msg) {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.created_at,
    sources: (msg.sources || []).map((s) =>
      typeof s === "string" ? { label: s } : s
    ),
  };
}

export const chatService = {
  // Send a message and get AI response
  async sendMessage(message, conversationId = null) {
    const data = await apiRequest("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
      }),
    });

    return {
      answer: data.answer,
      sources: (data.sources || []).map((s) =>
        typeof s === "string" ? { label: s } : s
      ),
      conversationId: data.conversation_id,
    };
  },

  // Get all conversations (list, no messages)
  async getConversations() {
    const data = await apiRequest("/api/conversations");
    return data.map((conv) => ({
      id: conv.id,
      title: conv.title,
      createdAt: conv.created_at,
      messageCount: conv.message_count,
    }));
  },

  // Get single conversation with all messages
  async getConversation(conversationId) {
    const data = await apiRequest(`/api/conversations/${conversationId}`);
    return formatConversation(data);
  },

  // Create a new empty conversation
  async createConversation(title = "Yeni söhbət") {
    const data = await apiRequest("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    return {
      id: data.id,
      title: data.title,
      createdAt: data.created_at,
      messages: [],
    };
  },

  // Update conversation title
  async updateConversationTitle(conversationId, title) {
    const data = await apiRequest(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    });
    return data;
  },

  // Delete a conversation
  async deleteConversation(conversationId) {
    return apiRequest(`/api/conversations/${conversationId}`, {
      method: "DELETE",
    });
  },
};
