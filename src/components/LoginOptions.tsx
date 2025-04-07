'use client';

import { useState } from 'react';
import EmailLoginForm from './EmailLoginForm';

interface LoginProps {
  onLogin: (provider: string, address?: string, email?: string, password?: string, isRegister?: boolean) => void;
}

export default function LoginOptions({ onLogin }: LoginProps) {
  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign In</h2>
        <EmailLoginForm onLogin={onLogin} />
      </div>
    </div>
  );
} 