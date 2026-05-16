import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext';
import api from '../../services/api';
import ScreenTransition from '../../components/ScreenTransition';
import { useLanguage } from '../../i18n/LanguageContext';

export default function PointsScreen() {
  const { t, isRTL } = useLanguage();
  const { THEME, isDark } = useTheme();

  const [pointsData, setPointsData] = useState({
    total: 0,
    historique: [],
    recompenses: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadPointsData(); }, []);

  const loadPointsData = async () => {
    try {
      const response = await api.get('/points');
      if (response.data.success) setPointsData(response.data);
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

  const styles = makeStyles(THEME, isDark);

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
            colors={[THEME.primary]}
          />
        }
      >
        {/* En-tête avec total de points */}
        <View style={styles.header}>
          <MaterialIcons name="stars" size={60} color={THEME.accent} />
          <Text style={styles.pointsTotal}>{loading ? '...' : pointsData.total}</Text>
          <Text style={styles.pointsLabel}>{t('points_available')}</Text>
        </View>

        {/* Comment gagner des points */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, isRTL && { textAlign: 'right' }]}>
            {t('how_to_earn')}
          </Text>
          <View style={[styles.infoItem, isRTL && { flexDirection: 'row-reverse' }]}>
            <MaterialIcons name="shopping-cart" size={20} color={THEME.primary} />
            <Text style={[styles.infoText, isRTL && { textAlign: 'right' }]}>{t('earn_orders')}</Text>
          </View>
          <View style={[styles.infoItem, isRTL && { flexDirection: 'row-reverse' }]}>
            <MaterialIcons name="school" size={20} color={THEME.accent} />
            <Text style={[styles.infoText, isRTL && { textAlign: 'right' }]}>{t('earn_trainings')}</Text>
          </View>
          <View style={[styles.infoItem, isRTL && { flexDirection: 'row-reverse' }]}>
            <MaterialIcons name="card-giftcard" size={20} color={THEME.success || '#4CAF50'} />
            <Text style={[styles.infoText, isRTL && { textAlign: 'right' }]}>{t('earn_promotions')}</Text>
          </View>
        </View>

        {/* Récompenses disponibles */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>
            {t('rewards_available')}
          </Text>
          {pointsData.recompenses && pointsData.recompenses.length > 0 ? (
            pointsData.recompenses.map((recompense, index) => {
              const canAfford = pointsData.total >= recompense.points;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.recompenseCard,
                    isRTL && { borderLeftWidth: 0, borderRightWidth: 4, borderRightColor: canAfford ? THEME.accent : THEME.gray },
                    !canAfford && styles.recompenseCardDisabled,
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
                  <View style={[styles.recompenseCost, !canAfford && styles.recompenseCostDisabled]}>
                    <MaterialIcons name="stars" size={20} color={canAfford ? THEME.accent : THEME.gray} />
                    <Text style={[styles.costText, !canAfford && styles.costTextDisabled]}>
                      {recompense.points}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
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

const makeStyles = (THEME, isDark) => StyleSheet.create({
  container:               { flex: 1, backgroundColor: THEME.background },
  header:                  { backgroundColor: THEME.primary, alignItems: 'center', padding: 40 },
  pointsTotal:             { fontSize: 48, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  pointsLabel:             { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  infoSection:             { backgroundColor: THEME.card, margin: 15, padding: 20, borderRadius: 15, elevation: 2, borderWidth: 1, borderColor: THEME.border },
  infoTitle:               { fontSize: 18, fontWeight: 'bold', color: THEME.text, marginBottom: 15 },
  infoItem:                { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  infoText:                { fontSize: 14, color: THEME.textSecondary, flex: 1 },
  section:                 { padding: 20, paddingTop: 0 },
  sectionTitle:            { fontSize: 20, fontWeight: 'bold', color: THEME.text, marginBottom: 15 },
  recompenseCard:          { backgroundColor: THEME.card, borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: THEME.border, borderLeftWidth: 4, borderLeftColor: THEME.accent },
  recompenseCardDisabled:  { opacity: 0.5, borderLeftColor: THEME.gray },
  recompenseInfo:          { flex: 1, paddingRight: 10 },
  recompenseName:          { fontSize: 16, fontWeight: 'bold', color: THEME.text, marginBottom: 5 },
  recompenseDescription:   { fontSize: 13, color: THEME.textSecondary },
  recompenseCost:          { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: THEME.inputBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: THEME.border },
  recompenseCostDisabled:  { backgroundColor: isDark ? '#2a2a2a' : '#eee', borderColor: THEME.border },
  costText:                { fontSize: 16, fontWeight: 'bold', color: THEME.primary },
  costTextDisabled:        { color: THEME.gray },
  historyItem:             { backgroundColor: THEME.card, borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1, borderWidth: 1, borderColor: THEME.border },
  historyLeft:             { flex: 1 },
  historyTitle:            { fontSize: 14, fontWeight: '600', color: THEME.text },
  historyDate:             { fontSize: 12, color: THEME.textSecondary, marginTop: 3 },
  historyPoints:           { fontSize: 18, fontWeight: 'bold' },
  positivePoints:          { color: THEME.success || '#4CAF50' },
  negativePoints:          { color: THEME.error },
  emptyText:               { fontSize: 14, color: THEME.textSecondary, textAlign: 'center', padding: 20, fontStyle: 'italic' },
  loadingOverlay:          { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(245,222,179,0.45)', justifyContent: 'center', alignItems: 'center' },
});