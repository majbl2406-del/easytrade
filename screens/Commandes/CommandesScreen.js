import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { THEME } from '../../theme';
import api from '../../services/api';
import ScreenTransition from '../../components/ScreenTransition';
import { useLanguage } from '../../i18n/LanguageContext'; // ← ajouté

const STATUT_COLORS = {
  'En attente': THEME.warning, 'Confirmée': '#4169E1',
  'En préparation': '#FF8C00', 'En livraison': '#9370DB', 'Livrée': THEME.success,
};
const STATUT_ICONS = {
  'En attente': 'schedule', 'Confirmée': 'check-circle',
  'En préparation': 'inventory', 'En livraison': 'local-shipping', 'Livrée': 'done-all',
};

export default function CommandesScreen() {
  const { t, isRTL } = useLanguage(); // ← ajouté
  const [commandes, setCommandes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Les statuts traduits dynamiquement
  const STATUTS_LABELS = {
    'En attente':     t('status_waiting'),
    'Confirmée':      t('status_confirmed'),
    'En préparation': t('status_preparing'),
    'En livraison':   t('status_delivering'),
    'Livrée':         t('status_delivered'),
  };
  const STATUTS_LIST = ['En attente', 'Confirmée', 'En préparation', 'En livraison', 'Livrée'];

  useEffect(() => { loadCommandes(); }, []);

  const loadCommandes = async () => {
    try {
      const response = await api.get('/commandes');
      if (response.data.success) setCommandes(response.data.commandes);
    } catch (error) { console.error('Error loading commandes:', error); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadCommandes(); setRefreshing(false); };

  const getFilteredCommandes = () => {
    if (filter === 'all') return commandes;
    if (filter === 'in_progress') return commandes.filter(c => c.statut !== 'Livrée');
    return commandes.filter(c => c.statut === 'Livrée');
  };

  const getStatutStep = (statut) => STATUTS_LIST.indexOf(statut);

  const FILTERS = [
    { key: 'all',         label: t('all') },
    { key: 'in_progress', label: t('in_progress') },
    { key: 'completed',   label: t('completed') },
  ];

  const renderCommandeCard = ({ item }) => {
    const currentStep = getStatutStep(item.statut);
    return (
      <TouchableOpacity style={styles.commandeCard} activeOpacity={0.88} onPress={() => { setSelectedCommande(item); setModalVisible(true); }}>
        <View style={[styles.cardHeader, isRTL && { flexDirection: 'row-reverse' }]}>
          <View>
            <Text style={[styles.commandeId, isRTL && { textAlign: 'right' }]}>{t('order_number')}{item.id}</Text>
            <Text style={styles.commandeDate}>{new Date(item.date).toLocaleDateString('fr-FR')}</Text>
          </View>
          <View style={[styles.statutBadge, { backgroundColor: STATUT_COLORS[item.statut] }]}>
            <Icon name={STATUT_ICONS[item.statut]} size={16} color={THEME.white} />
            <Text style={styles.statutText}>{STATUTS_LABELS[item.statut]}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={[styles.infoRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <Icon name="store" size={18} color={THEME.gray} />
            <Text style={styles.infoText}>{item.fournisseurNom}</Text>
          </View>
          <View style={[styles.infoRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <Icon name="inventory" size={18} color={THEME.gray} />
            <Text style={styles.infoText}>{item.nombreProduits} {t('products_label').replace(':', '')}</Text>
          </View>
          <View style={[styles.infoRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <Icon name="attach-money" size={18} color={THEME.gray} />
            <Text style={styles.totalText}>{item.montantTotal} DH</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentStep / 4) * 100}%` }]} />
          </View>
          <Text style={[styles.progressText, isRTL && { textAlign: 'left' }]}>
            {t('step')} {currentStep + 1}/5
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTrackingModal = () => {
    if (!selectedCommande) return null;
    const currentStep = getStatutStep(selectedCommande.statut);
    return (
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, isRTL && { flexDirection: 'row-reverse' }]}>
              <Text style={styles.modalTitle}>{t('order_number')}{selectedCommande.id}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={28} color={THEME.gray} />
              </TouchableOpacity>
            </View>

            {/* Suivi */}
            <View style={styles.trackingContainer}>
              {STATUTS_LIST.map((statut, index) => {
                const isCompleted = index <= currentStep;
                const isCurrent = index === currentStep;
                return (
                  <View key={statut} style={[styles.trackingStep, isRTL && { flexDirection: 'row-reverse' }]}>
                    <View style={styles.stepIndicatorContainer}>
                      <View style={[styles.stepIndicator, isCompleted && styles.stepIndicatorCompleted, isCurrent && styles.stepIndicatorCurrent]}>
                        {isCompleted ? <Icon name="check" size={20} color={THEME.white} /> : <Text style={styles.stepNumber}>{index + 1}</Text>}
                      </View>
                      {index < STATUTS_LIST.length - 1 && <View style={[styles.stepLine, isCompleted && styles.stepLineCompleted]} />}
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepTitle, isCompleted && styles.stepTitleCompleted, isCurrent && styles.stepTitleCurrent, isRTL && { textAlign: 'right' }]}>
                        {STATUTS_LABELS[statut]}
                      </Text>
                      {isCompleted && <Text style={styles.stepTime}>{selectedCommande.timestamps?.[statut] || t('now')}</Text>}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Détails */}
            <View style={styles.detailsContainer}>
              <Text style={[styles.detailsTitle, isRTL && { textAlign: 'right' }]}>{t('order_details')}</Text>
              {[
                [t('supplier_label'), selectedCommande.fournisseurNom],
                [t('date_label'), new Date(selectedCommande.date).toLocaleDateString('fr-FR')],
                [t('products_label'), selectedCommande.nombreProduits],
              ].map(([label, val]) => (
                <View key={label} style={[styles.detailRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Text style={styles.detailLabel}>{label}</Text>
                  <Text style={styles.detailValue}>{val}</Text>
                </View>
              ))}
              <View style={[styles.detailRow, styles.totalRow, isRTL && { flexDirection: 'row-reverse' }]}>
                <Text style={styles.totalLabel}>{t('total_label')}</Text>
                <Text style={styles.totalValue}>{selectedCommande.montantTotal} DH</Text>
              </View>
            </View>

            {/* Produits */}
            <View style={styles.produitsContainer}>
              <Text style={[styles.produitsTitle, isRTL && { textAlign: 'right' }]}>{t('ordered_products')}</Text>
              {selectedCommande.produits?.map((produit, index) => (
                <View key={index} style={[styles.produitRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Text style={styles.produitNom}>{produit.nom}</Text>
                  <Text style={styles.produitQuantite}>x{produit.quantite}</Text>
                  <Text style={styles.produitPrix}>{produit.prix} DH</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScreenTransition style={styles.container}>
      <View style={[styles.filterContainer, isRTL && { flexDirection: 'row-reverse' }]}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f.key} activeOpacity={0.9} style={[styles.filterButton, filter === f.key && styles.filterButtonActive]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterButtonText, filter === f.key && styles.filterButtonTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={getFilteredCommandes()}
        renderItem={renderCommandeCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} colors={[THEME.primary, THEME.secondary]} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={THEME.primary} />
              <Text style={styles.emptyText}>{t('loading_orders')}</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="shopping-cart" size={80} color={THEME.gray} />
              <Text style={styles.emptyText}>
                {filter === 'all' ? t('no_orders') : filter === 'in_progress' ? t('no_orders_in_progress') : t('no_orders_completed')}
              </Text>
            </View>
          )
        }
      />
      {renderTrackingModal()}
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  filterContainer: { flexDirection: 'row', padding: 15, backgroundColor: THEME.white, gap: 10, elevation: 2 },
  filterButton: { flex: 1, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, backgroundColor: THEME.lightBeige, alignItems: 'center' },
  filterButtonActive: { backgroundColor: THEME.primary },
  filterButtonText: { fontSize: 14, fontWeight: '600', color: THEME.secondary },
  filterButtonTextActive: { color: THEME.white },
  listContainer: { padding: 15 },
  commandeCard: { backgroundColor: THEME.white, borderRadius: 15, padding: 15, marginBottom: 15, elevation: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  commandeId: { fontSize: 16, fontWeight: 'bold', color: THEME.darkBrown },
  commandeDate: { fontSize: 12, color: THEME.gray, marginTop: 3 },
  statutBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 5 },
  statutText: { color: THEME.white, fontSize: 12, fontWeight: 'bold' },
  cardContent: { gap: 8, marginBottom: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: THEME.gray },
  totalText: { fontSize: 16, fontWeight: 'bold', color: THEME.primary },
  progressContainer: { marginTop: 10 },
  progressBar: { height: 6, backgroundColor: THEME.lightBeige, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: THEME.primary },
  progressText: { fontSize: 11, color: THEME.gray, marginTop: 5, textAlign: 'right' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: THEME.gray, marginTop: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: THEME.white, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.darkBrown },
  trackingContainer: { marginBottom: 20 },
  trackingStep: { flexDirection: 'row', marginBottom: 20 },
  stepIndicatorContainer: { alignItems: 'center', marginRight: 15 },
  stepIndicator: { width: 40, height: 40, borderRadius: 20, backgroundColor: THEME.lightBeige, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: THEME.gray },
  stepIndicatorCompleted: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  stepIndicatorCurrent: { backgroundColor: THEME.accent, borderColor: THEME.accent },
  stepNumber: { fontSize: 16, fontWeight: 'bold', color: THEME.gray },
  stepLine: { width: 2, flex: 1, backgroundColor: THEME.lightBeige, marginTop: 5 },
  stepLineCompleted: { backgroundColor: THEME.primary },
  stepContent: { flex: 1, paddingTop: 8 },
  stepTitle: { fontSize: 16, color: THEME.gray, fontWeight: '600' },
  stepTitleCompleted: { color: THEME.primary },
  stepTitleCurrent: { color: THEME.accent, fontWeight: 'bold' },
  stepTime: { fontSize: 12, color: THEME.gray, marginTop: 3 },
  detailsContainer: { backgroundColor: THEME.lightBeige, borderRadius: 12, padding: 15, marginBottom: 15 },
  detailsTitle: { fontSize: 16, fontWeight: 'bold', color: THEME.darkBrown, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  detailLabel: { fontSize: 14, color: THEME.gray },
  detailValue: { fontSize: 14, color: THEME.darkBrown, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: THEME.secondary, marginTop: 8, paddingTop: 12 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: THEME.darkBrown },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: THEME.primary },
  produitsContainer: { marginBottom: 20 },
  produitsTitle: { fontSize: 16, fontWeight: 'bold', color: THEME.darkBrown, marginBottom: 10 },
  produitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: THEME.lightBeige },
  produitNom: { flex: 1, fontSize: 14, color: THEME.darkBrown },
  produitQuantite: { fontSize: 14, color: THEME.gray, marginHorizontal: 10 },
  produitPrix: { fontSize: 14, fontWeight: 'bold', color: THEME.primary },
  closeButton: { backgroundColor: THEME.primary, padding: 15, borderRadius: 12, alignItems: 'center' },
  closeButtonText: { color: THEME.white, fontSize: 16, fontWeight: 'bold' },
});