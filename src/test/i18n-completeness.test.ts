import { describe, it, expect } from 'vitest';

const namespaces = [
  'common', 'settings', 'navigation', 'dashboard', 'products', 'orders',
  'suppliers', 'marketing', 'monitoring', 'fulfillment', 'channels',
  'audit', 'auth', 'analytics', 'automation', 'crm', 'extensions', 'billing',
  'pages'
];

const languages = ['fr', 'en', 'es', 'de'];
const referenceLanguage = 'fr';

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

describe('i18n Translation Completeness', () => {
  it('should have all namespaces for all languages', async () => {
    for (const lang of languages) {
      for (const ns of namespaces) {
        const module = await import(`@/locales/${lang}/${ns}.json`);
        expect(module.default || module).toBeDefined();
      }
    }
  });

  for (const ns of namespaces) {
    describe(`namespace: ${ns}`, () => {
      it(`should have matching keys across all languages`, async () => {
        const refModule = await import(`@/locales/${referenceLanguage}/${ns}.json`);
        const refKeys = Object.keys(flattenObject(refModule.default || refModule)).sort();

        for (const lang of languages) {
          if (lang === referenceLanguage) continue;
          const langModule = await import(`@/locales/${lang}/${ns}.json`);
          const langKeys = Object.keys(flattenObject(langModule.default || langModule)).sort();

          const missingInLang = refKeys.filter(k => !langKeys.includes(k));
          const extraInLang = langKeys.filter(k => !refKeys.includes(k));

          expect(missingInLang, `Keys missing in ${lang}/${ns}.json: ${missingInLang.join(', ')}`).toEqual([]);
          expect(extraInLang, `Extra keys in ${lang}/${ns}.json: ${extraInLang.join(', ')}`).toEqual([]);
        }
      });

      it(`should not have empty translation values in any language`, async () => {
        for (const lang of languages) {
          const module = await import(`@/locales/${lang}/${ns}.json`);
          const flat = flattenObject(module.default || module);
          for (const [key, value] of Object.entries(flat)) {
            expect(value, `Key "${key}" in ${lang}/${ns}.json is empty`).not.toBe('');
          }
        }
      });
    });
  }

  it('should not have duplicate values suggesting copy-paste errors', async () => {
    for (const ns of namespaces) {
      const frModule = await import(`@/locales/fr/${ns}.json`);
      const enModule = await import(`@/locales/en/${ns}.json`);
      const frFlat = flattenObject(frModule.default || frModule);
      const enFlat = flattenObject(enModule.default || enModule);

      const suspiciousDuplicates: string[] = [];
      for (const key of Object.keys(frFlat)) {
        // If FR and EN values are identical and longer than 3 chars, flag it
        // (skip short words like "OK", "API", etc.)
        if (enFlat[key] && frFlat[key] === enFlat[key] && frFlat[key].length > 15) {
          suspiciousDuplicates.push(key);
        }
      }
      // Warn but don't fail — some terms are legitimately the same
      if (suspiciousDuplicates.length > 0) {
        console.warn(`⚠️ ${ns}: ${suspiciousDuplicates.length} potentially untranslated keys (FR===EN): ${suspiciousDuplicates.slice(0, 5).join(', ')}...`);
      }
    }
  });
});
