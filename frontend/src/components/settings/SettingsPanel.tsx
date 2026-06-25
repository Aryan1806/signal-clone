'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Avatar } from '@/components/ui/Avatar';
import { showToast } from '@/components/ui/Toast';
import { ProfileModal } from '@/components/modals/ProfileModal';

const SETTINGS_ITEMS = [
  { id: 'account', label: 'Account', icon: '🔑', description: 'Privacy, security, change number' },
  { id: 'privacy', label: 'Privacy', icon: '🔒', description: 'Last seen, profile photo, status' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', description: 'Messages, groups, calls' },
  { id: 'storage', label: 'Storage and data', icon: '💾', description: 'Network usage, auto-download' },
  { id: 'appearance', label: 'App Appearance', icon: '🎨', description: 'Theme, wallpaper, font size' },
  { id: 'linked', label: 'Linked devices', icon: '💻', description: 'Coming Soon' },
  { id: 'help', label: 'Help', icon: '❓', description: 'FAQ, contact us, privacy policy' },
];

export function SettingsPanel() {
  const { currentUser } = useStore();
  const [showProfile, setShowProfile] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  const toggleDark = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('signal_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('signal_theme', 'light');
    }
  };

  if (!currentUser) return null;

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {/* Profile row */}
        <button
          onClick={() => setShowProfile(true)}
          className="w-full flex items-center gap-3 px-4 py-4 border-b transition-colors text-left"
          style={{ borderColor: 'var(--signal-border)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--signal-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Avatar src={currentUser.avatar_url} name={currentUser.display_name} size={52} isOnline={true} />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--signal-text)' }}>{currentUser.display_name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--signal-text-muted)' }}>{currentUser.about || 'Hey there! I am using Signal.'}</p>
            <p className="text-xs" style={{ color: 'var(--signal-text-muted)' }}>{currentUser.phone}</p>
          </div>
        </button>

        {/* Settings items */}
        {SETTINGS_ITEMS.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => {
                if (item.id === 'appearance') {
                  setActiveSection(activeSection === 'appearance' ? null : 'appearance');
                } else {
                  showToast(`${item.label} — Coming Soon`);
                }
              }}
              className="w-full flex items-center gap-4 px-4 py-4 border-b transition-colors text-left"
              style={{ borderColor: 'var(--signal-border)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--signal-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span className="text-2xl w-8 text-center">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--signal-text)' }}>{item.label}</p>
                <p className="text-xs" style={{ color: 'var(--signal-text-muted)' }}>{item.description}</p>
              </div>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--signal-text-muted)', flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Dark mode toggle */}
            {item.id === 'appearance' && activeSection === 'appearance' && (
              <div
                className="flex items-center justify-between px-6 py-4 border-b"
                style={{ borderColor: 'var(--signal-border)', background: 'var(--signal-hover)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--signal-text)' }}>Dark mode</p>
                  <p className="text-xs" style={{ color: 'var(--signal-text-muted)' }}>Switch between light and dark theme</p>
                </div>
                <button
                  onClick={toggleDark}
                  className="relative w-12 h-6 rounded-full transition-colors duration-300 flex-shrink-0"
                  style={{ background: isDark ? 'var(--signal-teal)' : 'var(--signal-border)' }}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300"
                    style={{ transform: isDark ? 'translateX(26px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );
}
