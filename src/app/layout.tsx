import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/providers';
import { PWAProvider } from '@/components/pwa';
import { ThemeProvider } from '@/context/theme-context';
import { DeviceProvider } from '@/context/device-context';
import { AIAssistantProvider } from '@/context/ai-assistant-context';
import { LayoutProvider } from '@/context/layout-context';
import { KeyboardShortcutsProvider } from '@/components/ui/KeyboardShortcutsProvider';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ConnectionLostOverlay } from '@/components/ui/ConnectionLostOverlay';

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
});

export const metadata: Metadata = {
  title: 'ADB Wrench - Browser-based Android debugging tool',
  description: 'Browser-based Android debugging tool',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ADB Wrench',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
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
    <html lang="en" className={ibmPlexMono.variable} suppressHydrationWarning>
      <body className="font-mono antialiased">
        <ThemeProvider>
          <DeviceProvider>
          <AIAssistantProvider>
            <LayoutProvider>
              <Providers>
                <PWAProvider>
                  <KeyboardShortcutsProvider>
                    <ErrorBoundary>
                      {children}
                      <ConnectionLostOverlay />
                    </ErrorBoundary>
                  </KeyboardShortcutsProvider>
                </PWAProvider>
              </Providers>
            </LayoutProvider>
          </AIAssistantProvider>
          </DeviceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
