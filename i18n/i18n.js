// ✅ Pas de dépendance externe — fonctionne avec n'importe quelle version Expo
import fr from "./fr.json";
import ar from "./ar.json";
import en from "./en.json";

const translations = { fr, ar, en };

export function translate(locale, key) {
  const dict = translations[locale] || translations["fr"];
  return dict[key] || key;
}

export default translations;
