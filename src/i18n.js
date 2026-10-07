import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import fr from './locales/fr.json'

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('stableapp:language') : null

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: stored === 'fr' ? 'fr' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
