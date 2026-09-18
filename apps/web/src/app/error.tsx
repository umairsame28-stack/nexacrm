'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background">
      <div className="text-center">
        <p className="text-6xl font-bold text-destructive/30">Error</p>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground max-w-md">
          {error.message ?? 'An unexpected error occurred. Please try again.'}
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
