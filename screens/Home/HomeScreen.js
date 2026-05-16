import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";

export default function HomeScreen({ navigation }) {
  const { t, isRTL } = useLanguage();
  const { THEME, isDark } = useTheme();

  const [user,       setUser]       = useState(null);
  const [stats,      setStats]      = useState({ ordersInProgress: 0, trainingsDone: 0, totalOrdered: 0 });
  const [points,     setPoints]     = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) setUser(JSON.parse(userData));

      try {
        const statsRes = await api.get("/epicier/stats");
        if (statsRes.data?.success) {
          setStats({
            ordersInProgress: statsRes.data.ordersInProgress ?? 0,
            trainingsDone:    statsRes.data.trainingsDone    ?? 0,
            totalOrdered:     statsRes.data.totalOrdered     ?? 0,
          });
        }
      } catch (_) {}

      try {
        const pointsRes = await api.get("/points");
        if (pointsRes.data?.success) setPoints(pointsRes.data.total ?? 0);
      } catch (_) {}

      try {
        const notifRes = await api.get("/notifications/unread-count");
        if (notifRes.data?.success) setNotifCount(notifRes.data.count ?? 0);
      } catch (_) {}

    } catch (error) {
      console.error("HomeScreen loadData error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const displayName = user
    ? (user.prenom || user.nom)
      ? `${user.prenom ?? ""} ${user.nom ?? ""}`.trim()
      : user.email?.split("@")[0]
    : "...";

  // Couleurs dynamiques selon le thème
  const headerGradient = isDark
    ? ["#1A2E1A", "#2E4A2E"]
    : ["#3E2510", "#5C3D1E"];

  const C = {
    yellow:      "#F5C518",
    yellowDark:  "#D4A200",
    yellowLight: isDark ? "#3A3000" : "#FFF3C0",
    yellowSoft:  isDark ? "#2A2500" : "#FFF8E7",
    brownMid:    isDark ? "#4CAF50" : "#7A5230",
    recoTag1:    isDark ? "#4CAF50" : "#7A5230",
    recoTag2:    isDark ? "#FFB74D" : "#D4A200",
  };

  const styles = makeStyles(THEME, isDark, C);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.primary]} />}
      >
        {/* HEADER */}
        <LinearGradient
          colors={headerGradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={[styles.headerTop, isRTL && { flexDirection: "row-reverse" }]}>
            <View>
              <Text style={[styles.greeting, isRTL && { textAlign: "right" }]}>{t("hello")}</Text>
              <Text style={[styles.name,     isRTL && { textAlign: "right" }]}>{displayName}</Text>
              <Text style={[styles.tagline,  isRTL && { textAlign: "right" }]}>{t("welcome_back")}</Text>
            </View>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation?.navigate?.("Notifications")}
            >
              <Ionicons name="notifications-outline" size={20} color="#FFF3C0" />
              {notifCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {notifCount > 99 ? "99+" : notifCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Carte points */}
          <View style={[styles.loyaltyCard, isRTL && { flexDirection: "row-reverse" }]}>
            <View>
              <Text style={[styles.loyaltyLabel, isRTL && { textAlign: "right" }]}>
                ⭐ {t("loyalty_points")}
              </Text>
              <Text style={[styles.loyaltyPoints, isRTL && { textAlign: "right" }]}>
                {points} pts
              </Text>
            </View>
            <TouchableOpacity
              style={styles.starBadge}
              onPress={() => navigation?.navigate?.("Points")}
            >
              <Ionicons name="star" size={22} color={isDark ? "#1A2E1A" : "#3E2510"} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* APERÇU RAPIDE */}
        <Text style={[styles.sectionTitle, isRTL && { textAlign: "right" }]}>
          {t("quick_overview")}
        </Text>
        <View style={styles.statsContainer}>
          <StatCard title={t("orders_in_progress")} icon="cart-outline"   value={stats.ordersInProgress} THEME={THEME} isDark={isDark} C={C} />
          <StatCard title={t("trainings_done")}     icon="school-outline" value={stats.trainingsDone}    THEME={THEME} isDark={isDark} C={C} />
          <StatCard title={t("total_ordered")}      icon="wallet-outline" value={`${stats.totalOrdered} DH`} THEME={THEME} isDark={isDark} C={C} />
        </View>

        {/* ACTIONS RAPIDES */}
        <Text style={[styles.sectionTitle, isRTL && { textAlign: "right" }]}>
          {t("quick_actions")}
        </Text>
        <View style={styles.actionsContainer}>
          <ActionCard title={t("suppliers")} icon="people-outline" accent={false} onPress={() => navigation?.navigate?.("Fournisseurs")} THEME={THEME} isDark={isDark} C={C} />
          <ActionCard title={t("orders")}    icon="cart-outline"   accent={false} onPress={() => navigation?.navigate?.("Commandes")}    THEME={THEME} isDark={isDark} C={C} />
          <ActionCard title={t("trainings")} icon="school-outline" accent={true}  onPress={() => navigation?.navigate?.("Formations")}   THEME={THEME} isDark={isDark} C={C} />
          <ActionCard title={t("history")}   icon="time-outline"   accent={true}  onPress={() => navigation?.navigate?.("Historique")}   THEME={THEME} isDark={isDark} C={C} />
        </View>

        {/* RECOMMANDATIONS */}
        <View style={[styles.rowBetween, isRTL && { flexDirection: "row-reverse" }]}>
          <Text style={styles.sectionTitle}>{t("recommendations")}</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>{t("see_all")}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 8 }}
        >
          <RecommendationCard
            tag={t("training_label")} title="Gestion efficace du client"
            sub={t("beginner")}       tagColor={C.recoTag1}
            bgFrom={isDark ? "#2E4A2E" : "#5C3D1E"} bgTo={isDark ? "#1A2E1A" : "#3E2510"}
            onNavigate={() => navigation?.navigate?.("Formations")}
            THEME={THEME} isDark={isDark} C={C}
          />
          <RecommendationCard
            tag={t("product_label")}  title="Produit Conseil Pro"
            sub={t("recommended")}    tagColor={C.recoTag2}
            bgFrom={isDark ? "#3A2800" : "#A0784A"} bgTo={isDark ? "#2E4A2E" : "#5C3D1E"}
            onNavigate={() => navigation?.navigate?.("Fournisseurs")}
            THEME={THEME} isDark={isDark} C={C}
          />
          <RecommendationCard
            tag={t("module_label")}   title="Stratégie de vente avancée"
            sub={t("intermediate")}   tagColor={C.recoTag1}
            bgFrom={isDark ? "#2A3A2A" : "#C4956A"} bgTo={isDark ? "#1E2E1E" : "#7A5230"}
            onNavigate={() => navigation?.navigate?.("Formations")}
            THEME={THEME} isDark={isDark} C={C}
          />
        </ScrollView>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Composants ────────────────────────────────────────────────────

const StatCard = ({ title, icon, value, THEME, isDark, C }) => (
  <View style={{
    flex: 1, backgroundColor: THEME.card, borderRadius: 16, padding: 14,
    alignItems: "center", borderWidth: 1, borderColor: THEME.border, elevation: 2,
  }}>
    <View style={{
      width: 46, height: 46, borderRadius: 23,
      backgroundColor: isDark ? "#1B3A1B" : "#FFF3C0",
      alignItems: "center", justifyContent: "center", marginBottom: 8,
    }}>
      <Ionicons name={icon} size={24} color={THEME.primary} />
    </View>
    <Text style={{ fontSize: 18, fontWeight: "800", color: THEME.text }}>{value ?? 0}</Text>
    <Text style={{ fontSize: 10, textAlign: "center", color: THEME.textSecondary, marginTop: 3, fontWeight: "600", lineHeight: 14 }}>{title}</Text>
  </View>
);

const ActionCard = ({ title, icon, accent, onPress, THEME, isDark, C }) => (
  <TouchableOpacity
    style={{
      width: "47%", height: 100,
      backgroundColor: accent
        ? (isDark ? "#1A2500" : "#FFF8E7")
        : THEME.card,
      borderRadius: 18, padding: 14, overflow: "hidden",
      borderWidth: accent ? 1.5 : 1,
      borderColor: accent ? (isDark ? "#3A4A00" : "#F5C518") : THEME.border,
      justifyContent: "flex-end", elevation: 2,
    }}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <Ionicons
      name={icon} size={58}
      color={accent
        ? "rgba(245,197,24,0.22)"
        : isDark ? "rgba(76,175,80,0.12)" : "rgba(92,61,30,0.08)"}
      style={{ position: "absolute", bottom: -8, right: -8 }}
    />
    <Text style={{ fontWeight: "800", fontSize: 14, color: THEME.text }}>{title}</Text>
    <View style={{
      width: 6, height: 6, borderRadius: 3, marginTop: 6,
      backgroundColor: accent ? "#F5C518" : THEME.border,
    }} />
  </TouchableOpacity>
);

const RecommendationCard = ({ tag, title, sub, tagColor, bgFrom, bgTo, onNavigate, THEME, isDark, C }) => (
  <View style={{
    width: 162, backgroundColor: THEME.card, borderRadius: 18,
    overflow: "hidden", borderWidth: 1, borderColor: THEME.border, elevation: 3,
  }}>
    <LinearGradient colors={[bgFrom, bgTo]} style={{ width: "100%", height: 90, overflow: "hidden" }}>
      <View style={{ position: "absolute", width: 65, height: 65, top: -18, right: -18, borderRadius: 999, backgroundColor: "rgba(245,197,24,0.3)" }} />
      <View style={{ position: "absolute", width: 38, height: 38, bottom: 6, left: 6, borderRadius: 999, backgroundColor: "rgba(245,197,24,0.25)", opacity: 0.25 }} />
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: "#F5C518", opacity: 0.85 }} />
    </LinearGradient>
    <View style={{ padding: 10 }}>
      <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 0.6, marginBottom: 4, textTransform: "uppercase", color: tagColor }}>{tag}</Text>
      <Text style={{ fontSize: 12, fontWeight: "800", color: THEME.text, lineHeight: 16 }}>{title}</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <Text style={{ fontSize: 10, color: THEME.textSecondary, fontWeight: "600" }}>{sub}</Text>
        <TouchableOpacity
          style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: isDark ? "#1B3A1B" : "#FFF3C0", alignItems: "center", justifyContent: "center" }}
          onPress={onNavigate}
        >
          <Ionicons name="arrow-forward" size={11} color={THEME.primary} />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// ── Styles ────────────────────────────────────────────────────────

const makeStyles = (THEME, isDark, C) => StyleSheet.create({
  safe:             { flex: 1, backgroundColor: THEME.background },
  container:        { flex: 1, backgroundColor: THEME.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: THEME.background },

  header:    { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greeting:  { color: "rgba(255,243,192,0.75)", fontSize: 13, fontWeight: "600" },
  name:      { color: "#FFFFFF", fontSize: 28, fontWeight: "800", marginTop: 2 },
  tagline:   { color: "rgba(255,243,192,0.55)", fontSize: 12, marginTop: 2 },
  notifBtn:  { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  notifBadge:     { position: "absolute", top: -2, right: -2, backgroundColor: C.yellow, borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: isDark ? "#1A2E1A" : "#3E2510", paddingHorizontal: 2 },
  notifBadgeText: { fontSize: 9, fontWeight: "800", color: isDark ? "#1A2E1A" : "#3E2510" },

  loyaltyCard:   { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#FFFFFF", borderRadius: 18, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.12)" : "#DDD0BA" },
  loyaltyLabel:  { fontSize: 12, color: isDark ? "rgba(255,243,192,0.7)" : "#8B6B4A", fontWeight: "600" },
  loyaltyPoints: { fontSize: 22, fontWeight: "800", color: isDark ? "#F0F0F0" : "#3E2510", marginTop: 2 },
  starBadge:     { width: 44, height: 44, borderRadius: 22, backgroundColor: C.yellow, alignItems: "center", justifyContent: "center" },

  sectionTitle:   { fontSize: 16, fontWeight: "800", color: THEME.text, marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  statsContainer: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, gap: 10 },
  actionsContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12 },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingRight: 16, marginTop: 4 },
  seeAll:     { fontSize: 12, color: THEME.textSecondary, fontWeight: "700", marginTop: 20 },
});