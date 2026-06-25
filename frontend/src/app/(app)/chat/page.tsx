'use client';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full">
      <EmptyState
        icon={
          <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
            <path d="M16 3C8.82 3 3 8.82 3 16c0 2.36.63 4.57 1.73 6.48L3 29l6.52-1.73C11.43 28.37 13.64 29 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3z"
              fill="var(--signal-teal)" opacity="0.3" />
          </svg>
        }
        title="Select a chat to start messaging"
        subtitle="Messages are end-to-end encrypted"
      />
    </div>
  );
}
