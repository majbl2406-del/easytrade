import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { THEME } from '../../theme';
import api from '../../services/api';
import ScreenTransition from '../../components/ScreenTransition';
import { useLanguage } from '../../i18n/LanguageContext';

export default function PointsScreen() {
  const { t, isRTL } = useLanguage();

  const [pointsData, setPointsData] = useState({ 
    total: 0, 
    historique: [], 
    recompenses: [] 
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPointsData();
  }, []);

  const loadPointsData = async () => {
    try {
      const response = await api.get('/points');
      if (response.data.success) {
        setPointsData(response.data);
      }
    } catch (error) {
      console.error('Error loading points:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPointsData();
    setRefreshing(false);
  };

  const utiliserRecompense = async (recompense) => {
    if (pointsData.total < recompense.points) {
      Alert.alert(t('points_insufficient'), t('points_insufficient_msg'));
      return;
    }

    Alert.alert(
      t('confirm'),
      t('use_points_confirm', { count: recompense.points, nom: recompense.nom }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          onPress: async () => {
            try {
              const response = await api.post('/points/redeem', { recompenseId: recompense.id });
              if (response.data.success) {
                Alert.alert(
                  t('reward_obtained'),
                  t('reward_code_msg', { code: response.data.code }),
                  [{ text: t('ok'), onPress: () => loadPointsData() }]
                );
              }
            } catch (error) {
              Alert.alert(t('error'), t('reward_error'));
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenTransition style={styles.container}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.primary}
            colors={[THEME.primary, THEME.secondary]}
          />
        }
      >
        {/* En-tête avec total de points */}
        <View style={styles.header}>
          <MaterialIcons  name="stars" size={60} color={THEME.accent} />
          <Text style={styles.pointsTotal}>{loading ? '...' : pointsData.total}</Text>
          <Text style={styles.pointsLabel}>{t('points_available')}</Text>
        </View>

        {/* Comment gagner des points */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, isRTL && { textAlign: 'right' }]}>
            {t('how_to_earn')}
          </Text>
          <View style={[styles.infoItem, isRTL && { flexDirection: 'row-reverse' }]}>
            <MaterialIcons  name="shopping-cart" size={20} color={THEME.primary} />
            <Text style={[styles.infoText, isRTL && { textAlign: 'right' }]}>
              {t('earn_orders')}
            </Text>
          </View>
          <View style={[styles.infoItem, isRTL && { flexDirection: 'row-reverse' }]}>
            <MaterialIcons  name="school" size={20} color={THEME.accent} />
            <Text style={[styles.infoText, isRTL && { textAlign: 'right' }]}>
              {t('earn_trainings')}
            </Text>
          </View>
          <View style={[styles.infoItem, isRTL && { flexDirection: 'row-reverse' }]}>
            <MaterialIcons  name="card-giftcard" size={20} color={THEME.success} />
            <Text style={[styles.infoText, isRTL && { textAlign: 'right' }]}>
              {t('earn_promotions')}
            </Text>
          </View>
        </View>

        {/* Récompenses disponibles */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>
            {t('rewards_available')}
          </Text>
          {pointsData.recompenses && pointsData.recompenses.length > 0 ? (
            pointsData.recompenses.map((recompense, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.recompenseCard,
                  isRTL && { borderLeftWidth: 0, borderRightWidth: 4, borderRightColor: THEME.accent },
                  pointsData.total < recompense.points && styles.recompenseCardDisabled,
                  pointsData.total < recompense.points && isRTL && { borderRightColor: THEME.gray },
                ]}
                activeOpacity={0.88}
                onPress={() => utiliserRecompense(recompense)}
              >
                <View style={[styles.recompenseInfo, isRTL && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.recompenseName, isRTL && { textAlign: 'right' }]}>
                    {recompense.nom}
                  </Text>
                  <Text style={[styles.recompenseDescription, isRTL && { textAlign: 'right' }]}>
                    {recompense.description}
                  </Text>
                </View>
                <View style={[
                  styles.recompenseCost,
                  pointsData.total < recompense.points && styles.recompenseCostDisabled,
                ]}>
                  <MaterialIcons 
                    name="stars"
                    size={20}
                    color={pointsData.total >= recompense.points ? THEME.accent : THEME.gray}
                  />
                  <Text style={[
                    styles.costText,
                    pointsData.total < recompense.points && styles.costTextDisabled,
                  ]}>
                    {recompense.points}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>
              {loading ? t('loading_rewards') : t('no_rewards')}
            </Text>
          )}
        </View>

        {/* Historique des points */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>
            {t('points_history_title')}
          </Text>
          {pointsData.historique && pointsData.historique.length > 0 ? (
            pointsData.historique.map((item, index) => (
              <View key={index} style={[styles.historyItem, isRTL && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.historyLeft, isRTL && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.historyTitle, isRTL && { textAlign: 'right' }]}>
                    {item.titre}
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(item.date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <Text style={[
                  styles.historyPoints,
                  item.points > 0 ? styles.positivePoints : styles.negativePoints,
                ]}>
                  {item.points > 0 ? '+' : ''}{item.points}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              {loading ? t('loading_points_history') : t('no_points_history')}
            </Text>
          )}
        </View>

        {loading && pointsData.recompenses.length === 0 && pointsData.historique.length === 0 ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={THEME.primary} />
          </View>
        ) : null}
      </ScrollView>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  header: { backgroundColor: THEME.primary, alignItems: 'center', padding: 40 },
  pointsTotal: { fontSize: 48, fontWeight: 'bold', color: THEME.white, marginTop: 10 },
  pointsLabel: { fontSize: 16, color: THEME.lightBeige, marginTop: 5 },
  infoSection: { backgroundColor: THEME.white, margin: 15, padding: 20, borderRadius: 15, elevation: 2 },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.darkBrown, marginBottom: 15 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  infoText: { fontSize: 14, color: THEME.gray, flex: 1 },
  section: { padding: 20, paddingTop: 0 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.darkBrown, marginBottom: 15 },
  recompenseCard: {
    backgroundColor: THEME.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: THEME.accent,
  },
  recompenseCardDisabled: {
    opacity: 0.5,
    borderLeftColor: THEME.gray,
  },
  recompenseInfo: { flex: 1, paddingRight: 10 },
  recompenseName: { fontSize: 16, fontWeight: 'bold', color: THEME.darkBrown, marginBottom: 5 },
  recompenseDescription: { fontSize: 13, color: THEME.gray },
  recompenseCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.lightBeige,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recompenseCostDisabled: { backgroundColor: '#eee' },
  costText: { fontSize: 16, fontWeight: 'bold', color: THEME.primary },
  costTextDisabled: { color: THEME.gray },
  historyItem: {
    backgroundColor: THEME.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
  },
  historyLeft: { flex: 1 },
  historyTitle: { fontSize: 14, fontWeight: '600', color: THEME.darkBrown },
  historyDate: { fontSize: 12, color: THEME.gray, marginTop: 3 },
  historyPoints: { fontSize: 18, fontWeight: 'bold' },
  positivePoints: { color: THEME.success },
  negativePoints: { color: THEME.error },
  emptyText: { fontSize: 14, color: THEME.gray, textAlign: 'center', padding: 20, fontStyle: 'italic' },
  loadingOverlay: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0, left: 0,
    backgroundColor: 'rgba(245, 222, 179, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});