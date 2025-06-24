import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import ua from './locales/ua/translation.json';
import pl from './locales/pl/translation.json';

const savedLang = localStorage.getItem('language') || 'en';

i18n
    // .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        resources: {
            en: { translation: en },
            ua: { translation: ua },
            pl: { translation: pl }
        },
        lng: savedLang,
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;