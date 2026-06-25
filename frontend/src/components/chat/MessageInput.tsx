'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from '@/types';
import { useStore } from '@/store';
import { api } from '@/lib/api';
import { showToast } from '@/components/ui/Toast';

interface Props {
  conversationId: number;
  replyTo: Message | null;
  onClearReply: () => void;
  onSend: (msg: Message) => void;
}

export function MessageInput({ conversationId, replyTo, onClearReply, onSend }: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const { currentUser } = useStore();

  const sendTypingEvent = useCallback((type: 'typing' | 'stop_typing') => {
    // Use global WS (via store context or just call the WS directly)
    // We import from websocket singleton
    if (typeof window !== 'undefined') {
      (window as any).__signalWS?.send(JSON.stringify({ type, conversation_id: conversationId }));
    }
  }, [conversationId]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingEvent('typing');
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTypingEvent('stop_typing');
    }, 1500);

    // Auto-resize
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  };

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;

    sendTypingEvent('stop_typing');
    isTypingRef.current = false;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const tempId = -Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUser!.id,
      sender: { id: currentUser!.id, display_name: currentUser!.display_name, avatar_url: currentUser?.avatar_url },
      content,
      message_type: 'text',
      status: 'sending',
      is_deleted: false,
      reply_to: replyTo ? { id: replyTo.id, content: replyTo.content, sender_id: replyTo.sender_id, is_deleted: replyTo.is_deleted } : undefined,
      reactions: [],
      created_at: new Date().toISOString(),
    };

    onSend(optimisticMsg);
    if (replyTo) onClearReply();

    setSending(true);
    try {
      const res = await api.post(`/api/messages/${conversationId}`, {
        content,
        reply_to_id: replyTo?.id,
      });
      onSend(res.data);
    } catch {
      showToast('Failed to send message. Please try again.', 'error');
      onSend({ ...optimisticMsg, status: 'sending', id: tempId });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    textareaRef.current?.focus();
  }, [conversationId]);

  return (
    <div
      className="border-t flex-shrink-0"
      style={{ background: 'var(--signal-surface)', borderColor: 'var(--signal-border)' }}
    >
      {/* Reply preview */}
      {replyTo && (
        <div
          className="flex items-center gap-3 px-4 pt-3 pb-1"
        >
          <div
            className="flex-1 px-3 py-2 rounded-xl border-l-4 text-xs"
            style={{ borderLeftColor: 'var(--signal-teal)', background: 'var(--signal-hover)', color: 'var(--signal-text-muted)' }}
          >
            <div className="font-semibold text-xs mb-0.5" style={{ color: 'var(--signal-teal)' }}>
              Replying to {replyTo.sender?.display_name}
            </div>
            <div className="truncate">{replyTo.is_deleted ? 'This message was deleted' : replyTo.content}</div>
          </div>
          <button
            onClick={onClearReply}
            className="p-1 rounded-full"
            style={{ color: 'var(--signal-text-muted)' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-end gap-3 px-4 py-3">
        <button
          className="flex-shrink-0 text-xl p-1"
          title="Emoji"
          style={{ color: 'var(--signal-text-muted)' }}
          onClick={() => showToast('Emoji picker — use the keyboard shortcut Win+. 😊')}
        >
          😊
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          rows={1}
          className="flex-1 bg-transparent outline-none resize-none text-sm py-1"
          style={{
            color: 'var(--signal-text)',
            minHeight: '24px',
            maxHeight: '120px',
            overflowY: 'auto',
          }}
        />

        <button
          onClick={text.trim() ? handleSend : () => showToast('Voice messages — Coming Soon')}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{
            background: text.trim() ? 'var(--signal-teal)' : 'var(--signal-hover)',
            color: text.trim() ? 'white' : 'var(--signal-text-muted)',
          }}
        >
          {text.trim() ? (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          ) : (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
