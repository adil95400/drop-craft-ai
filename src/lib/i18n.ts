import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations - Common
import commonFr from '@/locales/fr/common.json';
import commonEn from '@/locales/en/common.json';
import commonEs from '@/locales/es/common.json';
import commonDe from '@/locales/de/common.json';

// Settings
import settingsFr from '@/locales/fr/settings.json';
import settingsEn from '@/locales/en/settings.json';
import settingsEs from '@/locales/es/settings.json';
import settingsDe from '@/locales/de/settings.json';

// Navigation
import navigationFr from '@/locales/fr/navigation.json';
import navigationEn from '@/locales/en/navigation.json';
import navigationEs from '@/locales/es/navigation.json';
import navigationDe from '@/locales/de/navigation.json';

// Dashboard
import dashboardFr from '@/locales/fr/dashboard.json';
import dashboardEn from '@/locales/en/dashboard.json';
import dashboardEs from '@/locales/es/dashboard.json';
import dashboardDe from '@/locales/de/dashboard.json';

// Products
import productsFr from '@/locales/fr/products.json';
import productsEn from '@/locales/en/products.json';
import productsEs from '@/locales/es/products.json';
import productsDe from '@/locales/de/products.json';

// Orders
import ordersFr from '@/locales/fr/orders.json';
import ordersEn from '@/locales/en/orders.json';
import ordersEs from '@/locales/es/orders.json';
import ordersDe from '@/locales/de/orders.json';

// Suppliers
import suppliersFr from '@/locales/fr/suppliers.json';
import suppliersEn from '@/locales/en/suppliers.json';
import suppliersEs from '@/locales/es/suppliers.json';
import suppliersDe from '@/locales/de/suppliers.json';

// Marketing
import marketingFr from '@/locales/fr/marketing.json';
import marketingEn from '@/locales/en/marketing.json';
import marketingEs from '@/locales/es/marketing.json';
import marketingDe from '@/locales/de/marketing.json';

// Monitoring
import monitoringFr from '@/locales/fr/monitoring.json';
import monitoringEn from '@/locales/en/monitoring.json';
import monitoringEs from '@/locales/es/monitoring.json';
import monitoringDe from '@/locales/de/monitoring.json';

// Fulfillment
import fulfillmentFr from '@/locales/fr/fulfillment.json';
import fulfillmentEn from '@/locales/en/fulfillment.json';
import fulfillmentEs from '@/locales/es/fulfillment.json';
import fulfillmentDe from '@/locales/de/fulfillment.json';

// Channels
import channelsFr from '@/locales/fr/channels.json';
import channelsEn from '@/locales/en/channels.json';
import channelsEs from '@/locales/es/channels.json';
import channelsDe from '@/locales/de/channels.json';

// Audit
import auditFr from '@/locales/fr/audit.json';
import auditEn from '@/locales/en/audit.json';
import auditEs from '@/locales/es/audit.json';
import auditDe from '@/locales/de/audit.json';

// Auth
import authFr from '@/locales/fr/auth.json';
import authEn from '@/locales/en/auth.json';
import authEs from '@/locales/es/auth.json';
import authDe from '@/locales/de/auth.json';

const resources = {
  fr: {
    common: commonFr,
    settings: settingsFr,
    navigation: navigationFr,
    dashboard: dashboardFr,
    products: productsFr,
    orders: ordersFr,
    suppliers: suppliersFr,
    marketing: marketingFr,
    monitoring: monitoringFr,
    fulfillment: fulfillmentFr,
    channels: channelsFr,
    audit: auditFr,
    auth: authFr,
  },
  en: {
    common: commonEn,
    settings: settingsEn,
    navigation: navigationEn,
    dashboard: dashboardEn,
    products: productsEn,
    orders: ordersEn,
    suppliers: suppliersEn,
    marketing: marketingEn,
    monitoring: monitoringEn,
    fulfillment: fulfillmentEn,
    channels: channelsEn,
    audit: auditEn,
    auth: authEn,
  },
  es: {
    common: commonEs,
    settings: settingsEs,
    navigation: navigationEs,
    dashboard: dashboardEs,
    products: productsEs,
    orders: ordersEs,
    suppliers: suppliersEs,
    marketing: marketingEs,
    monitoring: monitoringEs,
    fulfillment: fulfillmentEs,
    channels: channelsEs,
    audit: auditEs,
    auth: authEs,
  },
  de: {
    common: commonDe,
    settings: settingsDe,
    navigation: navigationDe,
    dashboard: dashboardDe,
    products: productsDe,
    orders: ordersDe,
    suppliers: suppliersDe,
    marketing: marketingDe,
    monitoring: monitoringDe,
    fulfillment: fulfillmentDe,
    channels: channelsDe,
    audit: auditDe,
    auth: authDe,
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
