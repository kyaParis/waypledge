import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './translations/en.json';
import es from './translations/es.json';
import fr from './translations/fr.json';
import zh from './translations/zh.json';
import nl from './translations/nl.json';

const LANGUAGE_KEY = '@waypledge_language';

export const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  nl: { translation: nl },
  zh: { translation: zh },
};

// Get saved language or detect from device
const getInitialLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage && resources[savedLanguage as keyof typeof resources]) {
      return savedLanguage;
    }
  } catch (error) {
    console.log('Error reading language preference:', error);
  }
  
  // Detect device language
  const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
  
  // Check if we support the device language
  if (resources[deviceLanguage as keyof typeof resources]) {
    return deviceLanguage;
  }
  
  return 'en'; // Default to English
};

// Save language preference
export const setLanguage = async (languageCode: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
    await i18n.changeLanguage(languageCode);
  } catch (error) {
    console.log('Error saving language preference:', error);
  }
};

// Get current language
export const getCurrentLanguage = () => {
  return i18n.language || 'en';
};

// Initialize i18n
const initI18n = async () => {
  const initialLanguage = await getInitialLanguage();
  
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
    
  return i18n;
};

// Initialize immediately
initI18n();

export default i18n;
