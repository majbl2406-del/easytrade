import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, Alert, Modal, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { THEME } from '../../theme';
import api from '../../services/api';
import ScreenTransition from '../../components/ScreenTransition';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ProduitsScreen({ route, navigation }) {
  const { fournisseur } = route.params;
  const { t, isRTL } = useLanguage();

  const [produits, setProduits] = useState([]);
  const [filteredProduits, setFilteredProduits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState(['all']);
  const [panier, setPanier] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sortBy, setSortBy] = useState('nom');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [correctedQuery, setCorrectedQuery] = useState('');

  // --- État du modal de confirmation commande ---
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [codePromo, setCodePromo] = useState('');
  const [codePromoLoading, setCodePromoLoading] = useState(false);
  const [codePromoValide, setCodePromoValide] = useState(null); // null | true | false
  const [reductionInfo, setReductionInfo] = useState(null);     // { nom, reduction }
  const [commandeLoading, setCommandeLoading] = useState(false);

  useEffect(() => { loadProduits(); }, []);
  useEffect(() => { filterAndSortProduits(); }, [searchQuery, selectedCategory, sortBy, produits]);

  const loadProduits = async () => {
    try {
      const response = await api.get(`/produits/fournisseur/${fournisseur.id}`);
      if (response.data.success) {
        setProduits(response.data.produits);
        const cats = ['all', ...new Set(response.data.produits.map(p => p.categorie))];
        setCategories(cats);
      }
    } catch (error) {
      console.error('Error loading produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProduits();
    setRefreshing(false);
  };

  const filterAndSortProduits = async () => {
    let filtered = [...produits];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.categorie === selectedCategory);
    }

    if (searchQuery.trim()) {
      try {
        const response = await api.post('/produits/search', {
          query: searchQuery,
          products: filtered,
          filters: { category: selectedCategory },
          sortBy,
        });
        if (response.data.success) {
          filtered = response.data.filteredProducts;
          setCorrectedQuery(response.data.correctedQuery || '');
        }
      } catch (error) {
        filtered = filtered.filter(p =>
          p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setCorrectedQuery('');
      }
    } else {
      setCorrectedQuery('');
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'prix':       return a.prix - b.prix;
        case 'popularite': return (b.nombreCommandes || 0) - (a.nombreCommandes || 0);
        default:           return a.nom.localeCompare(b.nom);
      }
    });

    setFilteredProduits(filtered);
  };

  const addToPanier = (product, qty) => {
    const existingItem = panier.find(item => item.id === product.id);
    if (existingItem) {
      setPanier(panier.map(item =>
        item.id === product.id ? { ...item, quantite: item.quantite + qty } : item
      ));
    } else {
      setPanier([...panier, { ...product, quantite: qty }]);
    }
    setModalVisible(false);
    setQuantity(1);
    Alert.alert(t('success'), t('product_added_cart'));
  };

  // Calcul du montant total du panier
  const getMontantTotal = () =>
    panier.reduce((sum, item) => sum + item.prix * item.quantite, 0);

  // Calcul montant après réduction
  const getMontantApresReduction = () => {
    const total = getMontantTotal();
    if (!reductionInfo) return total;
    return Math.max(0, total - reductionInfo.reduction);
  };

  // Vérifier le code promo
  const verifierCodePromo = async () => {
    if (!codePromo.trim()) return;
    setCodePromoLoading(true);
    setCodePromoValide(null);
    setReductionInfo(null);
    try {
      const response = await api.post('/points/verify-code', {
        code: codePromo.trim().toUpperCase(),
      });
      if (response.data.success) {
        setCodePromoValide(true);
        setReductionInfo({
          nom: response.data.recompenseNom,
          reduction: response.data.reductionEstimee,
        });
      }
    } catch (error) {
      setCodePromoValide(false);
      setReductionInfo(null);
    } finally {
      setCodePromoLoading(false);
    }
  };

  // Réinitialiser le code promo quand on ferme le modal
  const fermerConfirmModal = () => {
    setConfirmModalVisible(false);
    setCodePromo('');
    setCodePromoValide(null);
    setReductionInfo(null);
  };

  // Passer la commande
  const passerCommande = async () => {
    if (panier.length === 0) {
      Alert.alert(t('error'), t('cart_empty'));
      return;
    }
    setCommandeLoading(true);
    try {
      const response = await api.post('/commandes/create', {
        fournisseurId: fournisseur.id,
        produits: panier,
        codePromo: codePromo.trim().toUpperCase() || undefined,
      });
      if (response.data.success) {
        fermerConfirmModal();
        const reductionMsg = response.data.reductionAppliquee > 0
          ? `\n🎉 Réduction appliquée : -${response.data.reductionAppliquee} DH\nMontant final : ${response.data.montantFinal} DH`
          : '';
        Alert.alert(t('success'), `${t('order_success')}${reductionMsg}`, [
          { text: t('ok'), onPress: () => navigation.navigate('Commandes') },
        ]);
        setPanier([]);
      }
    } catch (error) {
      const msg = error.response?.data?.message || t('order_error');
      Alert.alert(t('error'), msg);
    } finally {
      setCommandeLoading(false);
    }
  };

  const getSortLabel = () => {
    if (sortBy === 'prix')       return t('sort_price');
    if (sortBy === 'popularite') return t('sort_popularity');
    return t('sort_name');
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.9}
      onPress={() => { setSelectedProduct(item); setModalVisible(true); }}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.productImage} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <MaterialIcons  name="inventory" size={40} color={THEME.gray} />
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={[styles.productName, isRTL && { textAlign: 'right' }]} numberOfLines={2}>
          {item.nom}
        </Text>
        <Text style={[styles.productDescription, isRTL && { textAlign: 'right' }]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={[styles.productFooter, isRTL && { flexDirection: 'row-reverse' }]}>
          <Text style={styles.productPrice}>{item.prix} DH</Text>
          {item.stock < 10 && item.stock > 0 && (
            <View style={styles.stockWarning}>
              <Text style={styles.stockWarningText}>{t('limited_stock')}</Text>
            </View>
          )}
        </View>
        {item.promotions && (
          <View style={styles.promotionTag}>
            <Text style={styles.promotionText}>-{item.promotions}%</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => { setSelectedProduct(item); setModalVisible(true); }}
      >
        <MaterialIcons  name="add-shopping-cart" size={24} color={THEME.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // ── Modal confirmation commande ──────────────────────────────────────────
  const renderConfirmModal = () => (
    <Modal
      animationType="slide"
      transparent
      visible={confirmModalVisible}
      onRequestClose={fermerConfirmModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Titre */}
            <View style={styles.confirmHeader}>
              <Text style={styles.confirmTitle}>🛒 Récapitulatif de commande</Text>
              <TouchableOpacity onPress={fermerConfirmModal}>
                <MaterialIcons  name="close" size={26} color={THEME.gray} />
              </TouchableOpacity>
            </View>

            {/* Liste produits du panier */}
            {panier.map((item, index) => (
              <View key={index} style={styles.panierItem}>
                <Text style={styles.panierItemNom} numberOfLines={1}>{item.nom}</Text>
                <Text style={styles.panierItemQty}>x{item.quantite}</Text>
                <Text style={styles.panierItemPrix}>{item.prix * item.quantite} DH</Text>
              </View>
            ))}

            <View style={styles.separateur} />

            {/* Montant total */}
            <View style={styles.montantRow}>
              <Text style={styles.montantLabel}>Sous-total</Text>
              <Text style={styles.montantValeur}>{getMontantTotal()} DH</Text>
            </View>

            {/* Section code promo */}
            <View style={styles.codePromoSection}>
              <Text style={styles.codePromoTitle}>🎁 Code de réduction</Text>
              <View style={styles.codePromoRow}>
                <TextInput
                  style={[
                    styles.codePromoInput,
                    codePromoValide === true  && styles.codePromoInputValide,
                    codePromoValide === false && styles.codePromoInputInvalide,
                  ]}
                  placeholder="Ex : RED-ABC123"
                  placeholderTextColor={THEME.gray}
                  value={codePromo}
                  onChangeText={(text) => {
                    setCodePromo(text.toUpperCase());
                    setCodePromoValide(null);
                    setReductionInfo(null);
                  }}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.verifierButton}
                  onPress={verifierCodePromo}
                  disabled={!codePromo.trim() || codePromoLoading}
                >
                  {codePromoLoading
                    ? <ActivityIndicator size="small" color={THEME.white} />
                    : <Text style={styles.verifierButtonText}>Vérifier</Text>
                  }
                </TouchableOpacity>
              </View>

              {/* Feedback code promo */}
              {codePromoValide === true && reductionInfo && (
                <View style={styles.codePromoFeedbackValide}>
                  <MaterialIcons  name="check-circle" size={18} color="#4CAF50" />
                  <Text style={styles.codePromoFeedbackTexteValide}>
                    {reductionInfo.nom} — -{reductionInfo.reduction} DH
                  </Text>
                </View>
              )}
              {codePromoValide === false && (
                <View style={styles.codePromoFeedbackInvalide}>
                  <MaterialIcons  name="cancel" size={18} color={THEME.error} />
                  <Text style={styles.codePromoFeedbackTexteInvalide}>
                    Code invalide ou déjà utilisé
                  </Text>
                </View>
              )}
            </View>

            {/* Montant final */}
            {reductionInfo && reductionInfo.reduction > 0 && (
              <View style={styles.montantRow}>
                <Text style={styles.reductionLabel}>Réduction</Text>
                <Text style={styles.reductionValeur}>-{reductionInfo.reduction} DH</Text>
              </View>
            )}

            <View style={[styles.montantRow, styles.montantFinalRow]}>
              <Text style={styles.montantFinalLabel}>Total à payer</Text>
              <Text style={styles.montantFinalValeur}>{getMontantApresReduction()} DH</Text>
            </View>

            {/* Boutons */}
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.annulerButton} onPress={fermerConfirmModal}>
                <Text style={styles.annulerButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmerButton}
                onPress={passerCommande}
                disabled={commandeLoading}
              >
                {commandeLoading
                  ? <ActivityIndicator color={THEME.white} />
                  : <Text style={styles.confirmerButtonText}>✅ Confirmer</Text>
                }
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScreenTransition style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={[styles.fournisseurName, isRTL && { textAlign: 'right' }]}>
          {fournisseur.nom}
        </Text>
        <Text style={[styles.subtitle, isRTL && { textAlign: 'right' }]}>
          {filteredProduits.length} {t('products_available')}
        </Text>
      </View>

      {/* Recherche et filtres */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, isRTL && { flexDirection: 'row-reverse' }]}>
          <MaterialIcons  name="search" size={20} color={THEME.gray} />
          <TextInput
            style={[styles.searchInput, isRTL && { textAlign: 'right' }]}
            placeholder={t('search_product')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={THEME.gray}
          />
          <MaterialIcons  name="psychology" size={20} color={THEME.accent} />
        </View>

        {searchQuery.trim() && correctedQuery && correctedQuery !== searchQuery.toLowerCase() && (
          <Text style={[styles.correctedText, isRTL && { textAlign: 'right' }]}>
            {t('ai_suggestion')}: {correctedQuery}
          </Text>
        )}

        {/* Catégories */}
        <FlatList
          horizontal
          inverted={isRTL}
          data={categories}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, item === selectedCategory && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.categoryText, item === selectedCategory && styles.categoryTextActive]}>
                {item === 'all' ? t('all') : item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />

        {/* Tri */}
        <View style={[styles.sortContainer, isRTL && { flexDirection: 'row-reverse' }]}>
          <Text style={styles.sortLabel}>{t('sort_by')} :</Text>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => {
              const sorts = ['nom', 'prix', 'popularite'];
              const currentIndex = sorts.indexOf(sortBy);
              setSortBy(sorts[(currentIndex + 1) % sorts.length]);
            }}
          >
            <Text style={styles.sortButtonText}>{getSortLabel()}</Text>
            <MaterialIcons  name="sort" size={18} color={THEME.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des produits */}
      <FlatList
        data={filteredProduits}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} colors={[THEME.primary]} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={THEME.primary} />
              <Text style={styles.emptyText}>{t('loading_products')}</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons  name="inventory" size={60} color={THEME.gray} />
              <Text style={styles.emptyText}>{t('no_product_found')}</Text>
            </View>
          )
        }
      />

      {/* Bouton panier flottant → ouvre le modal de confirmation */}
      {panier.length > 0 && (
        <TouchableOpacity
          style={styles.panierButton}
          onPress={() => setConfirmModalVisible(true)}
        >
          <MaterialIcons  name="shopping-cart" size={24} color={THEME.white} />
          <View style={styles.panierBadge}>
            <Text style={styles.panierBadgeText}>{panier.length}</Text>
          </View>
          <Text style={styles.panierButtonText}>
            {t('order')} — {getMontantTotal()} DH
          </Text>
        </TouchableOpacity>
      )}

      {/* Modal ajout produit au panier */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <>
                <Text style={[styles.modalTitle, isRTL && { textAlign: 'right' }]}>
                  {selectedProduct.nom}
                </Text>
                <Text style={styles.modalPrice}>{selectedProduct.prix} DH</Text>

                <View style={styles.quantityContainer}>
                  <Text style={[styles.quantityLabel, isRTL && { textAlign: 'right' }]}>
                    {t('quantity')} :
                  </Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity style={styles.quantityButton} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                      <MaterialIcons  name="remove" size={24} color={THEME.white} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity style={styles.quantityButton} onPress={() => setQuantity(quantity + 1)}>
                      <MaterialIcons  name="add" size={24} color={THEME.white} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.totalText}>
                  {t('total')} : {(selectedProduct.prix * quantity).toFixed(2)} DH
                </Text>

                <View style={[styles.modalButtons, isRTL && { flexDirection: 'row-reverse' }]}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => { setModalVisible(false); setQuantity(1); }}
                  >
                    <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={() => addToPanier(selectedProduct, quantity)}
                  >
                    <Text style={styles.confirmButtonText}>{t('add')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal confirmation commande */}
      {renderConfirmModal()}
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: THEME.background },
  header:             { backgroundColor: THEME.primary, padding: 20, paddingTop: 15, elevation: 4 },
  fournisseurName:    { fontSize: 22, fontWeight: 'bold', color: THEME.white },
  subtitle:           { fontSize: 14, color: THEME.lightBeige, marginTop: 5 },
  searchContainer:    { backgroundColor: THEME.white, padding: 15 },
  searchBar:          { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.lightBeige, borderRadius: 10, paddingHorizontal: 15, height: 45, gap: 10 },
  searchInput:        { flex: 1, fontSize: 14, color: THEME.black },
  correctedText:      { marginTop: 8, fontSize: 12, color: THEME.secondary, fontStyle: 'italic' },
  categoriesList:     { paddingVertical: 10 },
  categoryChip:       { backgroundColor: THEME.lightBeige, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  categoryChipActive: { backgroundColor: THEME.primary },
  categoryText:       { fontSize: 14, color: THEME.secondary, fontWeight: '600' },
  categoryTextActive: { color: THEME.white },
  sortContainer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  sortLabel:          { fontSize: 14, color: THEME.gray },
  sortButton:         { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sortButtonText:     { fontSize: 14, color: THEME.primary, fontWeight: '600' },
  productsList:       { padding: 10, paddingBottom: 100 },
  productCard:        { flex: 1, backgroundColor: THEME.white, borderRadius: 12, margin: 5, overflow: 'hidden', elevation: 4 },
  productImage:       { width: '100%', height: 120 },
  imagePlaceholder:   { width: '100%', height: 120, backgroundColor: THEME.lightBeige, justifyContent: 'center', alignItems: 'center' },
  productInfo:        { padding: 10 },
  productName:        { fontSize: 14, fontWeight: 'bold', color: THEME.darkBrown, marginBottom: 5 },
  productDescription: { fontSize: 11, color: THEME.gray, marginBottom: 8 },
  productFooter:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice:       { fontSize: 16, fontWeight: 'bold', color: THEME.primary },
  stockWarning:       { backgroundColor: THEME.warning, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  stockWarningText:   { fontSize: 9, color: THEME.white, fontWeight: 'bold' },
  promotionTag:       { position: 'absolute', top: 10, right: 10, backgroundColor: THEME.error, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  promotionText:      { color: THEME.white, fontSize: 12, fontWeight: 'bold' },
  addButton:          { backgroundColor: THEME.primary, padding: 10, alignItems: 'center' },
  panierButton:       { position: 'absolute', bottom: 20, right: 20, left: 20, backgroundColor: THEME.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 25, gap: 10, elevation: 6 },
  panierBadge:        { position: 'absolute', top: -5, right: 20, backgroundColor: THEME.accent, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  panierBadgeText:    { color: THEME.white, fontSize: 12, fontWeight: 'bold' },
  panierButtonText:   { color: THEME.white, fontSize: 18, fontWeight: 'bold' },
  emptyContainer:     { alignItems: 'center', paddingVertical: 60 },
  emptyText:          { fontSize: 16, color: THEME.gray, marginTop: 15 },
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent:       { backgroundColor: THEME.white, borderRadius: 20, padding: 25, width: '85%' },
  modalTitle:         { fontSize: 20, fontWeight: 'bold', color: THEME.darkBrown, marginBottom: 10 },
  modalPrice:         { fontSize: 24, fontWeight: 'bold', color: THEME.primary, marginBottom: 20 },
  quantityContainer:  { marginBottom: 20 },
  quantityLabel:      { fontSize: 16, color: THEME.gray, marginBottom: 10 },
  quantityControls:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  quantityButton:     { backgroundColor: THEME.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  quantityText:       { fontSize: 24, fontWeight: 'bold', color: THEME.darkBrown, minWidth: 40, textAlign: 'center' },
  totalText:          { fontSize: 18, fontWeight: 'bold', color: THEME.secondary, textAlign: 'center', marginBottom: 20 },
  modalButtons:       { flexDirection: 'row', gap: 10 },
  modalButton:        { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  cancelButton:       { backgroundColor: THEME.lightBeige },
  confirmButton:      { backgroundColor: THEME.primary },
  cancelButtonText:   { color: THEME.secondary, fontSize: 16, fontWeight: 'bold' },
  confirmButtonText:  { color: THEME.white, fontSize: 16, fontWeight: 'bold' },

  // ── Confirm modal ──
  confirmModalContent:      { backgroundColor: THEME.white, borderRadius: 20, padding: 20, width: '92%', maxHeight: '85%' },
  confirmHeader:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  confirmTitle:             { fontSize: 18, fontWeight: 'bold', color: THEME.darkBrown },
  panierItem:               { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: THEME.lightBeige },
  panierItemNom:            { flex: 1, fontSize: 13, color: THEME.darkBrown },
  panierItemQty:            { fontSize: 13, color: THEME.gray, marginHorizontal: 10 },
  panierItemPrix:           { fontSize: 13, fontWeight: 'bold', color: THEME.primary },
  separateur:               { height: 1, backgroundColor: THEME.lightBeige, marginVertical: 12 },
  montantRow:               { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  montantLabel:             { fontSize: 14, color: THEME.gray },
  montantValeur:            { fontSize: 14, fontWeight: '600', color: THEME.darkBrown },
  reductionLabel:           { fontSize: 14, color: '#4CAF50' },
  reductionValeur:          { fontSize: 14, fontWeight: 'bold', color: '#4CAF50' },
  montantFinalRow:          { borderTopWidth: 1, borderTopColor: THEME.lightBeige, paddingTop: 10, marginTop: 4 },
  montantFinalLabel:        { fontSize: 16, fontWeight: 'bold', color: THEME.darkBrown },
  montantFinalValeur:       { fontSize: 18, fontWeight: 'bold', color: THEME.primary },
  codePromoSection:         { backgroundColor: THEME.lightBeige, borderRadius: 12, padding: 14, marginVertical: 12 },
  codePromoTitle:           { fontSize: 14, fontWeight: 'bold', color: THEME.darkBrown, marginBottom: 10 },
  codePromoRow:             { flexDirection: 'row', gap: 8 },
  codePromoInput:           { flex: 1, backgroundColor: THEME.white, borderRadius: 8, paddingHorizontal: 12, height: 44, fontSize: 14, color: THEME.darkBrown, borderWidth: 1, borderColor: THEME.gray },
  codePromoInputValide:     { borderColor: '#4CAF50' },
  codePromoInputInvalide:   { borderColor: THEME.error },
  verifierButton:           { backgroundColor: THEME.primary, paddingHorizontal: 14, borderRadius: 8, justifyContent: 'center', height: 44 },
  verifierButtonText:       { color: THEME.white, fontWeight: 'bold', fontSize: 13 },
  codePromoFeedbackValide:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  codePromoFeedbackTexteValide:   { fontSize: 13, color: '#4CAF50', fontWeight: '600' },
  codePromoFeedbackInvalide:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  codePromoFeedbackTexteInvalide: { fontSize: 13, color: THEME.error },
  confirmButtons:           { flexDirection: 'row', gap: 10, marginTop: 16 },
  annulerButton:            { flex: 1, padding: 13, borderRadius: 10, backgroundColor: THEME.lightBeige, alignItems: 'center' },
  annulerButtonText:        { color: THEME.secondary, fontSize: 15, fontWeight: 'bold' },
  confirmerButton:          { flex: 1, padding: 13, borderRadius: 10, backgroundColor: THEME.primary, alignItems: 'center' },
  confirmerButtonText:      { color: THEME.white, fontSize: 15, fontWeight: 'bold' },
});