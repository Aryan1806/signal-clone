'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { useWebSocket } from '@/hooks/useWebSocket';
import { api } from '@/lib/api';
import { ToastContainer } from '@/components/ui/Toast';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { Spinner } from '@/components/ui/Spinner';

function MainContent({ children }: { children: React.ReactNode }) {
  const { isMobileShowChat } = useStore();
  return (
    <main
      className={`flex-1 flex-col overflow-hidden ${isMobileShowChat ? 'flex' : 'hidden'} md:flex`}
      style={{ background: 'var(--signal-surface)' }}
    >
      {children}
    </main>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const { currentUser, token, setAuth, clearAuth } = useStore();
  const router = useRouter();

  useWebSocket();

  useEffect(() => {
    const savedToken = localStorage.getItem('signal_token');
    if (!savedToken) {
      router.replace('/login');
      return;
    }

    api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((res) => {
        setAuth(res.data, savedToken);
        setLoading(false);
      })
      .catch(() => {
        clearAuth();
        router.replace('/login');
      });
  }, []);

  // Dark mode from localStorage
  useEffect(() => {
    const theme = localStorage.getItem('signal_theme');
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--signal-bg)' }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--signal-bg)' }}>
      <Sidebar />
      <MainContent>{children}</MainContent>
      <ToastContainer />
    </div>
  );
}
