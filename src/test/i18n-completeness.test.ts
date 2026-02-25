import { describe, it, expect } from 'vitest';
import commonFr from '@/locales/fr/common.json';
import commonEn from '@/locales/en/common.json';
import commonEs from '@/locales/es/common.json';
import commonDe from '@/locales/de/common.json';

const namespaces = [
  'common', 'settings', 'navigation', 'dashboard', 'products', 'orders',
  'suppliers', 'marketing', 'monitoring', 'fulfillment', 'channels',
  'audit', 'auth', 'analytics', 'automation', 'crm', 'extensions', 'billing'
];

const languages = ['fr', 'en', 'es', 'de'];

describe('i18n Translation Completeness', () => {
  it('should have all namespaces for all languages', async () => {
    for (const lang of languages) {
      for (const ns of namespaces) {
        const module = await import(`@/locales/${lang}/${ns}.json`);
        expect(module.default || module).toBeDefined();
      }
    }
  });

  it('common.json should have matching keys across all languages', () => {
    const frKeys = Object.keys(flattenObject(commonFr)).sort();
    const enKeys = Object.keys(flattenObject(commonEn)).sort();
    const esKeys = Object.keys(flattenObject(commonEs)).sort();
    const deKeys = Object.keys(flattenObject(commonDe)).sort();

    expect(enKeys).toEqual(frKeys);
    expect(esKeys).toEqual(frKeys);
    expect(deKeys).toEqual(frKeys);
  });

  it('should not have empty translation values', () => {
    const flat = flattenObject(commonEn);
    for (const [key, value] of Object.entries(flat)) {
      expect(value, `Key "${key}" in en/common.json is empty`).not.toBe('');
    }
  });
});

function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenObject(value, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}
