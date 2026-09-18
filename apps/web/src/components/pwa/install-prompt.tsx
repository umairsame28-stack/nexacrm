'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const now = Date.now();
    
    // Don't show if dismissed in last 7 days
    if (dismissedTime && now - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
      return;
    }
    
    // Check if already installed
    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    if (isInstalled) {
      return;
    }
    
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Show prompt after 30 seconds on first visit
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }
    
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install');
    } else {
      console.log('[PWA] User dismissed install');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };
  
  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
  };
  
  if (!showPrompt || !deferredPrompt) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-slide-in-up">
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-card dark:to-card/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-2xl p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          
          <div className="flex-1 pr-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              Install NexaCRM
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Add NexaCRM to your home screen for quick access and a better experience.
            </p>
            
            <button
              onClick={handleInstall}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              <Download className="h-4 w-4" />
              Install App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
