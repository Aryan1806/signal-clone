'use client';
import { Conversation } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { formatConversationTime } from '@/lib/utils';
import { useStore } from '@/store';
import { useRouter } from 'next/navigation';

interface Props {
  conversation: Conversation;
  isActive: boolean;
}

export function ConversationItem({ conversation, isActive }: Props) {
  const { currentUser, onlineUsers, setActiveConversation, setMobileShowChat } = useStore();
  const router = useRouter();

  const name = conversation.type === 'direct'
    ? conversation.other_user?.display_name || 'Unknown'
    : conversation.group?.name || 'Group';

  const avatar = conversation.type === 'direct'
    ? conversation.other_user?.avatar_url
    : conversation.group?.avatar_url;

  const otherUserId = conversation.other_user?.id;
  const isOnline = otherUserId !== undefined
    ? (onlineUsers[otherUserId] ?? conversation.other_user?.is_online ?? false)
    : undefined;

  const lastMsg = conversation.last_message;
  let preview = '';
  if (lastMsg) {
    if (lastMsg.message_type === 'system') {
      preview = lastMsg.content || '';
    } else {
      const isMe = lastMsg.sender_name === currentUser?.display_name;
      preview = (isMe ? 'You: ' : '') + (lastMsg.content || '📎 Attachment');
      if (preview.length > 40) preview = preview.slice(0, 40) + '…';
    }
  }

  const handleClick = () => {
    setActiveConversation(conversation.id);
    setMobileShowChat(true);
    router.push(`/chat/${conversation.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors select-none"
      style={{
        background: isActive ? 'var(--signal-selected)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'var(--signal-hover)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      <Avatar
        src={avatar}
        name={name}
        size={48}
        isOnline={conversation.type === 'direct' ? isOnline : undefined}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm truncate" style={{ color: 'var(--signal-text)' }}>
            {name}
          </span>
          {lastMsg && (
            <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--signal-text-muted)' }}>
              {formatConversationTime(lastMsg.created_at)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs truncate" style={{ color: 'var(--signal-text-muted)' }}>
            {preview || <span className="italic">No messages yet</span>}
          </span>
          {conversation.unread_count > 0 && (
            <span
              className="ml-2 flex-shrink-0 text-white text-xs font-bold rounded-full flex items-center justify-center"
              style={{
                background: 'var(--signal-unread)',
                minWidth: '18px',
                height: '18px',
                padding: '0 5px',
              }}
            >
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
