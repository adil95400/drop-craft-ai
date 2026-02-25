import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAccessibility } from '@/hooks/useAccessibility';

describe('useAccessibility', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockClear();
  });

  it('should return default settings', () => {
    const { result } = renderHook(() => useAccessibility());
    expect(result.current.settings.highContrast).toBe(false);
    expect(result.current.settings.reduceMotion).toBe(false);
    expect(result.current.settings.largeText).toBe(false);
    expect(result.current.settings.focusVisible).toBe(true);
    expect(result.current.settings.screenReaderMode).toBe(false);
  });

  it('should toggle highContrast', () => {
    const { result } = renderHook(() => useAccessibility());
    act(() => result.current.toggleHighContrast());
    expect(result.current.settings.highContrast).toBe(true);
  });

  it('should toggle reduceMotion', () => {
    const { result } = renderHook(() => useAccessibility());
    act(() => result.current.toggleReduceMotion());
    expect(result.current.settings.reduceMotion).toBe(true);
  });

  it('should toggle largeText', () => {
    const { result } = renderHook(() => useAccessibility());
    act(() => result.current.toggleLargeText());
    expect(result.current.settings.largeText).toBe(true);
  });

  it('should persist settings to localStorage', () => {
    const { result } = renderHook(() => useAccessibility());
    act(() => result.current.toggleHighContrast());
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'shopopti-accessibility',
      expect.stringContaining('"highContrast":true')
    );
  });

  it('should restore settings from localStorage', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(
      JSON.stringify({ highContrast: true, largeText: true })
    );
    const { result } = renderHook(() => useAccessibility());
    expect(result.current.settings.highContrast).toBe(true);
    expect(result.current.settings.largeText).toBe(true);
  });

  it('should reset settings to defaults', () => {
    const { result } = renderHook(() => useAccessibility());
    act(() => result.current.toggleHighContrast());
    act(() => result.current.resetSettings());
    expect(result.current.settings.highContrast).toBe(false);
  });
});
