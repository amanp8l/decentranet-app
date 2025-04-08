'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoginOptions from '@/components/LoginOptions';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, login } = useUser();
  
  // Get redirect URL from query parameters if available
  const redirectUrl = searchParams?.get('redirect') || '/';
  
  // Redirect to home or specified redirect URL if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);
  
  const handleLogin = async (
    provider: string, 
    address?: string, 
    email?: string, 
    password?: string, 
    isRegister?: boolean
  ) => {
    try {
      await login(provider, address, email, password, isRegister);
      // After successful login, redirect
      router.push(redirectUrl);
    } catch (error) {
      // LoginOptions component will handle the error display
      throw error;
    }
  };
  
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md">
          <LoginOptions onLogin={handleLogin} />
          
          {redirectUrl && redirectUrl !== '/' && (
            <div className="mt-4 text-center text-sm text-gray-600">
              You will be redirected to your previous page after login.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
} 