'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { useStore } from '@/store';
import { useRouter } from 'next/navigation';
import { NewGroupModal } from './NewGroupModal';

interface Props {
  onClose: () => void;
}

export function NewChatModal({ onClose }: Props) {
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const { setActiveConversation, setMobileShowChat, addConversation } = useStore();
  const router = useRouter();

  useEffect(() => {
    api.get('/api/users/contacts').then((res) => {
      setContacts(res.data);
      setFiltered(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(contacts);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/users/search?q=${encodeURIComponent(search)}`);
        setFiltered(res.data);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [search, contacts]);

  const openChat = async (userId: number) => {
    try {
      const res = await api.post('/api/conversations/direct', { contact_id: userId });
      addConversation(res.data);
      setActiveConversation(res.data.id);
      setMobileShowChat(true);
      router.push(`/chat/${res.data.id}`);
      onClose();
    } catch {}
  };

  if (showNewGroup) {
    return <NewGroupModal onClose={() => { setShowNewGroup(false); onClose(); }} onBack={() => setShowNewGroup(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--signal-surface)', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'var(--signal-border)' }}>
          <h2 className="font-semibold text-base" style={{ color: 'var(--signal-text)' }}>New Chat</h2>
          <button onClick={onClose} style={{ color: 'var(--signal-text-muted)' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--signal-border)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ background: 'var(--signal-hover)' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--signal-text-muted)' }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="bg-transparent text-sm outline-none flex-1"
              style={{ color: 'var(--signal-text)' }}
            />
          </div>
        </div>

        {/* New group button */}
        <button
          onClick={() => setShowNewGroup(true)}
          className="w-full flex items-center gap-3 px-4 py-3 border-b transition-colors"
          style={{ borderColor: 'var(--signal-border)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--signal-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--signal-teal)' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <span className="font-medium text-sm" style={{ color: 'var(--signal-teal)' }}>New group</span>
        </button>

        {/* Contacts */}
        <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{ color: 'var(--signal-text-muted)' }}>
              {search ? `No results for "${search}"` : 'No contacts found'}
            </div>
          ) : (
            <>
              <div className="px-4 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--signal-text-muted)' }}>
                  Contacts
                </span>
              </div>
              {filtered.map((user) => (
                <button
                  key={user.id}
                  onClick={() => openChat(user.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--signal-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Avatar src={user.avatar_url} name={user.display_name} size={40} isOnline={user.is_online} />
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--signal-text)' }}>{user.display_name}</p>
                    <p className="text-xs" style={{ color: 'var(--signal-text-muted)' }}>{user.about || user.phone}</p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
