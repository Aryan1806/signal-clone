'use client';
import { useState, useRef, useEffect } from 'react';
import { Conversation } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { formatLastSeen } from '@/lib/utils';
import { useStore } from '@/store';
import { showToast } from '@/components/ui/Toast';
import { ContactInfoModal } from '@/components/modals/ContactInfoModal';
import { GroupInfoModal } from '@/components/modals/GroupInfoModal';
import { useRouter } from 'next/navigation';

interface Props {
  conversation: Conversation;
}

export function ChatHeader({ conversation }: Props) {
  const { onlineUsers, setMobileShowChat, setActiveConversation } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isGroup = conversation.type === 'group';
  const name = isGroup ? conversation.group?.name : conversation.other_user?.display_name;
  const avatar = isGroup ? conversation.group?.avatar_url : conversation.other_user?.avatar_url;
  const otherUserId = conversation.other_user?.id;
  const isOnline = otherUserId !== undefined
    ? (onlineUsers[otherUserId] ?? conversation.other_user?.is_online ?? false)
    : false;

  const subtitle = isGroup
    ? `${conversation.group?.member_count || 0} members`
    : isOnline
      ? 'Online'
      : formatLastSeen(conversation.other_user?.last_seen);

  const handleBack = () => {
    setMobileShowChat(false);
    setActiveConversation(null);
    router.push('/chat');
  };

  return (
    <>
      <div
        className="flex items-center px-4 py-3 gap-3 border-b flex-shrink-0"
        style={{ background: 'var(--signal-surface)', borderColor: 'var(--signal-border)' }}
      >
        <button
          onClick={handleBack}
          className="p-1 rounded-full hover:bg-gray-100 md:hidden"
          style={{ color: 'var(--signal-text-muted)' }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" />
          </svg>
        </button>

        <button
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
          onClick={() => setShowInfo(true)}
        >
          <Avatar
            src={avatar}
            name={name || ''}
            size={40}
            isOnline={isGroup ? undefined : isOnline}
          />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--signal-text)' }}>{name}</p>
            <p className="text-xs truncate" style={{ color: isOnline && !isGroup ? 'var(--signal-online)' : 'var(--signal-text-muted)' }}>
              {subtitle}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => showToast('Voice calls — Coming Soon', 'info')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--signal-text-muted)' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
          </button>
          <button
            onClick={() => showToast('Video calls — Coming Soon', 'info')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--signal-text-muted)' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--signal-text-muted)' }}
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-48 rounded-xl shadow-lg z-50 overflow-hidden border"
                style={{ background: 'var(--signal-surface)', borderColor: 'var(--signal-border)' }}
              >
                {[
                  { label: 'View info', action: () => { setShowInfo(true); setShowMenu(false); } },
                  { label: 'Search', action: () => { showToast('In-chat search — Coming Soon'); setShowMenu(false); } },
                  { label: 'Disappearing messages', action: () => { showToast('Disappearing messages — Coming Soon'); setShowMenu(false); } },
                  { label: 'Clear chat', action: () => { showToast('Clear chat — Coming Soon'); setShowMenu(false); } },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full text-left px-4 py-3 text-sm transition-colors"
                    style={{ color: 'var(--signal-text)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--signal-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showInfo && isGroup && (
        <GroupInfoModal conversation={conversation} onClose={() => setShowInfo(false)} />
      )}
      {showInfo && !isGroup && conversation.other_user && (
        <ContactInfoModal user={conversation.other_user} onClose={() => setShowInfo(false)} />
      )}
    </>
  );
}
