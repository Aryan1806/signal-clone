'use client';
import { useState } from 'react';
import { Message } from '@/types';
import { formatMessageTime, isEmojiOnly } from '@/lib/utils';
import { useStore } from '@/store';
import { api } from '@/lib/api';

interface Props {
  message: Message;
  isGroup: boolean;
  showSender: boolean;
  hasTail: boolean;
  onReply: (msg: Message) => void;
}

const StatusIcon = ({ status }: { status: Message['status'] }) => {
  if (status === 'sending') return <span style={{ color: 'rgba(255,255,255,0.6)' }}>⏱</span>;
  if (status === 'sent') return (
    <svg width="14" height="10" viewBox="0 0 16 12" fill="none">
      <path d="M1 6l4 4L15 1" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  if (status === 'delivered') return (
    <svg width="16" height="10" viewBox="0 0 18 12" fill="none">
      <path d="M1 6l3 3L12 1" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 9l3-3" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 6l6-5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  if (status === 'read') return (
    <svg width="16" height="10" viewBox="0 0 18 12" fill="none">
      <path d="M1 6l3 3L12 1" stroke="#7af" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 9l3-3" stroke="#7af" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 6l6-5" stroke="#7af" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  return null;
};

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function MessageBubble({ message, isGroup, showSender, hasTail, onReply }: Props) {
  const { currentUser } = useStore();
  const [showReactions, setShowReactions] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);

  const isMe = message.sender_id === currentUser?.id;
  const isSystem = message.message_type === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--signal-text-muted)' }}
        >
          {message.content}
        </span>
      </div>
    );
  }

  const handleReact = async (emoji: string) => {
    try {
      await api.post(`/api/messages/${message.id}/react`, { emoji });
    } catch {}
    setShowReactions(false);
  };

  const emojiOnly = message.content && isEmojiOnly(message.content) && !message.is_deleted;

  return (
    <div
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} px-4 mb-1 group relative`}
      onMouseLeave={() => { setShowReactions(false); setShowContextMenu(false); }}
    >
      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {showSender && isGroup && !isMe && (
          <span className="text-xs font-semibold mb-0.5 ml-2" style={{ color: 'var(--signal-teal)' }}>
            {message.sender?.display_name}
          </span>
        )}

        {/* Reply preview */}
        {message.reply_to && (
          <div
            className={`mb-1 px-3 py-1.5 rounded-lg border-l-4 text-xs max-w-full ${isMe ? 'bg-blue-50' : 'bg-gray-100'}`}
            style={{ borderLeftColor: 'var(--signal-teal)', color: 'var(--signal-text-muted)' }}
          >
            {message.reply_to.is_deleted ? (
              <span className="italic">This message was deleted</span>
            ) : (
              <span className="truncate block">{message.reply_to.content}</span>
            )}
          </div>
        )}

        <div className="relative">
          {/* Hover actions */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10 ${
              isMe ? '-left-20' : '-right-20'
            }`}
          >
            <button
              onClick={() => onReply(message)}
              className="p-1.5 rounded-full bg-white shadow text-gray-500 hover:text-gray-700"
              title="Reply"
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l-3-3 3-3" />
                <path d="M6 9h9a4 4 0 010 8H9" />
              </svg>
            </button>
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1.5 rounded-full bg-white shadow text-gray-500 hover:text-gray-700 text-xs"
              title="React"
            >
              😊
            </button>
          </div>

          {/* Emoji reaction picker */}
          {showReactions && (
            <div
              className={`absolute bottom-full mb-2 flex gap-1 p-2 rounded-full shadow-lg z-20 border ${isMe ? 'right-0' : 'left-0'}`}
              style={{ background: 'var(--signal-surface)', borderColor: 'var(--signal-border)' }}
            >
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="text-xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`relative rounded-2xl px-3 py-2 ${hasTail && isMe ? 'bubble-outgoing' : hasTail && !isMe ? 'bubble-incoming' : ''}`}
            style={{
              background: emojiOnly ? 'transparent' : isMe ? 'var(--signal-outgoing)' : 'var(--signal-incoming)',
              color: emojiOnly ? 'var(--signal-text)' : isMe ? 'var(--signal-outgoing-text)' : 'var(--signal-incoming-text)',
              borderBottomRightRadius: hasTail && isMe ? '4px' : undefined,
              borderBottomLeftRadius: hasTail && !isMe ? '4px' : undefined,
            }}
          >
            {message.is_deleted ? (
              <span className="italic text-sm opacity-60">This message was deleted</span>
            ) : (
              <span className={emojiOnly ? 'text-3xl' : 'text-sm break-words'}>{message.content}</span>
            )}

            {/* Time + status */}
            <div className={`flex items-center gap-1 mt-0.5 justify-end`}>
              <span
                className="text-xs"
                style={{ color: isMe && !emojiOnly ? 'rgba(255,255,255,0.7)' : 'var(--signal-text-muted)', fontSize: '10px' }}
              >
                {formatMessageTime(message.created_at)}
              </span>
              {isMe && <StatusIcon status={message.status} />}
            </div>
          </div>
        </div>

        {/* Reactions display */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(
              message.reactions.reduce((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border"
                style={{
                  background: 'var(--signal-surface)',
                  borderColor: 'var(--signal-border)',
                  color: 'var(--signal-text)',
                }}
              >
                {emoji} {count > 1 ? count : ''}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
