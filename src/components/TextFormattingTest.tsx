'use client';

import React from 'react';
import { formatText } from '@/utils/textFormatting';

export default function TextFormattingTest() {
  const handleViewProfile = (fid: number) => {
    console.log(`View profile for FID: ${fid}`);
    alert(`View profile for FID: ${fid}`);
  };

  const testCases = [
    'Regular text with no links or mentions',
    'Link test: https://example.com and more text',
    'Mention test: @username and more text',
    'Mixed test: @username and https://example.com in one string',
    'Double test: @username @anotheruser both mentions',
    'Multiple: https://example.com and https://another.com links'
  ];

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Text Formatting Test</h1>
      
      <div className="space-y-4">
        {testCases.map((testCase, index) => (
          <div key={index} className="border p-3 rounded">
            <h2 className="font-semibold text-sm mb-2">Test {index + 1}:</h2>
            <div className="bg-gray-50 p-2 rounded mb-2 text-gray-700 text-sm font-mono">
              {testCase}
            </div>
            <div className="bg-white p-2 rounded border">
              {formatText(testCase, handleViewProfile)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 