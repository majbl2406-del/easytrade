import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useLanguage } from "../i18n/LanguageContext";

const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇲🇦" },
  { code: "en", label: "English",  flag: "🇬🇧" },
];

const C = {
  brown:      "#5C3D1E",
  brownDark:  "#3E2510",
  yellow:     "#F5C518",
  yellowLight:"#FFF3C0",
  beige:      "#F5EFE6",
  white:      "#FFFFFF",
  beigeBorder:"#DDD0BA",
  textMuted:  "#8B6B4A",
};

export default function LanguageSelector() {
  const { locale, changeLanguage, t } = useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("choose_language")}</Text>
      <View style={styles.row}>
        {LANGUAGES.map((lang) => {
          const isActive = locale === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.btn, isActive && styles.btnActive]}
              onPress={() => changeLanguage(lang.code)}
              activeOpacity={0.8}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: C.textMuted,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.beigeBorder,
    gap: 4,
  },
  btnActive: {
    backgroundColor: C.yellowLight,
    borderColor: C.yellow,
  },
  flag: {
    fontSize: 22,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: C.brownDark,
    textAlign: "center",
  },
  labelActive: {
    color: C.brown,
  },
});
