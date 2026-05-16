import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext';
import api from '../../services/api';
import ScreenTransition from '../../components/ScreenTransition';
import { useLanguage } from '../../i18n/LanguageContext';

export default function FournisseursScreen({ navigation }) {
  const { t, isRTL } = useLanguage();
  const { THEME, isDark } = useTheme();

  const [fournisseurs,         setFournisseurs]         = useState([]);
  const [filteredFournisseurs, setFilteredFournisseurs] = useState([]);
  const [searchQuery,          setSearchQuery]          = useState('');
  const [refreshing,           setRefreshing]           = useState(false);
  const [loading,              setLoading]              = useState(true);
  const [sortBy,               setSortBy]               = useState('note');

  useEffect(() => { loadFournisseurs(); }, []);
  useEffect(() => { filterAndSort(); }, [searchQuery, fournisseurs, sortBy]);

  const loadFournisseurs = async () => {
    try {
      const response = await api.get('/fournisseurs');
      if (response.data.success) setFournisseurs(response.data.fournisseurs);
    } catch (error) { console.error('Error loading fournisseurs:', error); }
    finally { setLoading(false); }
  };

  const filterAndSort = () => {
    let list = [...fournisseurs];
    if (searchQuery.trim()) {
      list = list.filter(f => f.nom.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (sortBy === 'note') list.sort((a, b) => (b.note || 0) - (a.note || 0));
    if (sortBy === 'prix') list.sort((a, b) => (a.prixMoyen || 0) - (b.prixMoyen || 0));
    if (sortBy === 'promo') list.sort((a, b) => (b.promotions ? 1 : 0) - (a.promotions ? 1 : 0));
    setFilteredFournisseurs(list);
  };

  const onRefresh = async () => { setRefreshing(true); await loadFournisseurs(); setRefreshing(false); };

  const styles = makeStyles(THEME, isDark);

  const SortButton = ({ label, value }) => (
    <TouchableOpacity
      style={[styles.sortBtn, sortBy === value && styles.sortBtnActive]}
      onPress={() => setSortBy(value)}
    >
      <Text style={[styles.sortBtnText, sortBy === value && styles.sortBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderFournisseur = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.86} onPress={() => navigation.navigate('Produits', { fournisseur: item })}>
      {item.promotions && (
        <View style={styles.promoBadge}>
          <MaterialIcons name="local-offer" size={12} color="#fff" />
          <Text style={styles.promoBadgeText}>{t('promotions')}</Text>
        </View>
      )}

      <View style={[styles.cardTop, isRTL && { flexDirection: 'row-reverse' }]}>
        <View>
          {item.logo ? (
            <Image source={{ uri: item.logo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={34} color="#fff" />
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.nom, isRTL && { textAlign: 'right' }]}>{item.nom}</Text>
          <View style={[styles.starsRow, isRTL && { flexDirection: 'row-reverse' }]}>
            {[1, 2, 3, 4, 5].map(i => (
              <MaterialIcons key={i} name="star" size={14} color={i <= Math.round(item.note || 4.5) ? '#F5C518' : THEME.border} />
            ))}
            <Text style={styles.noteText}>{item.note || '4.5'}/5</Text>
          </View>
        </View>

        <MaterialIcons name={isRTL ? 'chevron-left' : 'chevron-right'} size={26} color={THEME.textSecondary} />
      </View>

      <View style={[styles.infoRow, isRTL && { flexDirection: 'row-reverse' }]}>
        <View style={styles.infoBox}>
          <MaterialIcons name="inventory" size={18} color={THEME.primary} />
          <Text style={styles.infoValue}>{item.nombreProduits || 0}</Text>
          <Text style={styles.infoLabel}>{t('products')}</Text>
        </View>
        <View style={styles.infoBox}>
          <MaterialIcons name="attach-money" size={18} color={THEME.primary} />
          <Text style={styles.infoValue}>{item.prixMoyen ? `${item.prixMoyen} DH` : '-'}</Text>
          <Text style={styles.infoLabel}>{t('avg_price')}</Text>
        </View>
        <View style={styles.infoBox}>
          <MaterialIcons name="local-shipping" size={18} color={THEME.primary} />
          <Text style={styles.infoValue}>{item.delaiLivraison || '24h'}</Text>
          <Text style={styles.infoLabel}>{t('delivery')}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewBtn} onPress={() => navigation.navigate('Produits', { fournisseur: item })}>
        <Text style={styles.viewBtnText}>{t('view_products')}</Text>
        <MaterialIcons name="arrow-forward" size={16} color={THEME.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScreenTransition style={styles.container}>
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, isRTL && { flexDirection: 'row-reverse' }]}>
          <MaterialIcons name="search" size={22} color={THEME.textSecondary} />
          <TextInput
            style={[styles.searchInput, isRTL && { textAlign: 'right' }]}
            placeholder={t('search_supplier')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={THEME.gray}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color={THEME.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.sortRow}>
          <SortButton label={`⭐ ${t('sort_rating')}`} value="note" />
          <SortButton label={`💰 ${t('sort_price')}`} value="prix" />
          <SortButton label={`🏷️ ${t('sort_promo')}`} value="promo" />
        </View>
      </View>

      <FlatList
        data={filteredFournisseurs}
        renderItem={renderFournisseur}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} colors={[THEME.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="person-search" size={72} color={THEME.border} />
            <Text style={styles.emptyText}>{searchQuery ? t('no_supplier_found') : t('no_supplier')}</Text>
          </View>
        }
      />
    </ScreenTransition>
  );
}

const makeStyles = (THEME, isDark) => StyleSheet.create({
  container:         { flex: 1, backgroundColor: THEME.background },
  searchWrap:        { backgroundColor: THEME.surface, padding: 14, borderBottomWidth: 1, borderBottomColor: THEME.border, elevation: 3 },
  searchBar:         { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.inputBg, borderRadius: 12, paddingHorizontal: 12, height: 46, gap: 8, borderWidth: 1, borderColor: THEME.border },
  searchInput:       { flex: 1, fontSize: 15, color: THEME.text },
  sortRow:           { flexDirection: 'row', gap: 8, marginTop: 10 },
  sortBtn:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: THEME.inputBg, borderWidth: 1, borderColor: THEME.border },
  sortBtnActive:     { backgroundColor: THEME.primary, borderColor: THEME.primary },
  sortBtnText:       { fontSize: 12, color: THEME.textSecondary, fontWeight: '600' },
  sortBtnTextActive: { color: '#F5C518' },
  list:              { padding: 14, paddingBottom: 100 },
  card:              { backgroundColor: THEME.card, borderRadius: 18, padding: 16, marginBottom: 14, elevation: 4, borderWidth: 1, borderColor: THEME.border, borderLeftWidth: 4, borderLeftColor: '#F5C518' },
  promoBadge:        { position: 'absolute', top: 12, right: 12, backgroundColor: '#D4A200', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4 },
  promoBadgeText:    { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardTop:           { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar:            { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: '#F5C518' },
  avatarPlaceholder: { width: 58, height: 58, borderRadius: 29, backgroundColor: THEME.primary, justifyContent: 'center', alignItems: 'center' },
  nom:               { fontSize: 17, fontWeight: '800', color: THEME.text, marginBottom: 4 },
  starsRow:          { flexDirection: 'row', alignItems: 'center', gap: 2 },
  noteText:          { fontSize: 11, color: THEME.textSecondary, marginLeft: 4, fontWeight: '700' },
  infoRow:           { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: THEME.inputBg, borderRadius: 12, padding: 12, marginBottom: 12 },
  infoBox:           { alignItems: 'center', gap: 3 },
  infoValue:         { fontSize: 14, fontWeight: '800', color: THEME.text },
  infoLabel:         { fontSize: 10, color: THEME.textSecondary, fontWeight: '600' },
  viewBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#1B3A1B' : '#FFF3C0', borderRadius: 10, padding: 10, gap: 6, borderWidth: 1, borderColor: isDark ? THEME.primary : '#F5C518' },
  viewBtnText:       { fontSize: 14, fontWeight: '700', color: THEME.primary },
  empty:             { alignItems: 'center', paddingVertical: 60 },
  emptyText:         { fontSize: 15, color: THEME.textSecondary, marginTop: 14, fontWeight: '600' },
});