import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/translation.json';
import uk from './locales/uk/translation.json';
import pl from './locales/pl/translation.json';

const savedLang = localStorage.getItem('userLang') || 'en';

i18n
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        resources: {
            en: { translation: en },
            uk: { translation: uk },
            pl: { translation: pl }
        },
        lng: savedLang,
        interpolation: {
            escapeValue: false
        }
    });

i18n.on("languageChanged", (lng) => {
    localStorage.setItem('userLang', lng);
});

export default i18n;