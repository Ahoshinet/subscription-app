import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ja from './locales/ja.json';

const resources = {
    en: { translation: en },
    ja: { translation: ja },
};

// eslint-disable-next-line import/no-named-as-default-member -- i18n.use() is i18next's documented plugin API, not the named `use` export
void i18n
    .use(initReactI18next)
    .init({
        resources,
        compatibilityJSON: 'v4', // Required for React Native compatibility without Intl polyfill
        lng: 'en', // Default initial language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already safe from XSS
        },
    });

export default i18n;
