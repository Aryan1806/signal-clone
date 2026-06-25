'use client';
import { useParams } from 'next/navigation';
import { ChatPane } from '@/components/chat/ChatPane';

export default function ChatPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  return <ChatPane conversationId={id} />;
}
