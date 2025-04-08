'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-4 mt-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
          <div>
            <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} DecentraNet | DeSci-centric SocialFi platform</p>
          </div>
          <div className="flex items-center flex-wrap justify-center md:justify-end">
            <span className="text-sm text-gray-600 mr-2">Sponsored by</span>
            <Link 
              href="https://aurasci.xyz/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center hover:opacity-80 transition-opacity mx-1"
            >
              <Image 
                src="/aurasci_logo.jpg" 
                alt="AuraSci" 
                width={100} 
                height={40} 
                className="h-7 w-auto object-contain rounded-sm"
              />
              <span className="ml-1.5 font-medium text-purple-700">AuraSci</span>
            </Link>
            <span className="text-sm text-gray-600 ml-1 hidden sm:inline">- Driving social innovation in decentralized science</span>
          </div>
        </div>
      </div>
    </footer>
  );
} 