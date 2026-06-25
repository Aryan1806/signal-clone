'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { api } from '@/lib/api';
import { ConversationItem } from './ConversationItem';
import { Conversation, User } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { useRouter } from 'next/navigation';

interface Props {
  searchQuery: string;
}

export function ConversationList({ searchQuery }: Props) {
  const { conversations, setConversations, activeConversationId, currentUser, setActiveConversation, setMobileShowChat, addConversation } = useStore();
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api.get('/api/conversations')
      .then((res) => setConversations(res.data))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data);
      } catch {}
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openDirectChat = async (userId: number) => {
    try {
      const res = await api.post('/api/conversations/direct', { contact_id: userId });
      addConversation(res.data);
      setActiveConversation(res.data.id);
      setMobileShowChat(true);
      router.push(`/chat/${res.data.id}`);
    } catch {}
  };

  const filteredConvs = searchQuery.trim()
    ? conversations.filter((c) => {
        const name = c.type === 'direct'
          ? c.other_user?.display_name || ''
          : c.group?.name || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : conversations;

  if (loading) {
    return (
      <div className="flex flex-col gap-1 p-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-12 h-12 rounded-full animate-skeleton" style={{ background: 'var(--signal-hover)' }} />
            <div className="flex-1">
              <div className="h-3 rounded w-32 mb-2 animate-skeleton" style={{ background: 'var(--signal-hover)' }} />
              <div className="h-3 rounded w-48 animate-skeleton" style={{ background: 'var(--signal-hover)' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* User search results */}
      {searchQuery.trim() && searchResults.length > 0 && (
        <div>
          <div className="px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--signal-text-muted)' }}>
              People
            </span>
          </div>
          {searchResults.map((user) => (
            <div
              key={user.id}
              onClick={() => openDirectChat(user.id)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--signal-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Avatar src={user.avatar_url} name={user.display_name} size={40} isOnline={user.is_online} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--signal-text)' }}>{user.display_name}</p>
                <p className="text-xs" style={{ color: 'var(--signal-text-muted)' }}>{user.phone}</p>
              </div>
            </div>
          ))}
          {filteredConvs.length > 0 && (
            <div className="px-4 py-2 mt-1">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--signal-text-muted)' }}>
                Chats
              </span>
            </div>
          )}
        </div>
      )}

      {/* Conversation list */}
      {filteredConvs.length === 0 && !searchQuery.trim() && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="text-4xl opacity-20">💬</div>
          <p className="text-sm" style={{ color: 'var(--signal-text-muted)' }}>No chats yet. Start a conversation.</p>
        </div>
      )}

      {searchQuery.trim() && filteredConvs.length === 0 && searchResults.length === 0 && !searching && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="text-4xl opacity-20">🔍</div>
          <p className="text-sm" style={{ color: 'var(--signal-text-muted)' }}>No results for "{searchQuery}"</p>
        </div>
      )}

      {filteredConvs.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={conv.id === activeConversationId}
        />
      ))}
    </div>
  );
}
