'use client';
import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  onDismiss: () => void;
}

export function Toast({ message, type = 'info', onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, []);

  const colors = {
    error: 'bg-red-500',
    success: 'bg-green-500',
    info: 'bg-gray-800',
  };

  return (
    <div className={`${colors[type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up max-w-sm`}>
      <span className="text-sm flex-1">{message}</span>
      <button onClick={onDismiss} className="text-white/70 hover:text-white text-lg leading-none">×</button>
    </div>
  );
}

// Global toast manager
let toastHandler: ((msg: string, type?: 'error' | 'success' | 'info') => void) | null = null;

export function setToastHandler(fn: typeof toastHandler) {
  toastHandler = fn;
}

export function showToast(msg: string, type: 'error' | 'success' | 'info' = 'info') {
  toastHandler?.(msg, type);
}

interface ToastItem {
  id: number;
  message: string;
  type: 'error' | 'success' | 'info';
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    setToastHandler((msg, type = 'info') => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message: msg, type }]);
    });
    return () => setToastHandler(null);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
        />
      ))}
    </div>
  );
}
