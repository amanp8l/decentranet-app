'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import ResearchContributionDetail from '@/components/ResearchContributionDetail';

export default function ContributionDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <ResearchContributionDetail contributionId={id} />
      </Suspense>
    </div>
  );
} 