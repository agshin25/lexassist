import { apiRequest, API_BASE_URL } from "./api";

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

  // Send a message with SSE streaming
  async sendMessageStream(message, conversationId = null, { onToken, onSources, onMeta, onDone, onError }) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete line in buffer

        let eventType = null;
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ") && eventType) {
            const data = line.slice(6);
            try {
              if (eventType === "token") {
                const parsed = JSON.parse(data);
                onToken?.(parsed.token);
              } else if (eventType === "sources") {
                const parsed = JSON.parse(data);
                onSources?.(parsed.sources || []);
              } else if (eventType === "meta") {
                const parsed = JSON.parse(data);
                onMeta?.(parsed);
              } else if (eventType === "done") {
                const parsed = JSON.parse(data);
                onDone?.(parsed);
              }
            } catch (e) {
              // ignore parse errors for partial data
            }
            eventType = null;
          }
        }
      }
    } catch (err) {
      onError?.(err);
    }
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
