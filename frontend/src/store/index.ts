import { create } from 'zustand';
import { User, Conversation, Message } from '@/types';

interface AppStore {
  // Auth
  currentUser: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;

  // Conversations
  conversations: Conversation[];
  setConversations: (convs: Conversation[]) => void;
  updateConversation: (conv: Partial<Conversation> & { id: number }) => void;
  addConversation: (conv: Conversation) => void;
  activeConversationId: number | null;
  setActiveConversation: (id: number | null) => void;

  // Messages: keyed by conversation_id
  messages: Record<number, Message[]>;
  setMessages: (convId: number, msgs: Message[]) => void;
  addMessage: (convId: number, msg: Message) => void;
  updateMessage: (convId: number, msgId: number, updates: Partial<Message>) => void;
  removeMessage: (convId: number, msgId: number) => void;

  // Typing indicators: keyed by conversation_id -> list of user names typing
  typingUsers: Record<number, { userId: number; userName: string }[]>;
  setTyping: (convId: number, userId: number, userName: string, isTyping: boolean) => void;

  // Online status: keyed by user_id
  onlineUsers: Record<number, boolean>;
  setUserOnline: (userId: number, isOnline: boolean) => void;

  // UI
  sidebarTab: 'chats' | 'settings';
  setSidebarTab: (tab: 'chats' | 'settings') => void;
  isMobileShowChat: boolean;
  setMobileShowChat: (show: boolean) => void;
}

export const useStore = create<AppStore>((set, get) => ({
  // Auth
  currentUser: null,
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem('signal_token', token);
    localStorage.setItem('signal_user', JSON.stringify(user));
    set({ currentUser: user, token });
  },
  clearAuth: () => {
    localStorage.removeItem('signal_token');
    localStorage.removeItem('signal_user');
    set({ currentUser: null, token: null, conversations: [], messages: {}, activeConversationId: null });
  },

  // Conversations
  conversations: [],
  setConversations: (convs) => set({ conversations: convs }),
  updateConversation: (update) => set((state) => ({
    conversations: state.conversations.map((c) =>
      c.id === update.id ? { ...c, ...update } : c
    ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
  })),
  addConversation: (conv) => set((state) => {
    const exists = state.conversations.find((c) => c.id === conv.id);
    if (exists) return state;
    return { conversations: [conv, ...state.conversations] };
  }),
  activeConversationId: null,
  setActiveConversation: (id) => set({ activeConversationId: id }),

  // Messages
  messages: {},
  setMessages: (convId, msgs) => set((state) => ({
    messages: { ...state.messages, [convId]: msgs },
  })),
  addMessage: (convId, msg) => set((state) => {
    const existing = state.messages[convId] || [];
    // Replace optimistic message (negative id) with real one
    const filtered = existing.filter(
      (m) => !(m.id < 0 && m.sender_id === msg.sender_id && m.content === msg.content)
    );
    return {
      messages: {
        ...state.messages,
        [convId]: [...filtered, msg],
      },
    };
  }),
  updateMessage: (convId, msgId, updates) => set((state) => ({
    messages: {
      ...state.messages,
      [convId]: (state.messages[convId] || []).map((m) =>
        m.id === msgId ? { ...m, ...updates } : m
      ),
    },
  })),
  removeMessage: (convId, msgId) => set((state) => ({
    messages: {
      ...state.messages,
      [convId]: (state.messages[convId] || []).filter((m) => m.id !== msgId),
    },
  })),

  // Typing
  typingUsers: {},
  setTyping: (convId, userId, userName, isTyping) => set((state) => {
    const current = state.typingUsers[convId] || [];
    const filtered = current.filter((t) => t.userId !== userId);
    return {
      typingUsers: {
        ...state.typingUsers,
        [convId]: isTyping ? [...filtered, { userId, userName }] : filtered,
      },
    };
  }),

  // Online
  onlineUsers: {},
  setUserOnline: (userId, isOnline) => set((state) => ({
    onlineUsers: { ...state.onlineUsers, [userId]: isOnline },
  })),

  // UI
  sidebarTab: 'chats',
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  isMobileShowChat: false,
  setMobileShowChat: (show) => set({ isMobileShowChat: show }),
}));
