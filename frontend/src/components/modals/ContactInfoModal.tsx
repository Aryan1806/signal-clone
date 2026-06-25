'use client';
import { User } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { formatLastSeen } from '@/lib/utils';
import { useStore } from '@/store';
import { showToast } from '@/components/ui/Toast';

interface Props {
  user: User;
  onClose: () => void;
}

export function ContactInfoModal({ user, onClose }: Props) {
  const { onlineUsers } = useStore();
  const isOnline = onlineUsers[user.id] ?? user.is_online;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--signal-surface)' }}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'var(--signal-border)' }}>
          <button onClick={onClose} style={{ color: 'var(--signal-text-muted)' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M5 12l7-7M5 12l7 7" />
            </svg>
          </button>
          <h2 className="font-semibold text-base" style={{ color: 'var(--signal-text)' }}>Contact Info</h2>
          <div className="w-8" />
        </div>

        <div className="flex flex-col items-center p-6 gap-3">
          <Avatar src={user.avatar_url} name={user.display_name} size={80} isOnline={isOnline} />
          <div className="text-center">
            <h3 className="font-semibold text-lg" style={{ color: 'var(--signal-text)' }}>{user.display_name}</h3>
            <p className="text-sm" style={{ color: isOnline ? 'var(--signal-online)' : 'var(--signal-text-muted)' }}>
              {isOnline ? 'Online' : formatLastSeen(user.last_seen)}
            </p>
          </div>
        </div>

        <div className="border-t" style={{ borderColor: 'var(--signal-border)' }}>
          {[
            { icon: '📱', label: 'Phone', value: user.phone },
            { icon: '💬', label: 'About', value: user.about || 'Hey there! I am using Signal.' },
          ].map((row) => (
            <div key={row.label} className="flex items-start gap-4 px-6 py-4 border-b" style={{ borderColor: 'var(--signal-border)' }}>
              <span className="text-xl mt-0.5">{row.icon}</span>
              <div>
                <p className="text-xs uppercase tracking-wide font-semibold mb-0.5" style={{ color: 'var(--signal-teal)' }}>{row.label}</p>
                <p className="text-sm" style={{ color: 'var(--signal-text)' }}>{row.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 flex flex-col gap-1">
          {['Media, Links and Docs', 'Mute', 'Block', 'Clear chat', 'Delete chat'].map((action) => (
            <button
              key={action}
              onClick={() => showToast(`${action} — Coming Soon`)}
              className="w-full text-left px-4 py-3 text-sm rounded-xl transition-colors"
              style={{ color: action === 'Block' || action === 'Delete chat' ? '#ef4444' : 'var(--signal-text)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--signal-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
