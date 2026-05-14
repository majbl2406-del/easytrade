import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { THEME } from '../../theme';
import api from '../../services/api';
import ScreenTransition from '../../components/ScreenTransition';
import { useLanguage } from '../../i18n/LanguageContext';

export default function FournisseursScreen({ navigation }) {
  const { t, isRTL } = useLanguage();
  const [fournisseurs, setFournisseurs] = useState([]);
  const [filteredFournisseurs, setFilteredFournisseurs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('note'); // 'note' | 'prix' | 'promo'

  useEffect(() => { loadFournisseurs(); }, []);
  useEffect(() => { filterAndSort(); }, [searchQuery, fournisseurs, sortBy]);

  const loadFournisseurs = async () => {
    try {
      const response = await api.get('/fournisseurs');
      if (response.data.success) setFournisseurs(response.data.fournisseurs);
    } catch (error) {
      console.error('Error loading fournisseurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSort = () => {
    let list = [...fournisseurs];

    // Filtrage par recherche
    if (searchQuery.trim()) {
      list = list.filter(f =>
        f.nom.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Tri
    if (sortBy === 'note') list.sort((a, b) => (b.note || 0) - (a.note || 0));
    if (sortBy === 'prix') list.sort((a, b) => (a.prixMoyen || 0) - (b.prixMoyen || 0));
    if (sortBy === 'promo') list.sort((a, b) => (b.promotions ? 1 : 0) - (a.promotions ? 1 : 0));

    setFilteredFournisseurs(list);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFournisseurs();
    setRefreshing(false);
  };

  const SortButton = ({ label, value }) => (
    <TouchableOpacity
      style={[styles.sortBtn, sortBy === value && styles.sortBtnActive]}
      onPress={() => setSortBy(value)}
    >
      <Text style={[styles.sortBtnText, sortBy === value && styles.sortBtnTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderFournisseur = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.86}
      onPress={() => navigation.navigate('Produits', { fournisseur: item })}
    >
      {/* Badge promotion */}
      {item.promotions && (
        <View style={styles.promoBadge}>
          <MaterialIcons 

name="local-offer" size={12} color="#fff" />
          <Text style={styles.promoBadgeText}>{t('promotions')}</Text>
        </View>
      )}

      {/* Header : avatar + nom + note */}
      <View style={[styles.cardTop, isRTL && { flexDirection: 'row-reverse' }]}>
        <View style={styles.avatarWrap}>
          {item.logo ? (
            <Image source={{ uri: item.logo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons 

name="person" size={34} color="#fff" />
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.nom, isRTL && { textAlign: 'right' }]}>{item.nom}</Text>

          {/* Étoiles */}
          <View style={[styles.starsRow, isRTL && { flexDirection: 'row-reverse' }]}>
            {[1, 2, 3, 4, 5].map(i => (
              <MaterialIcons 
                key={i}
                name="star"
                size={14}
                color={i <= Math.round(item.note || 4.5) ? '#F5C518' : '#DDD0BA'}
              />
            ))}
            <Text style={styles.noteText}>{item.note || '4.5'}/5</Text>
          </View>
        </View>

        <MaterialIcons 
          name={isRTL ? 'chevron-left' : 'chevron-right'}
          size={26}
          color="#A0784A"
        />
      </View>

      {/* Infos clés */}
      <View style={[styles.infoRow, isRTL && { flexDirection: 'row-reverse' }]}>

        {/* Nombre de produits */}
        <View style={styles.infoBox}>
          <MaterialIcons 

name="inventory" size={18} color="#5C3D1E" />
          <Text style={styles.infoValue}>{item.nombreProduits || 0}</Text>
          <Text style={styles.infoLabel}>{t('products')}</Text>
        </View>

        {/* Prix moyen */}
        <View style={styles.infoBox}>
          <MaterialIcons 

name="attach-money" size={18} color="#5C3D1E" />
          <Text style={styles.infoValue}>{item.prixMoyen ? `${item.prixMoyen} DH` : '-'}</Text>
          <Text style={styles.infoLabel}>{t('avg_price')}</Text>
        </View>

        {/* Livraison */}
        <View style={styles.infoBox}>
          <MaterialIcons 

name="local-shipping" size={18} color="#5C3D1E" />
          <Text style={styles.infoValue}>{item.delaiLivraison || '24h'}</Text>
          <Text style={styles.infoLabel}>{t('delivery')}</Text>
        </View>

      </View>

      {/* Bouton voir produits */}
      <TouchableOpacity
        style={styles.viewBtn}
        onPress={() => navigation.navigate('Produits', { fournisseur: item })}
      >
        <Text style={styles.viewBtnText}>{t('view_products')}</Text>
        <MaterialIcons 

name="arrow-forward" size={16} color="#5C3D1E" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScreenTransition style={styles.container}>

      {/* Barre de recherche */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, isRTL && { flexDirection: 'row-reverse' }]}>
          <MaterialIcons 

name="search" size={22} color="#A0784A" />
          <TextInput
            style={[styles.searchInput, isRTL && { textAlign: 'right' }]}
            placeholder={t('search_supplier')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#B89878"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons 

name="close" size={20} color="#A0784A" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tri */}
        <View style={styles.sortRow}>
          <SortButton label={`⭐ ${t('sort_rating')}`}    value="note" />
          <SortButton label={`💰 ${t('sort_price')}`}    value="prix" />
          <SortButton label={`🏷️ ${t('sort_promo')}`}    value="promo" />
        </View>
      </View>

      <FlatList
        data={filteredFournisseurs}
        renderItem={renderFournisseur}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.primary}
            colors={[THEME.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons 

name="person-search" size={72} color="#DDD0BA" />
            <Text style={styles.emptyText}>
              {searchQuery ? t('no_supplier_found') : t('no_supplier')}
            </Text>
          </View>
        }
      />
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F5EFE6' },

  // Recherche + tri
  searchWrap:       { backgroundColor: '#FFFDF8', padding: 14, borderBottomWidth: 1, borderBottomColor: '#EDE3D3', elevation: 3 },
  searchBar:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5EFE6', borderRadius: 12, paddingHorizontal: 12, height: 46, gap: 8, borderWidth: 1, borderColor: '#DDD0BA' },
  searchInput:      { flex: 1, fontSize: 15, color: '#3E2510' },
  sortRow:          { flexDirection: 'row', gap: 8, marginTop: 10 },
  sortBtn:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F5EFE6', borderWidth: 1, borderColor: '#DDD0BA' },
  sortBtnActive:    { backgroundColor: '#5C3D1E', borderColor: '#5C3D1E' },
  sortBtnText:      { fontSize: 12, color: '#7A5230', fontWeight: '600' },
  sortBtnTextActive:{ color: '#F5C518' },

  list:             { padding: 14, paddingBottom: 100 },

  // Card fournisseur
  card:             { backgroundColor: '#FFFDF8', borderRadius: 18, padding: 16, marginBottom: 14, elevation: 4, borderWidth: 1, borderColor: '#EDE3D3', borderLeftWidth: 4, borderLeftColor: '#F5C518' },
  promoBadge:       { position: 'absolute', top: 12, right: 12, backgroundColor: '#D4A200', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4 },
  promoBadgeText:   { color: '#fff', fontSize: 10, fontWeight: '700' },

  cardTop:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatarWrap:       { },
  avatar:           { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: '#F5C518' },
  avatarPlaceholder:{ width: 58, height: 58, borderRadius: 29, backgroundColor: '#5C3D1E', justifyContent: 'center', alignItems: 'center' },
  nom:              { fontSize: 17, fontWeight: '800', color: '#3E2510', marginBottom: 4 },
  starsRow:         { flexDirection: 'row', alignItems: 'center', gap: 2 },
  noteText:         { fontSize: 11, color: '#7A5230', marginLeft: 4, fontWeight: '700' },

  infoRow:          { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#F5EFE6', borderRadius: 12, padding: 12, marginBottom: 12 },
  infoBox:          { alignItems: 'center', gap: 3 },
  infoValue:        { fontSize: 14, fontWeight: '800', color: '#3E2510' },
  infoLabel:        { fontSize: 10, color: '#7A5230', fontWeight: '600' },

  viewBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF3C0', borderRadius: 10, padding: 10, gap: 6, borderWidth: 1, borderColor: '#F5C518' },
  viewBtnText:      { fontSize: 14, fontWeight: '700', color: '#5C3D1E' },

  empty:            { alignItems: 'center', paddingVertical: 60 },
  emptyText:        { fontSize: 15, color: '#A0784A', marginTop: 14, fontWeight: '600' },
});
