'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { colorMode, toggleColorMode, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/50" />
    );
  }

  return (
    <button
      onClick={toggleColorMode}
      type="button"
      title={colorMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={colorMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
    >
      {colorMode === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600 transition-transform duration-200 rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
}
