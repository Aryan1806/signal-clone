'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useStore } from '@/store';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone.match(/^\+[1-9]\d{6,14}$/)) {
      setError('Enter a valid phone number (e.g. +919876543210)');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { phone, password });
      setAuth(res.data.user, res.data.access_token);
      router.replace('/chat');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--signal-bg)' }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8 flex flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--signal-teal)' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 3C8.82 3 3 8.82 3 16c0 2.36.63 4.57 1.73 6.48L3 29l6.52-1.73C11.43 28.37 13.64 29 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3z" fill="white" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--signal-text)' }}>Signal</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--signal-text-muted)' }}>Sign in to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide mb-1 block" style={{ color: 'var(--signal-text-muted)' }}>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
              style={{
                borderColor: error && !phone ? '#ef4444' : 'var(--signal-border)',
                background: 'var(--signal-bg)',
                color: 'var(--signal-text)',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--signal-teal)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--signal-border)'}
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide mb-1 block" style={{ color: 'var(--signal-text-muted)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
              style={{
                borderColor: 'var(--signal-border)',
                background: 'var(--signal-bg)',
                color: 'var(--signal-text)',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--signal-teal)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--signal-border)'}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-60"
            style={{ background: 'var(--signal-teal)' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: 'var(--signal-text-muted)' }}>
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold" style={{ color: 'var(--signal-teal)' }}>Register</Link>
        </p>

        <div className="border-t pt-4" style={{ borderColor: 'var(--signal-border)' }}>
          <p className="text-xs text-center" style={{ color: 'var(--signal-text-muted)' }}>
            <strong>Demo accounts:</strong><br />
            +919876543210 / password123
          </p>
        </div>
      </div>
    </div>
  );
}
