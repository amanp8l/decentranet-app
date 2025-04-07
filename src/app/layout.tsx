import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from '@/context/UserContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DecentraNet",
  description: "A decentralized app that connects to your local Hubble node",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
