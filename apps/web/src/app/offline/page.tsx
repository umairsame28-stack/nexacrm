'use client';

import { WifiOff } from 'lucide-react';
import { useEffect } from 'react';

export default function OfflinePage() {
  // Set document title on client side
  useEffect(() => {
    document.title = 'Offline - NexaCRM';
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B1020] via-[#111827] to-[#0B1020] p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-6">
          <WifiOff className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-3">You're Offline</h1>
        
        <p className="text-slate-300 mb-6 leading-relaxed">
          NexaCRM requires an internet connection to access your CRM data. 
          Please check your network and try again.
        </p>
        
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
        
        <div className="mt-8 text-sm text-slate-400">
          <p>Your data is safe and will be available when you reconnect.</p>
        </div>
      </div>
    </div>
  );
}
