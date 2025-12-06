import { useState, useEffect, useCallback } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  reduceMotion: boolean;
  largeText: boolean;
  focusVisible: boolean;
  screenReaderMode: boolean;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reduceMotion: false,
  largeText: false,
  focusVisible: true,
  screenReaderMode: false,
};

const STORAGE_KEY = 'shopopti-accessibility';

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window === 'undefined') return defaultSettings;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        return defaultSettings;
      }
    }
    
    // Detect user preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
    
    return {
      ...defaultSettings,
      reduceMotion: prefersReducedMotion,
      highContrast: prefersHighContrast,
    };
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Apply CSS classes to document
  useEffect(() => {
    const root = document.documentElement;
    
    root.classList.toggle('high-contrast', settings.highContrast);
    root.classList.toggle('reduce-motion', settings.reduceMotion);
    root.classList.toggle('large-text', settings.largeText);
    root.classList.toggle('keyboard-nav', settings.focusVisible);
    root.classList.toggle('screen-reader', settings.screenReaderMode);
    
    // Set CSS custom property for text scale
    if (settings.largeText) {
      root.style.setProperty('--text-scale', '1.25');
    } else {
      root.style.removeProperty('--text-scale');
    }
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const toggleHighContrast = useCallback(() => {
    updateSetting('highContrast', !settings.highContrast);
  }, [settings.highContrast, updateSetting]);

  const toggleReduceMotion = useCallback(() => {
    updateSetting('reduceMotion', !settings.reduceMotion);
  }, [settings.reduceMotion, updateSetting]);

  const toggleLargeText = useCallback(() => {
    updateSetting('largeText', !settings.largeText);
  }, [settings.largeText, updateSetting]);

  return {
    settings,
    updateSetting,
    resetSettings,
    toggleHighContrast,
    toggleReduceMotion,
    toggleLargeText,
  };
}
