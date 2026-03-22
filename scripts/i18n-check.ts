#!/usr/bin/env npx tsx
/**
 * i18n Completeness Checker
 * 
 * Usage: npx tsx scripts/i18n-check.ts [--fix]
 * 
 * Checks all locale files for:
 * - Missing keys across languages
 * - Empty values
 * - Structural inconsistencies
 * 
 * With --fix: copies missing keys from reference language (FR) with a placeholder.
 */

import fs from 'fs';
import path from 'path';

const LOCALES_DIR = path.resolve(__dirname, '../src/locales');
const LANGUAGES = ['fr', 'en', 'es', 'de'];
const REFERENCE_LANG = 'fr';
const FIX_MODE = process.argv.includes('--fix');

interface Report {
  missingKeys: { lang: string; ns: string; keys: string[] }[];
  emptyValues: { lang: string; ns: string; keys: string[] }[];
  totalKeys: number;
  totalMissing: number;
  totalEmpty: number;
}

function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

function unflattenObject(flat: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

function run(): Report {
  const report: Report = { missingKeys: [], emptyValues: [], totalKeys: 0, totalMissing: 0, totalEmpty: 0 };

  // Discover namespaces from reference language
  const nsFiles = fs.readdirSync(path.join(LOCALES_DIR, REFERENCE_LANG))
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));

  for (const ns of nsFiles) {
    const refPath = path.join(LOCALES_DIR, REFERENCE_LANG, `${ns}.json`);
    const refData = JSON.parse(fs.readFileSync(refPath, 'utf-8'));
    const refFlat = flattenObject(refData);
    const refKeys = Object.keys(refFlat);
    report.totalKeys += refKeys.length;

    for (const lang of LANGUAGES) {
      if (lang === REFERENCE_LANG) continue;

      const langPath = path.join(LOCALES_DIR, lang, `${ns}.json`);
      if (!fs.existsSync(langPath)) {
        report.missingKeys.push({ lang, ns, keys: ['ENTIRE FILE MISSING'] });
        report.totalMissing += refKeys.length;
        if (FIX_MODE) {
          // Copy reference file as placeholder
          fs.mkdirSync(path.dirname(langPath), { recursive: true });
          fs.copyFileSync(refPath, langPath);
          console.log(`📝 Created ${lang}/${ns}.json (copy of ${REFERENCE_LANG})`);
        }
        continue;
      }

      const langData = JSON.parse(fs.readFileSync(langPath, 'utf-8'));
      const langFlat = flattenObject(langData);

      // Check missing keys
      const missing = refKeys.filter(k => !(k in langFlat));
      if (missing.length > 0) {
        report.missingKeys.push({ lang, ns, keys: missing });
        report.totalMissing += missing.length;

        if (FIX_MODE) {
          for (const key of missing) {
            langFlat[key] = `[TODO:${lang.toUpperCase()}] ${refFlat[key]}`;
          }
          const unflattened = unflattenObject(langFlat);
          fs.writeFileSync(langPath, JSON.stringify(unflattened, null, 2) + '\n', 'utf-8');
          console.log(`📝 Added ${missing.length} missing keys to ${lang}/${ns}.json`);
        }
      }

      // Check empty values
      const empty = Object.entries(langFlat)
        .filter(([, v]) => v === '' || v === null || v === undefined)
        .map(([k]) => k);
      if (empty.length > 0) {
        report.emptyValues.push({ lang, ns, keys: empty });
        report.totalEmpty += empty.length;
      }
    }
  }

  return report;
}

// Run
const report = run();

console.log('\n═══════════════════════════════════════════');
console.log('  📊 i18n Completeness Report');
console.log('═══════════════════════════════════════════\n');
console.log(`  Total keys (reference: ${REFERENCE_LANG}): ${report.totalKeys}`);
console.log(`  Missing keys: ${report.totalMissing}`);
console.log(`  Empty values: ${report.totalEmpty}`);

if (report.missingKeys.length > 0) {
  console.log('\n❌ Missing Keys:');
  for (const entry of report.missingKeys) {
    console.log(`  ${entry.lang}/${entry.ns}: ${entry.keys.length} key(s)`);
    entry.keys.slice(0, 5).forEach(k => console.log(`    - ${k}`));
    if (entry.keys.length > 5) console.log(`    ... and ${entry.keys.length - 5} more`);
  }
}

if (report.emptyValues.length > 0) {
  console.log('\n⚠️ Empty Values:');
  for (const entry of report.emptyValues) {
    console.log(`  ${entry.lang}/${entry.ns}: ${entry.keys.length} key(s)`);
    entry.keys.slice(0, 5).forEach(k => console.log(`    - ${k}`));
  }
}

if (report.totalMissing === 0 && report.totalEmpty === 0) {
  console.log('\n✅ All translations are complete!');
}

console.log('');

// Exit with error code if incomplete (useful for CI)
if (report.totalMissing > 0) {
  process.exit(1);
}
