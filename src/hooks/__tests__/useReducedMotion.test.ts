import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReducedMotion, getMotionProps } from '@/hooks/useReducedMotion';

describe('useReducedMotion', () => {
  it('should return false by default (mocked matchMedia)', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('should return true when prefers-reduced-motion matches', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});

describe('getMotionProps', () => {
  const baseMotion = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    whileHover: { scale: 1.05 },
    transition: { duration: 0.3 },
  };

  it('should return original props when motion is not reduced', () => {
    const result = getMotionProps(false, baseMotion);
    expect(result).toEqual(baseMotion);
  });

  it('should disable all motion when reduced motion is preferred', () => {
    const result = getMotionProps(true, baseMotion);
    expect(result.initial).toBe(false);
    expect(result.animate).toBe(false);
    expect(result.exit).toBe(false);
    expect(result.whileHover).toBeUndefined();
    expect(result.transition.duration).toBe(0);
  });
});
