import { useTranslation } from 'react-i18next';
import { useUserPreferences } from '@/stores/globalStore';
import i18n from '@/lib/i18n';

export const useLanguage = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const { language, updateLanguage } = useUserPreferences();

  const changeLanguage = (newLanguage: 'fr' | 'en' | 'es') => {
    updateLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  const getCurrentLanguage = () => language;

  const getLanguageName = (lang: string) => {
    const languageNames = {
      fr: 'Français',
      en: 'English',
      es: 'Español'
    };
    return languageNames[lang as keyof typeof languageNames] || lang;
  };

  return {
    t,
    language,
    changeLanguage,
    getCurrentLanguage,
    getLanguageName,
    isReady: i18nInstance.isInitialized
  };
};