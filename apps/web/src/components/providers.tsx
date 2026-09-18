'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/lib/query-client';
import { LoadingBar } from '@/components/ui/loading-bar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <LoadingBar />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: 'rgb(var(--card))',
              color: 'rgb(var(--card-foreground))',
              border: '1px solid rgb(var(--border))',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: 'rgb(16 185 129)', secondary: 'white' },
            },
            error: {
              iconTheme: { primary: 'rgb(239 68 68)', secondary: 'white' },
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
