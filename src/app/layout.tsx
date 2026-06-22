import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { CustomThemeHandler } from '@/components/custom-theme-handler';
import { TimerProvider } from '@/context/TimerContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { GoogleTranslate } from '@/components/google-translate';

export const metadata: Metadata = {
  title: 'Sutradhaar Tools',
  description: 'Smart Tools & Calculators',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sutradhaar Tools',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body suppressHydrationWarning>
        <GoogleTranslate />
        <ThemeProvider
          attribute="class"
          defaultTheme="theme-arctic"
          enableSystem={false}
          disableTransitionOnChange
          themes={['light', 'dark', 'theme-sutradhaar', 'theme-midnight', 'theme-nebula', 'theme-emerald', 'theme-slate', 'theme-arctic', 'theme-lavender', 'custom']}
        >
          <ProfileProvider>
            <TimerProvider>
              <CustomThemeHandler />
              <div className="flex flex-col w-full h-[100dvh] sm:h-screen bg-background text-foreground relative shadow-2xl border-x border-border/50 max-w-[412px] mx-auto overflow-hidden">
                <div className="w-full h-full flex flex-col">
                  {children}
                </div>
              </div>
              <Toaster />
            </TimerProvider>
          </ProfileProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
