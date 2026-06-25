export interface User {
  id: number;
  phone: string;
  username?: string;
  display_name: string;
  avatar_url?: string;
  about?: string;
  is_online: boolean;
  last_seen?: string;
  created_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender?: Pick<User, 'id' | 'display_name' | 'avatar_url'>;
  content: string | null;
  message_type: 'text' | 'image' | 'file' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  reply_to?: {
    id: number;
    content: string | null;
    sender_id: number;
    is_deleted: boolean;
  };
  reactions?: Reaction[];
  is_deleted: boolean;
  disappears_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Conversation {
  id: number;
  type: 'direct' | 'group';
  other_user?: User;
  group?: Group;
  last_message?: {
    content: string | null;
    sender_name: string;
    created_at: string;
    message_type: string;
  };
  unread_count: number;
  updated_at: string;
  participants?: ConversationParticipant[];
}

export interface Group {
  id: number;
  conversation_id: number;
  name: string;
  description?: string;
  avatar_url?: string;
  created_by: number;
  member_count: number;
  created_at: string;
}

export interface ConversationParticipant {
  user_id: number;
  user: User;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface Reaction {
  emoji: string;
  user_id: number;
  user_name: string;
}

export type WSEvent =
  | { type: 'new_message'; conversation_id: number; message: Message }
  | { type: 'message_status'; message_id: number; status: Message['status']; conversation_id: number }
  | { type: 'message_deleted'; message_id: number; conversation_id: number }
  | { type: 'typing'; conversation_id: number; user_id: number; user_name: string }
  | { type: 'stop_typing'; conversation_id: number; user_id: number }
  | { type: 'user_status'; user_id: number; is_online: boolean; last_seen?: string }
  | { type: 'reaction'; message_id: number; user_id: number; emoji: string; action: string; conversation_id: number }
  | { type: 'group_member_added'; conversation_id: number; user_id: number }
  | { type: 'group_member_removed'; conversation_id: number; user_id: number }
  | { type: 'group_updated'; conversation_id: number };
