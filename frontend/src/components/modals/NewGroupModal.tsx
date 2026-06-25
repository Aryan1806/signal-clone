'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { useStore } from '@/store';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/ui/Toast';

interface Props {
  onClose: () => void;
  onBack: () => void;
}

export function NewGroupModal({ onClose, onBack }: Props) {
  const [step, setStep] = useState<'members' | 'name'>('members');
  const [contacts, setContacts] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { setActiveConversation, setMobileShowChat, addConversation } = useStore();
  const router = useRouter();

  useEffect(() => {
    api.get('/api/users/contacts').then((res) => setContacts(res.data)).catch(() => {});
  }, []);

  const filtered = search.trim()
    ? contacts.filter((u) => u.display_name.toLowerCase().includes(search.toLowerCase()))
    : contacts;

  const toggleSelect = (user: User) => {
    setSelected((prev) =>
      prev.find((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      showToast('Please enter a group name', 'error');
      return;
    }
    if (selected.length === 0) {
      showToast('Please select at least one member', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/conversations/group', {
        name: groupName.trim(),
        member_ids: selected.map((u) => u.id),
        description: description.trim() || undefined,
      });
      addConversation(res.data);
      setActiveConversation(res.data.id);
      setMobileShowChat(true);
      router.push(`/chat/${res.data.id}`);
      showToast(`Group "${groupName}" created!`, 'success');
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create group', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--signal-surface)', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'var(--signal-border)' }}>
          <div className="flex items-center gap-3">
            <button onClick={step === 'name' ? () => setStep('members') : onBack} style={{ color: 'var(--signal-text-muted)' }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M5 12l7-7M5 12l7 7" />
              </svg>
            </button>
            <h2 className="font-semibold text-base" style={{ color: 'var(--signal-text)' }}>
              {step === 'members' ? 'Add group members' : 'New Group'}
            </h2>
          </div>
          {step === 'members' ? (
            <button
              onClick={() => selected.length > 0 && setStep('name')}
              disabled={selected.length === 0}
              className="text-sm font-semibold disabled:opacity-40"
              style={{ color: 'var(--signal-teal)' }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={loading || !groupName.trim()}
              className="text-sm font-semibold disabled:opacity-40"
              style={{ color: 'var(--signal-teal)' }}
            >
              {loading ? '...' : '✓ Create'}
            </button>
          )}
        </div>

        {step === 'members' && (
          <>
            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--signal-border)' }}>
                {selected.map((u) => (
                  <span
                    key={u.id}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'var(--signal-selected)', color: 'var(--signal-teal)' }}
                  >
                    {u.display_name}
                    <button onClick={() => toggleSelect(u)}>×</button>
                  </span>
                ))}
              </div>
            )}

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

            {/* Contacts list */}
            <div className="overflow-y-auto" style={{ maxHeight: '350px' }}>
              {filtered.map((user) => {
                const isSelected = !!selected.find((u) => u.id === user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleSelect(user)}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                    style={{ background: isSelected ? 'var(--signal-selected)' : 'transparent' }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--signal-hover)'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div className="relative">
                      <Avatar src={user.avatar_url} name={user.display_name} size={40} />
                      {isSelected && (
                        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-blue-500/80 text-white text-sm">✓</span>
                      )}
                    </div>
                    <span className="font-medium text-sm" style={{ color: 'var(--signal-text)' }}>{user.display_name}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 'name' && (
          <div className="p-6 flex flex-col gap-4">
            <div className="flex justify-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
                style={{ background: 'var(--signal-hover)' }}
              >
                👥
              </div>
            </div>
            <input
              autoFocus
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              maxLength={50}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={{ borderColor: 'var(--signal-border)', background: 'var(--signal-bg)', color: 'var(--signal-text)' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--signal-teal)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--signal-border)'}
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={{ borderColor: 'var(--signal-border)', background: 'var(--signal-bg)', color: 'var(--signal-text)' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--signal-teal)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--signal-border)'}
            />
            <p className="text-sm text-center" style={{ color: 'var(--signal-text-muted)' }}>
              {selected.length + 1} members
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
