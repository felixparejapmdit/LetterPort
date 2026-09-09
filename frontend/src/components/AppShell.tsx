'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SearchModal from '@/components/SearchModal';
import { useTheme } from '@/context/ThemeContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const { designTheme, colorMode } = useTheme();
  const isDark = colorMode === 'dark';

  if (isLoginPage) {
    return (
      <div 
        className={`min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-0 m-0 overflow-x-hidden ${
          designTheme === 'notion' ? 'theme-notion' : ''
        } ${isDark ? 'dark' : ''}`}
        data-design={designTheme}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors ${
        designTheme === 'notion' ? 'theme-notion' : ''
      } ${isDark ? 'dark' : ''} ${
        designTheme === 'notion'
          ? (isDark ? 'bg-[#191919] text-[#d4d4d4]' : 'bg-[#f7f6f3] text-[#37352f]')
          : (isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800')
      }`}
      data-design={designTheme}
    >
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
      <SearchModal />
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm py-4 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>LetterPort &bull; Simple & Fast Letter Management</span>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Automatic Text Reader Active
            </span>
            <span>PocketBase / SQLite Ready</span>
            <span>NAS Server Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

