'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gradient-to-r from-primary via-accent to-primary animate-pulse">
      <div className="h-full bg-gradient-to-r from-transparent via-primary-foreground/50 to-transparent animate-shimmer" 
           style={{ backgroundSize: '200% 100%' }} />
    </div>
  );
}
