'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store';
import { WSEvent, Message } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
const MAX_RETRIES = 5;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);

  const {
    token, currentUser,
    addMessage, updateMessage, setTyping,
    setUserOnline, conversations, updateConversation,
  } = useStore();

  const handleEvent = useCallback((event: WSEvent) => {
    const store = useStore.getState();

    switch (event.type) {
      case 'new_message': {
        const msg = event.message as Message;
        store.addMessage(event.conversation_id, msg);
        // Update conversation's last message preview & unread count
        const conv = store.conversations.find((c) => c.id === event.conversation_id);
        if (conv) {
          const isActive = store.activeConversationId === event.conversation_id;
          store.updateConversation({
            id: event.conversation_id,
            updated_at: msg.created_at,
            last_message: {
              content: msg.content,
              sender_name: msg.sender?.display_name || 'Unknown',
              created_at: msg.created_at,
              message_type: msg.message_type,
            },
            unread_count: isActive ? 0 : (conv.unread_count || 0) + 1,
          });
        }
        break;
      }

      case 'message_status': {
        // Find which conversation this message belongs to
        for (const [convIdStr, msgs] of Object.entries(store.messages)) {
          const convId = parseInt(convIdStr);
          const found = msgs.find((m) => m.id === event.message_id);
          if (found) {
            store.updateMessage(convId, event.message_id, { status: event.status });
            break;
          }
        }
        break;
      }

      case 'message_deleted': {
        store.updateMessage(event.conversation_id, event.message_id, {
          is_deleted: true,
          content: null,
        });
        break;
      }

      case 'typing': {
        store.setTyping(event.conversation_id, event.user_id, event.user_name, true);
        setTimeout(() => {
          store.setTyping(event.conversation_id, event.user_id, event.user_name, false);
        }, 5000);
        break;
      }

      case 'stop_typing': {
        store.setTyping(event.conversation_id, event.user_id, '', false);
        break;
      }

      case 'user_status': {
        store.setUserOnline(event.user_id, event.is_online);
        // Update the conversation if it's a direct chat with this user
        store.conversations.forEach((c) => {
          if (c.type === 'direct' && c.other_user?.id === event.user_id) {
            store.updateConversation({
              id: c.id,
              other_user: c.other_user ? {
                ...c.other_user,
                is_online: event.is_online,
                last_seen: event.last_seen,
              } : undefined,
            });
          }
        });
        break;
      }

      case 'reaction': {
        const msgs = store.messages[event.conversation_id] || [];
        const msg = msgs.find((m) => m.id === event.message_id);
        if (msg) {
          let reactions = [...(msg.reactions || [])];
          if (event.action === 'removed') {
            reactions = reactions.filter((r) => r.user_id !== event.user_id);
          } else {
            const existing = reactions.findIndex((r) => r.user_id === event.user_id);
            if (existing >= 0) {
              reactions[existing] = { ...reactions[existing], emoji: event.emoji };
            } else {
              reactions.push({ emoji: event.emoji, user_id: event.user_id, user_name: '' });
            }
          }
          store.updateMessage(event.conversation_id, event.message_id, { reactions });
        }
        break;
      }

      default:
        break;
    }
  }, []);

  const connect = useCallback(() => {
    const { token, currentUser } = useStore.getState();
    if (!token || !currentUser) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_URL}/ws/${currentUser.id}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      retriesRef.current = 0;
      isConnectedRef.current = true;
      // Expose WS globally so MessageInput can send typing events
      if (typeof window !== 'undefined') {
        (window as any).__signalWS = ws;
      }
    };

    ws.onmessage = (e) => {
      try {
        const event: WSEvent = JSON.parse(e.data);
        handleEvent(event);
      } catch {}
    };

    ws.onclose = () => {
      isConnectedRef.current = false;
      wsRef.current = null;
      const { currentUser } = useStore.getState();
      if (!currentUser) return;
      if (retriesRef.current < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, retriesRef.current), 30000);
        retriesRef.current++;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [handleEvent]);

  const sendMessage = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    wsRef.current?.close();
    wsRef.current = null;
    isConnectedRef.current = false;
    retriesRef.current = MAX_RETRIES; // prevent auto-reconnect
  }, []);

  useEffect(() => {
    if (token && currentUser) {
      retriesRef.current = 0;
      connect();
    } else {
      disconnect();
    }

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [token, currentUser?.id]);

  return { sendMessage, disconnect, isConnected: isConnectedRef.current };
}
