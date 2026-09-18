'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { PremiumNavigation } from '@/components/layout/premium-navigation';
import { useSocket } from '@/hooks/use-socket';

const HEADER_HEIGHT = 64;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Initialize WebSocket
  useSocket();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sticky Premium Navigation */}
      <header 
        className="fixed top-0 left-0 right-0 z-50"
        style={{ height: `${HEADER_HEIGHT}px` }}
      >
        <PremiumNavigation />
      </header>

      {/* Main Content - Full Width */}
      <main 
        className="w-full"
        style={{ paddingTop: `${HEADER_HEIGHT}px` }}
      >
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
