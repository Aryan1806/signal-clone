'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStore } from '@/store';

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const { setAuth, currentUser, token } = useStore();
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('signal_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }

    api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((res) => {
        setAuth(res.data, savedToken);
      })
      .catch(() => {
        localStorage.removeItem('signal_token');
        localStorage.removeItem('signal_user');
      })
      .finally(() => setLoading(false));
  }, []);

  return { loading, currentUser, token };
}
