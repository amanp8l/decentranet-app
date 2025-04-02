# Farcaster Social UI

A decentralized social media application that connects to a Hubble node (Farcaster protocol node).

## Features

- View casts from the Farcaster network
- Post new casts as an authenticated user
- Multiple authentication methods:
  - Warpcast app login with QR code
  - Ethereum wallet connection
  - Local Hubble node authentication
- Profile display with connection details

## Tech Stack

- Next.js 13+ with App Router
- TypeScript
- Tailwind CSS
- Farcaster Protocol

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Connect to your local Hubble node (should be running at http://localhost:2281)

## Requirements

- Node.js 18+
- Local Hubble node (v1.19.1+)
