import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Providers } from '@/components/providers/providers';
import { PWAProvider } from '@/components/pwa';
import { ThemeProvider } from '@/context/theme-context';
import { DeviceProvider } from '@/context/device-context';
import { LayoutProvider } from '@/context/layout-context';
import { KeyboardShortcutsProvider } from '@/components/ui/KeyboardShortcutsProvider';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export const metadata: Metadata = {
  title: 'SuperrWrench',
  description: 'Browser-based Android device debugging and management tool',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SuperrWrench',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#171717',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <DeviceProvider>
            <LayoutProvider>
              <Providers>
                <PWAProvider>
                  <KeyboardShortcutsProvider>
                    <ErrorBoundary>
                      {children}
                    </ErrorBoundary>
                  </KeyboardShortcutsProvider>
                </PWAProvider>
              </Providers>
            </LayoutProvider>
          </DeviceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
