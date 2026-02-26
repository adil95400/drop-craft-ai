/**
 * @module dateFnsLocale
 * @description Resolves the current i18next language to a date-fns locale object.
 * Provides a reactive hook and a static getter for use outside React components.
 */
import type { Locale } from 'date-fns';
import { fr, enUS, es, de } from 'date-fns/locale';
import i18n from '@/lib/i18n';

const LOCALE_MAP: Record<string, Locale> = {
  fr,
  en: enUS,
  es,
  de,
};

/** Get the date-fns locale matching the current i18next language */
export function getDateFnsLocale(): Locale {
  return LOCALE_MAP[i18n.language] ?? fr;
}

/** Get the Intl locale string (e.g. 'fr-FR', 'en-US') matching the current i18next language */
export function getIntlLocale(): string {
  const map: Record<string, string> = {
    fr: 'fr-FR',
    en: 'en-US',
    es: 'es-ES',
    de: 'de-DE',
  };
  return map[i18n.language] ?? 'fr-FR';
}
