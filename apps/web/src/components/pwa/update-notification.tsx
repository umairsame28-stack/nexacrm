'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  
  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ registration: ServiceWorkerRegistration }>;
      setRegistration(customEvent.detail.registration);
      setShowUpdate(true);
    };
    
    window.addEventListener('pwa-update-available', handleUpdate);
    
    return () => {
      window.removeEventListener('pwa-update-available', handleUpdate);
    };
  }, []);
  
  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Send message to service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload page when service worker is activated
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  };
  
  const handleDismiss = () => {
    setShowUpdate(false);
  };
  
  if (!showUpdate) {
    return null;
  }
  
  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-slide-in-up">
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-card dark:to-card/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-2xl p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-info to-primary flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-white" />
          </div>
          
          <div className="flex-1 pr-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              Update Available
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              A new version of NexaCRM is available. Refresh to update.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="h-4 w-4" />
                Update Now
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
