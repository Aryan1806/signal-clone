'use client';
import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { ConversationList } from './ConversationList';
import { NewChatModal } from '@/components/modals/NewChatModal';
import { ProfileModal } from '@/components/modals/ProfileModal';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { showToast } from '@/components/ui/Toast';

export function Sidebar() {
  const { currentUser, clearAuth, sidebarTab, setSidebarTab, isMobileShowChat } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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

  const handleLogout = async () => {
    try { await api.post('/api/auth/logout'); } catch {}
    clearAuth();
    router.replace('/login');
  };

  if (!currentUser) return null;

  return (
    <>
      <aside
        className={`flex-col border-r ${isMobileShowChat ? 'hidden' : 'flex'} md:flex`}
        style={{
          width: '360px',
          minWidth: '360px',
          background: 'var(--signal-surface)',
          borderColor: 'var(--signal-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center px-4 py-3 gap-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--signal-border)' }}
        >
          <button onClick={() => setShowProfile(true)} className="flex-shrink-0">
            <Avatar src={currentUser.avatar_url} name={currentUser.display_name} size={36} isOnline={true} />
          </button>
          <span
            className="flex-1 font-semibold text-base cursor-pointer"
            style={{ color: 'var(--signal-text)' }}
            onClick={() => setShowProfile(true)}
          >
            Signal
          </span>
          <button
            onClick={() => setShowNewChat(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="New chat"
            style={{ color: 'var(--signal-text-muted)' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
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
                  { label: 'New group', action: () => { setShowNewChat(true); setShowMenu(false); } },
                  { label: 'Settings', action: () => { setSidebarTab('settings'); setShowMenu(false); } },
                  { label: 'Log out', action: handleLogout, danger: true },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full text-left px-4 py-3 text-sm transition-colors"
                    style={{
                      color: item.danger ? '#ef4444' : 'var(--signal-text)',
                    }}
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

        {/* Tabs */}
        <div
          className="flex border-b flex-shrink-0"
          style={{ borderColor: 'var(--signal-border)' }}
        >
          {(['chats', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              className="flex-1 py-3 text-sm font-medium capitalize transition-colors relative"
              style={{
                color: sidebarTab === tab ? 'var(--signal-teal)' : 'var(--signal-text-muted)',
              }}
            >
              {tab}
              {sidebarTab === tab && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                  style={{ background: 'var(--signal-teal)' }}
                />
              )}
            </button>
          ))}
        </div>

        {sidebarTab === 'chats' ? (
          <>
            {/* Search bar */}
            <div className="px-4 py-2 flex-shrink-0">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-full"
                style={{ background: 'var(--signal-hover)' }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--signal-text-muted)' }}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setSearchQuery('')}
                  placeholder="Search or start new chat"
                  className="bg-transparent text-sm outline-none flex-1"
                  style={{ color: 'var(--signal-text)' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ color: 'var(--signal-text-muted)' }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <ConversationList searchQuery={searchQuery} />
          </>
        ) : (
          <SettingsPanel />
        )}
      </aside>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );
}
