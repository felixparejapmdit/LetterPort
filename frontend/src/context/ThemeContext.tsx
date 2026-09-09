'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ColorMode = 'light' | 'dark';
export type DesignTheme = 'default' | 'notion';

interface ThemeContextType {
  colorMode: ColorMode;
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
  designTheme: DesignTheme;
  setDesignTheme: (theme: DesignTheme) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>('light');
  const [designTheme, setDesignThemeState] = useState<DesignTheme>('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Color Mode initialization
    const storedColor = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialColor: ColorMode = storedColor === 'dark' || (!storedColor && prefersDark) ? 'dark' : 'light';
    setColorModeState(initialColor);

    if (initialColor === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Design Theme initialization ('default' | 'notion')
    const storedDesign = (localStorage.getItem('letterport_design_theme') as DesignTheme) || 'default';
    setDesignThemeState(storedDesign);
    document.documentElement.setAttribute('data-design', storedDesign);
    if (typeof document !== 'undefined' && document.body) {
      document.body.setAttribute('data-design', storedDesign);
      if (storedDesign === 'notion') {
        document.documentElement.classList.add('theme-notion');
        document.body.classList.add('theme-notion');
      } else {
        document.documentElement.classList.remove('theme-notion');
        document.body.classList.remove('theme-notion');
      }
    }

    setMounted(true);
  }, []);

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleColorMode = () => {
    setColorMode(colorMode === 'dark' ? 'light' : 'dark');
  };

  const setDesignTheme = (theme: DesignTheme) => {
    setDesignThemeState(theme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-design', theme);
      if (document.body) {
        document.body.setAttribute('data-design', theme);
        if (theme === 'notion') {
          document.documentElement.classList.add('theme-notion');
          document.body.classList.add('theme-notion');
        } else {
          document.documentElement.classList.remove('theme-notion');
          document.body.classList.remove('theme-notion');
        }
      }
    }
    localStorage.setItem('letterport_design_theme', theme);
  };

  return (
    <ThemeContext.Provider
      value={{
        colorMode,
        toggleColorMode,
        setColorMode,
        designTheme,
        setDesignTheme,
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
