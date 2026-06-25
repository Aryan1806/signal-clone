'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '@/store';
import { api } from '@/lib/api';
import { Message, Conversation } from '@/types';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateDivider, isSameDay } from '@/lib/utils';
import { showToast } from '@/components/ui/Toast';

interface Props {
  conversationId: number;
}

export function ChatPane({ conversationId }: Props) {
  const {
    messages, setMessages, addMessage, conversations,
    setActiveConversation, updateConversation, currentUser,
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const convMessages = messages[conversationId] || [];

  useEffect(() => {
    setActiveConversation(conversationId);

    // Load conversation detail
    api.get(`/api/conversations/${conversationId}`)
      .then((res) => setConversation(res.data))
      .catch(() => showToast('Failed to load conversation', 'error'));

    // Load messages
    setLoading(true);
    api.get(`/api/messages/${conversationId}`)
      .then((res) => {
        setMessages(conversationId, res.data);
        // Mark as read
        api.patch(`/api/conversations/${conversationId}/read`).catch(() => {});
        updateConversation({ id: conversationId, unread_count: 0 });
      })
      .catch(() => showToast('Failed to load messages', 'error'))
      .finally(() => setLoading(false));

    return () => {};
  }, [conversationId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (convMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [convMessages.length]);

  // Mark read when conversation is visible
  useEffect(() => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (conv && conv.unread_count > 0) {
      api.patch(`/api/conversations/${conversationId}/read`)
        .then(() => updateConversation({ id: conversationId, unread_count: 0 }))
        .catch(() => {});
    }
  }, [conversationId, conversations.find((c) => c.id === conversationId)?.unread_count]);

  const handleSend = useCallback((msg: Message) => {
    addMessage(conversationId, msg);
    // Update conversation list
    updateConversation({
      id: conversationId,
      updated_at: msg.created_at,
      last_message: {
        content: msg.content,
        sender_name: currentUser?.display_name || '',
        created_at: msg.created_at,
        message_type: msg.message_type,
      },
    });
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [conversationId, currentUser]);

  const conv = conversation || conversations.find((c) => c.id === conversationId);

  if (!conv) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const isGroup = conv.type === 'group';

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--signal-bg)' }}>
      <ChatHeader conversation={conv} />

      {/* Messages area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : convMessages.length === 0 ? (
          <EmptyState
            icon="🔒"
            title="Messages are end-to-end encrypted"
            subtitle="No one outside of this chat can read your messages."
          />
        ) : (
          <>
            {convMessages.map((msg, idx) => {
              const prevMsg = idx > 0 ? convMessages[idx - 1] : null;
              const nextMsg = idx < convMessages.length - 1 ? convMessages[idx + 1] : null;

              const showDateDivider = !prevMsg || !isSameDay(prevMsg.created_at, msg.created_at);

              // Group consecutive messages from same sender within 2 mins
              const sameAsPrev = prevMsg &&
                prevMsg.sender_id === msg.sender_id &&
                new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 120000;

              const sameAsNext = nextMsg &&
                nextMsg.sender_id === msg.sender_id &&
                new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime() < 120000;

              const hasTail = !sameAsNext;
              const showSender = !sameAsPrev && msg.message_type !== 'system';

              return (
                <div key={msg.id}>
                  {showDateDivider && (
                    <div className="flex justify-center my-3">
                      <span
                        className="text-xs px-3 py-1 rounded-full"
                        style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--signal-text-muted)' }}
                      >
                        {formatDateDivider(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    isGroup={isGroup}
                    showSender={showSender}
                    hasTail={hasTail}
                    onReply={setReplyTo}
                  />
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <TypingIndicator conversationId={conversationId} />

      <MessageInput
        conversationId={conversationId}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onSend={handleSend}
      />
    </div>
  );
}
