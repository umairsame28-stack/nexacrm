import { create } from 'zustand';

interface TypingUser {
  userId: string;
  conversationId: string;
}

interface InboxState {
  activeConversationId: string | null;
  typingUsers: TypingUser[];
  unreadByConversation: Record<string, number>;

  setActiveConversation: (id: string | null) => void;
  setTyping: (userId: string, conversationId: string, isTyping: boolean) => void;
  setUnread: (conversationId: string, count: number) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
}

export const useInboxStore = create<InboxState>((set) => ({
  activeConversationId: null,
  typingUsers: [],
  unreadByConversation: {},

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setTyping: (userId, conversationId, isTyping) => {
    set((state) => ({
      typingUsers: isTyping
        ? [
            ...state.typingUsers.filter((t) => t.userId !== userId || t.conversationId !== conversationId),
            { userId, conversationId },
          ]
        : state.typingUsers.filter(
            (t) => !(t.userId === userId && t.conversationId === conversationId),
          ),
    }));
  },

  setUnread: (conversationId, count) => {
    set((state) => ({
      unreadByConversation: { ...state.unreadByConversation, [conversationId]: count },
    }));
  },

  incrementUnread: (conversationId) => {
    set((state) => ({
      unreadByConversation: {
        ...state.unreadByConversation,
        [conversationId]: (state.unreadByConversation[conversationId] ?? 0) + 1,
      },
    }));
  },

  clearUnread: (conversationId) => {
    set((state) => ({
      unreadByConversation: { ...state.unreadByConversation, [conversationId]: 0 },
    }));
  },
}));
