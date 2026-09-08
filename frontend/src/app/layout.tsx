import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import SearchModal from '@/components/SearchModal';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'LetterPort | Robust Letter Management System (LMS)',
  description: 'Fast, modern letter management system with VEM tracking, automated background OCR, and full-text search.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {/* Avoid theme & design flashing on refresh */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                var design = localStorage.getItem('letterport_design_theme') || 'default';
                document.documentElement.setAttribute('data-design', design);
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col transition-colors">
        <AuthProvider>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
