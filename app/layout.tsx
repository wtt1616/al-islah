import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import SessionProvider from '@/components/SessionProvider';
import BootstrapClient from '@/components/BootstrapClient';
import FloatingFooter from '@/components/FloatingFooter';
import { ToastProvider } from '@/components/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'iSAR - Imam and Bilal Schedule System',
  description: 'Prayer schedule management system for mosques and surau',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'iSAR',
  },
  themeColor: '#059669',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="iSAR" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#059669" />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <ToastProvider>
            {children}
            <FloatingFooter />
            <BootstrapClient />
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
