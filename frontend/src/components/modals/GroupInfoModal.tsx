'use client';
import { useState, useEffect } from 'react';
import { Conversation, ConversationParticipant } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import { showToast } from '@/components/ui/Toast';

interface Props {
  conversation: Conversation;
  onClose: () => void;
}

export function GroupInfoModal({ conversation, onClose }: Props) {
  const { currentUser } = useStore();
  const [members, setMembers] = useState<ConversationParticipant[]>(conversation.participants || []);
  const group = conversation.group;

  useEffect(() => {
    api.get(`/api/groups/${conversation.id}/members`)
      .then((res) => setMembers(res.data))
      .catch(() => {});
  }, [conversation.id]);

  const isAdmin = members.find((m) => m.user_id === currentUser?.id)?.role === 'admin';

  const handleRemoveMember = async (userId: number, name: string) => {
    if (!confirm(`Remove ${name} from the group?`)) return;
    try {
      await api.delete(`/api/groups/${conversation.id}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      showToast(`${name} removed from group`, 'success');
    } catch {
      showToast('Failed to remove member', 'error');
    }
  };

  if (!group) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--signal-surface)', maxHeight: '85vh' }}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--signal-border)' }}>
          <button onClick={onClose} style={{ color: 'var(--signal-text-muted)' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M5 12l7-7M5 12l7 7" />
            </svg>
          </button>
          <h2 className="font-semibold text-base" style={{ color: 'var(--signal-text)' }}>Group Info</h2>
          {isAdmin ? (
            <button style={{ color: 'var(--signal-teal)' }} onClick={() => showToast('Edit group — Coming Soon')}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          ) : <div className="w-6" />}
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Group header */}
          <div className="flex flex-col items-center p-6 gap-3">
            <Avatar src={group.avatar_url} name={group.name} size={80} />
            <div className="text-center">
              <h3 className="font-semibold text-lg" style={{ color: 'var(--signal-text)' }}>{group.name}</h3>
              <p className="text-sm" style={{ color: 'var(--signal-text-muted)' }}>Group · {members.length} members</p>
            </div>
            {group.description && (
              <p className="text-sm text-center" style={{ color: 'var(--signal-text-muted)' }}>{group.description}</p>
            )}
          </div>

          {/* Options */}
          <div className="border-t border-b" style={{ borderColor: 'var(--signal-border)' }}>
            {['Media, Links and Docs', 'Disappearing messages', 'Invite link'].map((action) => (
              <button
                key={action}
                onClick={() => showToast(`${action} — Coming Soon`)}
                className="w-full text-left flex items-center gap-4 px-6 py-4 transition-colors"
                style={{ borderBottom: '1px solid var(--signal-border)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--signal-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span className="text-sm" style={{ color: 'var(--signal-text)' }}>{action}</span>
              </button>
            ))}
          </div>

          {/* Members */}
          <div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: 'var(--signal-text)' }}>{members.length} members</span>
              {isAdmin && (
                <button
                  onClick={() => showToast('Add member — Coming Soon')}
                  className="text-sm font-semibold"
                  style={{ color: 'var(--signal-teal)' }}
                >
                  + Add member
                </button>
              )}
            </div>
            {members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Avatar src={member.user.avatar_url} name={member.user.display_name} size={40} isOnline={member.user.is_online} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate" style={{ color: 'var(--signal-text)' }}>
                      {member.user.display_name}
                      {member.user_id === currentUser?.id ? ' (you)' : ''}
                    </span>
                    {member.role === 'admin' && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--signal-selected)', color: 'var(--signal-teal)' }}>
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--signal-text-muted)' }}>{member.user.about || member.user.phone}</p>
                </div>
                {isAdmin && member.user_id !== currentUser?.id && (
                  <button
                    onClick={() => handleRemoveMember(member.user_id, member.user.display_name)}
                    className="p-1 rounded-full"
                    style={{ color: '#ef4444' }}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
