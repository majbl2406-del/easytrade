import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../i18n/LanguageContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";

const C = {
  brown: "#5C3D1E", brownDark: "#3E2510", brownMid: "#7A5230", brownLight: "#A0784A",
  yellow: "#F5C518", yellowDark: "#D4A200", yellowLight: "#FFF3C0", yellowSoft: "#FFF8E7",
  beige: "#F5EFE6", beigeCard: "#FFFDF8", beigeMid: "#EDE3D3", beigeBorder: "#DDD0BA",
  white: "#FFFFFF", textPrimary: "#3E2510", textMuted: "#8B6B4A", textLight: "#B89878",
};

export default function HomeScreen({ navigation }) {
  const { t, isRTL } = useLanguage();

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.brown} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.brown]} />}
      >
        {/* HEADER */}
        <LinearGradient
          colors={[C.brownDark, C.brown]}
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
              <Ionicons name="notifications-outline" size={20} color={C.yellowLight} />
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
              <Ionicons name="star" size={22} color={C.brownDark} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* APERÇU RAPIDE */}
        <Text style={[styles.sectionTitle, isRTL && { textAlign: "right" }]}>
          {t("quick_overview")}
        </Text>
        <View style={styles.statsContainer}>
          <StatCard title={t("orders_in_progress")} icon="cart-outline"   value={stats.ordersInProgress} />
          <StatCard title={t("trainings_done")}     icon="school-outline" value={stats.trainingsDone} />
          <StatCard title={t("total_ordered")}      icon="wallet-outline" value={`${stats.totalOrdered} DH`} />
        </View>

        {/* ACTIONS RAPIDES */}
        <Text style={[styles.sectionTitle, isRTL && { textAlign: "right" }]}>
          {t("quick_actions")}
        </Text>
        <View style={styles.actionsContainer}>
          <ActionCard title={t("suppliers")} icon="people-outline" accent={false} onPress={() => navigation?.navigate?.("Fournisseurs")} />
          <ActionCard title={t("orders")}    icon="cart-outline"   accent={false} onPress={() => navigation?.navigate?.("Commandes")} />
          <ActionCard title={t("trainings")} icon="school-outline" accent={true}  onPress={() => navigation?.navigate?.("Formations")} />
          <ActionCard title={t("history")}   icon="time-outline"   accent={true}  onPress={() => navigation?.navigate?.("Historique")} />
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
            sub={t("beginner")}       tagColor={C.brownMid}   bgFrom={C.brown}      bgTo={C.brownDark}
            onNavigate={() => navigation?.navigate?.("Formations")}
          />
          <RecommendationCard
            tag={t("product_label")}  title="Produit Conseil Pro"
            sub={t("recommended")}    tagColor={C.yellowDark} bgFrom={C.brownLight} bgTo={C.brown}
            onNavigate={() => navigation?.navigate?.("Fournisseurs")}
          />
          <RecommendationCard
            tag={t("module_label")}   title="Stratégie de vente avancée"
            sub={t("intermediate")}   tagColor={C.brownMid}   bgFrom="#C4956A"      bgTo={C.brownMid}
            onNavigate={() => navigation?.navigate?.("Formations")}
          />
        </ScrollView>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Composants ────────────────────────────────────────────────────

const StatCard = ({ title, icon, value }) => (
  <View style={styles.statCard}>
    <View style={styles.statIconWrap}>
      <Ionicons name={icon} size={24} color={C.brown} />
    </View>
    <Text style={styles.statNumber}>{value ?? 0}</Text>
    <Text style={styles.statText}>{title}</Text>
  </View>
);

const ActionCard = ({ title, icon, accent, onPress }) => (
  <TouchableOpacity
    style={[styles.actionCard, accent && styles.actionCardAccent]}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <Ionicons
      name={icon} size={58}
      color={accent ? "rgba(245,197,24,0.22)" : "rgba(92,61,30,0.08)"}
      style={styles.bgIcon}
    />
    <Text style={[styles.actionTitle, accent && styles.actionTitleAccent]}>{title}</Text>
    <View style={[styles.actionDot, accent && styles.actionDotAccent]} />
  </TouchableOpacity>
);

const RecommendationCard = ({ tag, title, sub, tagColor, bgFrom, bgTo, onNavigate }) => (
  <View style={styles.recoCard}>
    <LinearGradient colors={[bgFrom, bgTo]} style={styles.recoImage}>
      <View style={[styles.recoCircle, { width: 65, height: 65, top: -18, right: -18 }]} />
      <View style={[styles.recoCircle, { width: 38, height: 38, bottom: 6, left: 6, opacity: 0.25 }]} />
      <View style={styles.recoBar} />
    </LinearGradient>
    <View style={styles.recoBody}>
      <Text style={[styles.recoTag, { color: tagColor }]}>{tag}</Text>
      <Text style={styles.recoTitle}>{title}</Text>
      <View style={styles.recoFooter}>
        <Text style={styles.recoSub}>{sub}</Text>
        <TouchableOpacity style={styles.recoArrow} onPress={onNavigate}>
          <Ionicons name="arrow-forward" size={11} color={C.brown} />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: C.beige },
  container:        { flex: 1, backgroundColor: C.beige },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.beige },

  header:     { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greeting:   { color: "rgba(255,243,192,0.75)", fontSize: 13, fontWeight: "600" },
  name:       { color: C.white, fontSize: 28, fontWeight: "800", marginTop: 2 },
  tagline:    { color: "rgba(255,243,192,0.55)", fontSize: 12, marginTop: 2 },
  notifBtn:   { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  notifBadge: { position: "absolute", top: -2, right: -2, backgroundColor: C.yellow, borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: C.brownDark, paddingHorizontal: 2 },
  notifBadgeText: { fontSize: 9, fontWeight: "800", color: C.brownDark },

  loyaltyCard:   { backgroundColor: C.white, borderRadius: 18, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: C.beigeBorder },
  loyaltyLabel:  { fontSize: 12, color: C.textMuted, fontWeight: "600" },
  loyaltyPoints: { fontSize: 22, fontWeight: "800", color: C.brownDark, marginTop: 2 },
  starBadge:     { width: 44, height: 44, borderRadius: 22, backgroundColor: C.yellow, alignItems: "center", justifyContent: "center" },

  sectionTitle:   { fontSize: 16, fontWeight: "800", color: C.textPrimary, marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  statsContainer: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, gap: 10 },
  statCard:       { flex: 1, backgroundColor: C.white, borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 1, borderColor: C.beigeBorder, elevation: 2 },
  statIconWrap:   { width: 46, height: 46, borderRadius: 23, backgroundColor: C.yellowLight, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statNumber:     { fontSize: 18, fontWeight: "800", color: C.brownDark },
  statText:       { fontSize: 10, textAlign: "center", color: C.textMuted, marginTop: 3, fontWeight: "600", lineHeight: 14 },

  actionsContainer: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12 },
  actionCard:       { width: "47%", height: 100, backgroundColor: C.white, borderRadius: 18, padding: 14, overflow: "hidden", borderWidth: 1, borderColor: C.beigeBorder, justifyContent: "flex-end", elevation: 2 },
  actionCardAccent: { backgroundColor: C.yellowSoft, borderColor: C.yellow, borderWidth: 1.5 },
  bgIcon:           { position: "absolute", bottom: -8, right: -8 },
  actionTitle:      { fontWeight: "800", fontSize: 14, color: C.brownDark },
  actionTitleAccent:{ color: C.brownMid },
  actionDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: C.beigeBorder, marginTop: 6 },
  actionDotAccent:  { backgroundColor: C.yellow },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingRight: 16, marginTop: 4 },
  seeAll:     { fontSize: 12, color: C.brownLight, fontWeight: "700", marginTop: 20 },

  recoCard:   { width: 162, backgroundColor: C.white, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: C.beigeBorder, elevation: 3 },
  recoImage:  { width: "100%", height: 90, overflow: "hidden" },
  recoCircle: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(245,197,24,0.3)" },
  recoBar:    { position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: C.yellow, opacity: 0.85 },
  recoBody:   { padding: 10 },
  recoTag:    { fontSize: 9, fontWeight: "800", letterSpacing: 0.6, marginBottom: 4, textTransform: "uppercase" },
  recoTitle:  { fontSize: 12, fontWeight: "800", color: C.brownDark, lineHeight: 16 },
  recoFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  recoSub:    { fontSize: 10, color: C.textLight, fontWeight: "600" },
  recoArrow:  { width: 20, height: 20, borderRadius: 10, backgroundColor: C.yellowLight, alignItems: "center", justifyContent: "center" },
});