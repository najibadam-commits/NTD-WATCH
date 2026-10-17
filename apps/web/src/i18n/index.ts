import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

/**
 * Internationalisation scaffold. English only for the first milestone.
 * To add a language: add src/i18n/locales/<code>.json with the same keys and register it below.
 */
void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
  initAsync: false,
});

export default i18n;
