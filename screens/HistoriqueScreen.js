import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

// ─── Config par type d'activité ───────────────────────────────────
const TYPE_CONFIG = {
  commande: { color: '#4169E1', bgColorLight: '#EEF2FF', bgColorDark: '#1a2340', icon: 'shopping-cart' },
  points:   { color: '#F5A623', bgColorLight: '#FFF8E7', bgColorDark: '#2e2410', icon: 'star' },
  formation:{ color: '#27AE60', bgColorLight: '#EAFAF1', bgColorDark: '#0f2a1a', icon: 'school' },
};

export default function HistoriqueScreen() {
  const { t, isRTL } = useLanguage();
  const { THEME, isDark } = useTheme();

  const [activites, setActivites] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filtre, setFiltre] = useState('tous');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const FILTRES = [
    { key: 'tous',      label: t('all_history') },
    { key: 'commande',  label: t('orders_history') },
    { key: 'points',    label: t('points_history') },
    { key: 'formation', label: t('formations_history') },
  ];

  const loadActivites = useCallback(async () => {
    try {
      const res = await api.get('/epicier/activites');
      if (res.data?.success) {
        setActivites(res.data.activites || []);
        setFiltered(res.data.activites || []);
      }
    } catch (error) {
      console.error('Erreur chargement activités:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadActivites(); }, [loadActivites]);

  useEffect(() => {
    if (filtre === 'tous') {
      setFiltered(activites);
    } else {
      setFiltered(activites.filter(a => a.type === filtre));
    }
  }, [filtre, activites]);

  const onRefresh = () => { setRefreshing(true); loadActivites(); };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    const now = new Date();
    const diffMs   = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffH    = Math.floor(diffMs / 3600000);
    const diffD    = Math.floor(diffMs / 86400000);
    if (diffMins < 1)  return t('just_now');
    if (diffMins < 60) return t('minutes_ago', { count: diffMins });
    if (diffH < 24)    return t('hours_ago', { count: diffH });
    if (diffD < 7)     return t(diffD > 1 ? 'days_ago_plural' : 'days_ago', { count: diffD });
    return date.toLocaleDateString();
  };

  const formatItem = (item) => {
    switch (item.type) {
      case 'commande':
        return {
          titre: `${t('orders_history')} #${item.id.replace('commande_', '').slice(-5).toUpperCase()}`,
          description: item.description,
        };
      case 'points':
        const pts = item.rawPoints ?? (item.titre?.includes('+') ? 1 : -1);
        return {
          titre: pts > 0
            ? `+${Math.abs(pts)} ${t('points_gained')}`
            : `-${Math.abs(pts)} ${t('points_used')}`,
          description: t('loyalty_points'),
        };
      case 'formation':
        return {
          titre: item.formationTitre || item.titre,
          description: item.completed
            ? t('formation_done')
            : t('formation_progress', { count: item.progression || 0 }),
        };
      default:
        return { titre: item.titre, description: item.description };
    }
  };

  const styles = makeStyles(THEME, isDark);

  const renderItem = ({ item, index }) => {
    const config  = TYPE_CONFIG[item.type] || TYPE_CONFIG.commande;
    const isLast  = index === filtered.length - 1;
    const { titre, description } = formatItem(item);
    const iconBg  = isDark ? config.bgColorDark : config.bgColorLight;

    return (
      <View style={[styles.itemRow, isRTL && { flexDirection: 'row-reverse' }]}>
        <View style={styles.timelineCol}>
          <View style={[styles.dot, { backgroundColor: config.color }]} />
          {!isLast && <View style={styles.line} />}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              <MaterialIcons name={config.icon} size={20} color={config.color} />
            </View>
            <View style={{ flex: 1, marginHorizontal: 10 }}>
              <Text style={[styles.titre, isRTL && { textAlign: 'right' }]}>{titre}</Text>
              <Text style={[styles.description, isRTL && { textAlign: 'right' }]}>{description}</Text>
            </View>
          </View>
          <Text style={styles.date}>🕐 {formatDate(item.date)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: THEME.background }]}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={styles.loadingText}>{t('loading_history')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} colors={[THEME.primary]} />
        }
        ListHeaderComponent={
          <View style={styles.filtresRow}>
            {FILTRES.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filtreBtn, filtre === f.key && styles.filtreBtnActive]}
                onPress={() => setFiltre(f.key)}
              >
                <Text style={[styles.filtreText, filtre === f.key && styles.filtreTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={70} color={THEME.border} />
            <Text style={styles.emptyTitle}>{t('no_activity')}</Text>
            <Text style={styles.emptyText}>{t('activities_here')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const makeStyles = (THEME, isDark) => StyleSheet.create({
  container:        { flex: 1, backgroundColor: THEME.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:      { marginTop: 10, color: THEME.textSecondary },
  list:             { padding: 16 },

  filtresRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  filtreBtn:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: THEME.inputBg, borderWidth: 1, borderColor: THEME.border },
  filtreBtnActive:  { backgroundColor: THEME.primary, borderColor: THEME.primary },
  filtreText:       { color: THEME.textSecondary, fontSize: 13, fontWeight: '600' },
  filtreTextActive: { color: '#fff' },

  itemRow:          { flexDirection: 'row', marginBottom: 10 },
  timelineCol:      { width: 30, alignItems: 'center' },
  dot:              { width: 12, height: 12, borderRadius: 6 },
  line:             { width: 2, flex: 1, backgroundColor: THEME.border },

  card:             { flex: 1, backgroundColor: THEME.card, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: THEME.border, elevation: 2 },
  cardHeader:       { flexDirection: 'row', alignItems: 'center' },
  iconWrap:         { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  titre:            { fontWeight: 'bold', color: THEME.text, fontSize: 13 },
  description:      { fontSize: 12, color: THEME.textSecondary, marginTop: 2 },
  date:             { fontSize: 11, color: THEME.gray, marginTop: 6 },

  emptyContainer:   { alignItems: 'center', marginTop: 50 },
  emptyTitle:       { fontSize: 16, fontWeight: 'bold', color: THEME.text, marginTop: 12 },
  emptyText:        { color: THEME.textSecondary, marginTop: 5 },
});