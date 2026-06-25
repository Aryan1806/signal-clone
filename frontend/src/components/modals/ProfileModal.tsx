'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { showToast } from '@/components/ui/Toast';

interface Props {
  onClose: () => void;
}

export function ProfileModal({ onClose }: Props) {
  const { currentUser, setAuth, token } = useStore();
  const [editingName, setEditingName] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [name, setName] = useState(currentUser?.display_name || '');
  const [about, setAbout] = useState(currentUser?.about || '');
  const [saving, setSaving] = useState(false);

  if (!currentUser) return null;

  const save = async (field: 'display_name' | 'about') => {
    setSaving(true);
    try {
      const payload = field === 'display_name'
        ? { display_name: name }
        : { about };
      const res = await api.patch('/api/users/me', payload);
      setAuth(res.data, token!);
      if (field === 'display_name') setEditingName(false);
      else setEditingAbout(false);
      showToast('Profile updated!', 'success');
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--signal-surface)' }}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'var(--signal-border)' }}>
          <h2 className="font-semibold text-base" style={{ color: 'var(--signal-text)' }}>Profile</h2>
          <button onClick={onClose} style={{ color: 'var(--signal-text-muted)' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar src={currentUser.avatar_url} name={currentUser.display_name} size={80} />
            <button
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white"
              style={{ background: 'var(--signal-teal)' }}
              onClick={() => showToast('Photo upload — Coming Soon')}
              title="Change photo"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
          </div>

          {/* Display Name */}
          <div className="w-full">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--signal-teal)' }}>
              Your Name
            </label>
            {editingName ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && save('display_name')}
                  className="flex-1 text-sm px-3 py-2 rounded-xl border outline-none"
                  style={{ borderColor: 'var(--signal-teal)', background: 'var(--signal-bg)', color: 'var(--signal-text)' }}
                  maxLength={50}
                />
                <button
                  onClick={() => save('display_name')}
                  disabled={saving}
                  className="text-sm font-semibold"
                  style={{ color: 'var(--signal-teal)' }}
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <p className="text-base font-medium" style={{ color: 'var(--signal-text)' }}>{currentUser.display_name}</p>
                <button onClick={() => { setName(currentUser.display_name); setEditingName(true); }} style={{ color: 'var(--signal-text-muted)' }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* About */}
          <div className="w-full">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--signal-teal)' }}>
              About
            </label>
            {editingAbout ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  autoFocus
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && save('about')}
                  className="flex-1 text-sm px-3 py-2 rounded-xl border outline-none"
                  style={{ borderColor: 'var(--signal-teal)', background: 'var(--signal-bg)', color: 'var(--signal-text)' }}
                />
                <button onClick={() => save('about')} disabled={saving} className="text-sm font-semibold" style={{ color: 'var(--signal-teal)' }}>
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm" style={{ color: 'var(--signal-text-muted)' }}>{currentUser.about || 'Hey there! I am using Signal.'}</p>
                <button onClick={() => { setAbout(currentUser.about || ''); setEditingAbout(true); }} style={{ color: 'var(--signal-text-muted)' }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="w-full">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--signal-teal)' }}>
              Phone
            </label>
            <p className="mt-1 text-sm" style={{ color: 'var(--signal-text)' }}>{currentUser.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
