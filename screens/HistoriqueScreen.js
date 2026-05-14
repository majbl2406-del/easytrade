import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { THEME } from '../theme';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

// ─── Config par type d'activité ───────────────────────────────────
const TYPE_CONFIG = {
  commande: {
    color: '#4169E1',
    bgColor: '#EEF2FF',
    icon: 'shopping-cart',
  },
  points: {
    color: '#F5A623',
    bgColor: '#FFF8E7',
    icon: 'star',
  },
  formation: {
    color: '#27AE60',
    bgColor: '#EAFAF1',
    icon: 'school',
  },
};

export default function HistoriqueScreen() {
  const { t, isRTL } = useLanguage();

  const [activites, setActivites] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filtre, setFiltre] = useState('tous');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ─── Filtres traduits ─────────────────────────────
  const FILTRES = [
    { key: 'tous', label: t('all_history') },
    { key: 'commande', label: t('orders_history') },
    { key: 'points', label: t('points_history') },
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

  useEffect(() => {
    loadActivites();
  }, [loadActivites]);

  // Filtre
  useEffect(() => {
    if (filtre === 'tous') {
      setFiltered(activites);
    } else {
      setFiltered(activites.filter(a => a.type === filtre));
    }
  }, [filtre, activites]);

  const onRefresh = () => {
    setRefreshing(true);
    loadActivites();
  };

  // Date formatée + traduite
 const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);

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
        description: item.description, // "FournisseurNom — 200 DH" reste tel quel
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

  const renderItem = ({ item, index }) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.commande;
    const isLast = index === filtered.length - 1;
    const { titre, description } = formatItem(item);

    return (
      <View style={[styles.itemRow, isRTL && { flexDirection: 'row-reverse' }]}>
        <View style={styles.timelineCol}>
          <View style={[styles.dot, { backgroundColor: config.color }]} />
          {!isLast && <View style={styles.line} />}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: config.bgColor }]}>
              <MaterialIcons  name={config.icon} size={20} color={config.color} />
            </View>

            <View style={{ flex: 1, marginHorizontal: 10 }}>
              <Text style={styles.titre}>{titre}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
          </View>

          <Text style={styles.date}>🕐 {formatDate(item.date)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.filtresRow}>
            {FILTRES.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filtreBtn,
                  filtre === f.key && styles.filtreBtnActive,
                ]}
                onPress={() => setFiltre(f.key)}
              >
                <Text
                  style={[
                    styles.filtreText,
                    filtre === f.key && styles.filtreTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons  name="history" size={70} color={THEME.gray} />
            <Text style={styles.emptyTitle}>{t('no_activity')}</Text>
            <Text style={styles.emptyText}>{t('activities_here')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles (inchangés sauf texte) ─────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: THEME.gray },

  list: { padding: 16 },

  filtresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  filtreBtn: { padding: 8, borderRadius: 20, backgroundColor: '#eee' },
  filtreBtnActive: { backgroundColor: THEME.primary },
  filtreText: { color: '#555' },
  filtreTextActive: { color: '#fff' },

  itemRow: { flexDirection: 'row', marginBottom: 10 },
  timelineCol: { width: 30, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  line: { width: 2, flex: 1, backgroundColor: '#ddd' },

  card: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },

  iconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  titre: { fontWeight: 'bold' },
  description: { fontSize: 12, color: '#666' },
  date: { fontSize: 11, color: '#999', marginTop: 5 },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold' },
  emptyText: { color: '#777', marginTop: 5 },
});