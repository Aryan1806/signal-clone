'use client';
import { getInitials, getAvatarColor } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  isOnline?: boolean;
  className?: string;
}

export function Avatar({ src, name, size = 40, isOnline, className = '' }: AvatarProps) {
  const initials = getInitials(name);
  const color = getAvatarColor(name);

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="rounded-full object-cover w-full h-full"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className="rounded-full flex items-center justify-center text-white font-semibold select-none"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          fontSize: size * 0.35,
          display: src ? 'none' : 'flex',
          position: src ? 'absolute' : 'relative',
          top: 0, left: 0,
        }}
      >
        {initials}
      </div>
      {isOnline !== undefined && (
        <span
          className="absolute rounded-full border-2 border-white"
          style={{
            width: size * 0.28,
            height: size * 0.28,
            bottom: 0,
            right: 0,
            backgroundColor: isOnline ? 'var(--signal-online)' : '#8e8e93',
            borderColor: 'var(--signal-surface)',
          }}
        />
      )}
    </div>
  );
}
