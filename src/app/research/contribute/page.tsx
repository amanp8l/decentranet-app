'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import ResearchContributionForm from '@/components/ResearchContributionForm';

export default function ContributePage() {
  const router = useRouter();
  const { isAuthenticated } = useUser();
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login?redirect=/research/contribute');
    }
  }, [isAuthenticated, router]);
  
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <Link href="/research" className="text-purple-600 hover:text-purple-800">
          &larr; Back to Research
        </Link>
      </div>
      
      <ResearchContributionForm />
    </div>
  );
} 