'use client';

import { useParams } from 'next/navigation';
import ForumTopic from '@/components/ForumTopic';

export default function TopicPage() {
  const params = useParams();
  const topicId = params.id as string;
  
  return (
    <main className="flex min-h-screen flex-col p-4 md:p-8 max-w-4xl mx-auto">
      <ForumTopic topicId={topicId} />
    </main>
  );
} 