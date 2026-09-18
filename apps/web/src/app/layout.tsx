import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';
import { PageLoader } from '@/components/ui/page-loader';
import { 
  ServiceWorkerRegister,
  InstallPrompt,
  UpdateNotification,
  OfflineIndicator 
} from '@/components/pwa';

export const metadata: Metadata = {
  title: {
    default: 'NexaCRM',
    template: '%s | NexaCRM',
  },
  description: 'AI-Powered WhatsApp CRM for modern sales and support teams',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NexaCRM',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  applicationName: 'NexaCRM',
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to API */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />
      </head>
      <body>
        <PageLoader />
        <Providers>{children}</Providers>
        
        {/* PWA Components */}
        <ServiceWorkerRegister />
        <InstallPrompt />
        <UpdateNotification />
        <OfflineIndicator />
      </body>
    </html>
  );
}
