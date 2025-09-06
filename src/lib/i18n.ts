import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import commonFr from '@/locales/fr/common.json';
import commonEn from '@/locales/en/common.json';
import commonEs from '@/locales/es/common.json';
import commonDe from '@/locales/de/common.json';

import settingsFr from '@/locales/fr/settings.json';
import settingsEn from '@/locales/en/settings.json';
import settingsEs from '@/locales/es/settings.json';
import settingsDe from '@/locales/de/settings.json';

import navigationFr from '@/locales/fr/navigation.json';
import navigationEn from '@/locales/en/navigation.json';
import navigationEs from '@/locales/es/navigation.json';
import navigationDe from '@/locales/de/navigation.json';

import dashboardFr from '@/locales/fr/dashboard.json';
import dashboardEn from '@/locales/en/dashboard.json';
import dashboardEs from '@/locales/es/dashboard.json';
import dashboardDe from '@/locales/de/dashboard.json';

const resources = {
  fr: {
    common: commonFr,
    settings: settingsFr,
    navigation: navigationFr,
    dashboard: dashboardFr,
  },
  en: {
    common: commonEn,
    settings: settingsEn,
    navigation: navigationEn,
    dashboard: dashboardEn,
  },
  es: {
    common: commonEs,
    settings: settingsEs,
    navigation: navigationEs,
    dashboard: dashboardEs,
  },
  de: {
    common: commonDe,
    settings: settingsDe,
    navigation: navigationDe,
    dashboard: dashboardDe,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    defaultNS: 'common',
    
    // Language detection
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    
    interpolation: {
      escapeValue: false,
    },
    
    // React options
    react: {
      useSuspense: false,
    },
  });

export default i18n;