/**
 * @module useDateFnsLocale
 * @description React hook that returns the date-fns locale matching the current i18n language.
 * Re-renders automatically when the language changes.
 */
import { useTranslation } from 'react-i18next';
import type { Locale } from 'date-fns';
import { fr, enUS, es, de } from 'date-fns/locale';

const LOCALE_MAP: Record<string, Locale> = {
  fr,
  en: enUS,
  es,
  de,
};

export function useDateFnsLocale(): Locale {
  const { i18n } = useTranslation();
  return LOCALE_MAP[i18n.language] ?? fr;
}
