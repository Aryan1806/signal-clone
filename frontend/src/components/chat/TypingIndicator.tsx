'use client';
import { useStore } from '@/store';

interface Props {
  conversationId: number;
}

export function TypingIndicator({ conversationId }: Props) {
  const { typingUsers } = useStore();
  const typingList = typingUsers[conversationId] || [];

  if (typingList.length === 0) return null;

  const names = typingList.map((t) => t.userName);
  const label =
    names.length === 1
      ? `${names[0]} is typing...`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing...`
      : 'Several people are typing...';

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: 'var(--signal-typing)',
              animation: `bounce-typing 1.2s ease-in-out ${i * 0.2}s infinite`,
              display: 'inline-block',
            }}
          />
        ))}
      </div>
      <span className="text-xs" style={{ color: 'var(--signal-typing)' }}>{label}</span>
    </div>
  );
}
