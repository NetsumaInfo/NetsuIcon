import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/app.json';
import fr from './locales/fr/app.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'app';
    resources: { app: typeof fr };
  }
}

void i18n.use(initReactI18next).init({
  resources: { fr: { app: fr }, en: { app: en } },
  // English until the server says which language was chosen: by the user here, or by the agent.
  lng: 'en',
  fallbackLng: 'fr',
  defaultNS: 'app',
  interpolation: { escapeValue: false },
});

export default i18n;
