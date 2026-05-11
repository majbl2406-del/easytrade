import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";
import { translate } from "./i18n";

const LanguageContext = createContext();

const RTL_LANGUAGES = ["ar"];
const STORAGE_KEY = "app_language";

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState("fr");

  // Charger la langue sauvegardée au démarrage
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setLocale(saved);
      } catch (e) {}
    };
    load();
  }, []);

  const changeLanguage = async (lang) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}

    const isRTL = RTL_LANGUAGES.includes(lang);
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
    }

    setLocale(lang);
  };

  const t = (key, params = {}) => {
  let str = translate(locale, key);
  if (typeof str === 'string') {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(new RegExp(`{{${k}}}`, 'g'), v);
    });
  }
  return str;
};
  const isRTL = RTL_LANGUAGES.includes(locale);

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage doit être utilisé dans LanguageProvider");
  return ctx;
};
