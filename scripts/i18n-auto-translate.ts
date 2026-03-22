#!/usr/bin/env npx tsx
/**
 * i18n Auto-Translator using Lovable AI
 * 
 * Usage: npx tsx scripts/i18n-auto-translate.ts
 * 
 * Detects missing or [TODO:XX] keys and auto-translates them
 * from the reference language (FR) using AI.
 * 
 * Requires LOVABLE_API_KEY env var.
 */

import fs from 'fs';
import path from 'path';

const LOCALES_DIR = path.resolve(__dirname, '../src/locales');
const LANGUAGES = ['en', 'es', 'de'];
const REFERENCE_LANG = 'fr';
const API_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const API_KEY = process.env.LOVABLE_API_KEY;
const BATCH_SIZE = 50; // keys per API call

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  de: 'German',
  fr: 'French',
};

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

async function translateBatch(
  keysToTranslate: Record<string, string>,
  targetLang: string
): Promise<Record<string, string>> {
  if (!API_KEY) {
    console.error('❌ LOVABLE_API_KEY not set. Set it as env var.');
    process.exit(1);
  }

  const prompt = `Translate the following JSON values from French to ${LANG_NAMES[targetLang]}.
Keep the JSON keys exactly as-is. Only translate the values.
Preserve any {{variables}} placeholders exactly.
Return ONLY valid JSON, no markdown or explanation.

${JSON.stringify(keysToTranslate, null, 2)}`;

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: 'You are a professional translator for a SaaS e-commerce platform. Translate accurately and concisely. Keep technical terms (API, CRM, SEO, etc.) as-is.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!resp.ok) {
    throw new Error(`API error ${resp.status}: ${await resp.text()}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Could not parse JSON from AI response: ${content.slice(0, 200)}`);

  return JSON.parse(jsonMatch[0]);
}

async function main() {
  console.log('🌐 i18n Auto-Translator\n');

  const nsFiles = fs.readdirSync(path.join(LOCALES_DIR, REFERENCE_LANG))
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));

  let totalTranslated = 0;

  for (const lang of LANGUAGES) {
    for (const ns of nsFiles) {
      const refPath = path.join(LOCALES_DIR, REFERENCE_LANG, `${ns}.json`);
      const langPath = path.join(LOCALES_DIR, lang, `${ns}.json`);

      const refData = JSON.parse(fs.readFileSync(refPath, 'utf-8'));
      const refFlat = flattenObject(refData);

      let langFlat: Record<string, any> = {};
      if (fs.existsSync(langPath)) {
        const langData = JSON.parse(fs.readFileSync(langPath, 'utf-8'));
        langFlat = flattenObject(langData);
      }

      // Find keys needing translation (missing or [TODO:XX] placeholder)
      const toTranslate: Record<string, string> = {};
      for (const [key, value] of Object.entries(refFlat)) {
        if (!(key in langFlat) || String(langFlat[key]).startsWith('[TODO:')) {
          toTranslate[key] = String(value);
        }
      }

      if (Object.keys(toTranslate).length === 0) continue;

      console.log(`📝 ${lang}/${ns}: ${Object.keys(toTranslate).length} keys to translate...`);

      // Process in batches
      const keys = Object.keys(toTranslate);
      for (let i = 0; i < keys.length; i += BATCH_SIZE) {
        const batchKeys = keys.slice(i, i + BATCH_SIZE);
        const batch: Record<string, string> = {};
        batchKeys.forEach(k => batch[k] = toTranslate[k]);

        try {
          const translations = await translateBatch(batch, lang);
          for (const [key, value] of Object.entries(translations)) {
            langFlat[key] = value;
          }
          totalTranslated += Object.keys(translations).length;
          console.log(`  ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${Object.keys(translations).length} keys`);
        } catch (err) {
          console.error(`  ❌ Batch failed:`, err);
          // Mark as TODO so we can retry later
          batchKeys.forEach(k => langFlat[k] = `[TODO:${lang.toUpperCase()}] ${toTranslate[k]}`);
        }

        // Rate limit delay
        await new Promise(r => setTimeout(r, 1500));
      }

      // Save
      const unflattened = unflattenObject(langFlat);
      fs.writeFileSync(langPath, JSON.stringify(unflattened, null, 2) + '\n', 'utf-8');
    }
  }

  console.log(`\n✅ Done! Translated ${totalTranslated} keys total.`);
}

main().catch(console.error);
