'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Preference = 'system' | 'light' | 'dark';
type Theme = 'light' | 'dark';

type ThemeContextType = {
  preference: Preference;
  theme: Theme; // effective theme
  setPreference: (p: Preference) => void;
  toggleTheme: () => void; // toggles explicit preference between light/dark
};

const ThemeContext = createContext<ThemeContextType>({
  preference: 'system',
  theme: 'light',
  setPreference: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPrefState] = useState<Preference>('system');
  const [theme, setTheme] = useState<Theme>('light');

  // Initialize preference (migrate older key if needed)
  useEffect(() => {
    try {
      const savedPref = localStorage.getItem('r53_theme_pref');
      const savedLegacy = localStorage.getItem('r53_theme');
      if (savedPref === 'system' || savedPref === 'light' || savedPref === 'dark') {
        setPrefState(savedPref as Preference);
      } else if (savedLegacy === 'light' || savedLegacy === 'dark') {
        // migrate old value to explicit preference
        setPrefState(savedLegacy as Preference);
      } else {
        setPrefState('system');
      }
    } catch (e) {
      setPreference('system');
    }
  }, []);

  // Effect to keep effective theme in sync with preference and system
  useEffect(() => {
    let mm: MediaQueryList | null = null;

    const apply = (pref: Preference) => {
      if (pref === 'dark') {
        setTheme('dark');
      } else if (pref === 'light') {
        setTheme('light');
      } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    };

    apply(preference);

    if (preference === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      mm = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent | MediaQueryList) => {
        setTheme(e.matches ? 'dark' : 'light');
      };
      // older browsers use addListener
      if ((mm as any).addEventListener) {
        (mm as any).addEventListener('change', handler);
      } else if ((mm as any).addListener) {
        (mm as any).addListener(handler);
      }
      return () => {
        if (!mm) return;
        if ((mm as any).removeEventListener) {
          (mm as any).removeEventListener('change', handler);
        } else if ((mm as any).removeListener) {
          (mm as any).removeListener(handler);
        }
      };
    }
    return () => {};
  }, [preference]);

  // Apply classes and persist preference
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    try {
      localStorage.setItem('r53_theme_pref', preference);
    } catch (e) {
      // ignore
    }
  }, [theme, preference]);

  const setPreference = (p: Preference) => setPrefState(p);

  const toggleTheme = () => {
    // if currently system, toggle based on effective theme
    if (preference === 'system') {
      setPrefState(theme === 'dark' ? 'light' : 'dark');
    } else {
      setPrefState(preference === 'dark' ? 'light' : 'dark');
    }
  };

  const value = useMemo(() => ({ preference, theme, setPreference, toggleTheme }), [preference, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
