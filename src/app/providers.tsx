import React, { createContext, useContext, useState, useEffect } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within an AppProviders hierarchy');
  }
  return context;
}

export interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('hteim_theme_mode');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'light';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    try {
      localStorage.setItem('hteim_theme_mode', theme);
    } catch (e) {}

    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      setIsDark(true);
    } else {
      root.classList.remove('dark');
      setIsDark(false);
    }
  }, [theme]);

  return (
    <ErrorBoundary label="App Core Provider">
      <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
        {children}
      </ThemeContext.Provider>
    </ErrorBoundary>
  );
}

export default AppProviders;
