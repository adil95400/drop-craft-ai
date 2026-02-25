import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { announce, prefersReducedMotion, generateAriaId } from '@/utils/a11y';

describe('a11y utilities', () => {
  describe('announce', () => {
    let announcer: HTMLDivElement;

    beforeEach(() => {
      announcer = document.createElement('div');
      announcer.id = 'a11y-announcer';
      announcer.setAttribute('aria-live', 'polite');
      document.body.appendChild(announcer);
    });

    afterEach(() => {
      announcer.remove();
    });

    it('should set text content on the announcer element', async () => {
      announce('Test message');
      // requestAnimationFrame is used internally
      await new Promise(resolve => requestAnimationFrame(resolve));
      expect(announcer.textContent).toBe('Test message');
    });

    it('should set aria-live to assertive when priority is assertive', async () => {
      announce('Urgent message', 'assertive');
      expect(announcer.getAttribute('aria-live')).toBe('assertive');
    });

    it('should not throw when announcer element is missing', () => {
      announcer.remove();
      expect(() => announce('No element')).not.toThrow();
    });
  });

  describe('prefersReducedMotion', () => {
    it('should return false by default (mocked matchMedia)', () => {
      expect(prefersReducedMotion()).toBe(false);
    });

    it('should return true when matchMedia matches', () => {
      vi.spyOn(window, 'matchMedia').mockReturnValueOnce({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });
      expect(prefersReducedMotion()).toBe(true);
    });
  });

  describe('generateAriaId', () => {
    it('should return a string with the given prefix', () => {
      const id = generateAriaId('test');
      expect(id).toMatch(/^test-\d+$/);
    });

    it('should return unique IDs on each call', () => {
      const id1 = generateAriaId();
      const id2 = generateAriaId();
      expect(id1).not.toBe(id2);
    });
  });
});
