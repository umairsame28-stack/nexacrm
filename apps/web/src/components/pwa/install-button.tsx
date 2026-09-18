'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  
  useEffect(() => {
    // Check if already installed
    const installed =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    setIsInstalled(installed);
    
    if (installed) {
      console.log('[PWA] Already installed, hiding install button');
      return;
    }
    
    console.log('[PWA] Not installed yet, waiting for beforeinstallprompt event');
    
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event fired!');
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowButton(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Debug: Check manifest and service worker status after a delay
    setTimeout(() => {
      if (!deferredPrompt) {
        console.log('[PWA] beforeinstallprompt event not fired yet');
        console.log('[PWA] Checking PWA criteria...');
        
        // Check if manifest is loaded
        const manifestLink = document.querySelector('link[rel="manifest"]');
        console.log('[PWA] Manifest link:', manifestLink?.getAttribute('href'));
        
        // Check if service worker is registered
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then(reg => {
            console.log('[PWA] Service worker registered:', !!reg);
            if (reg) {
              console.log('[PWA] Service worker state:', reg.active?.state);
            }
          });
        }
      }
    }, 3000);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [deferredPrompt]);
  
  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No deferred prompt available');
      return;
    }
    
    console.log('[PWA] Showing install prompt');
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install');
    } else {
      console.log('[PWA] User dismissed install');
    }
    
    setDeferredPrompt(null);
    setShowButton(false);
  };
  
  // Show button if prompt is available
  if (!showButton || !deferredPrompt) {
    return null;
  }
  
  return (
    <button
      onClick={handleInstall}
      className="flex h-10 items-center gap-2 px-4 rounded-xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-sm font-medium transition-all duration-200 hover:scale-105 hover:border-primary/40 animate-pulse-subtle"
      title="Install NexaCRM as an app"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Install App</span>
    </button>
  );
}
