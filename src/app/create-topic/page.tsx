'use client';

import { Suspense } from 'react';
import CreateTopicForm from '@/components/CreateTopicForm';

export default function CreateTopicPage() {
  return (
    <main className="flex min-h-screen flex-col p-4 md:p-8 max-w-4xl mx-auto">
      <Suspense fallback={<div>Loading...</div>}>
        <CreateTopicForm />
      </Suspense>
    </main>
  );
} 