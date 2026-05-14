import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl, Modal, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../../theme';
import api from '../../services/api';
import ScreenTransition from '../../components/ScreenTransition';
import LanguageSelector from '../../i18n/LanguageSelector';
import { useLanguage } from '../../i18n/LanguageContext'; // ← ajouté

export default function ProfileScreen({ navigation, onLogout }) {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage(); // ← ajouté

  const [userData, setUserData] = useState({ nom: '', prenom: '', telephone: '', adresse: '', email: '' });
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState({ commandesTotales: 0, totalDepense: 0, formationsTerminees: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadUserData(), loadStats()]);
    setLoading(false);
  };

  const loadUserData = async () => {
    try {
      const user = await AsyncStorage.getItem('userData');
      if (user) setUserData(JSON.parse(user));
    } catch (error) { console.error('Error loading user data:', error); }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/epicier/profile-stats');
      if (response.data.success) setStats(response.data.stats);
    } catch (error) { console.error('Error loading stats:', error); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserData(), loadStats()]);
    setRefreshing(false);
  };

  const saveProfile = async () => {
    try {
      const response = await api.put('/epicier/profile', userData);
      if (response.data.success) {
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        setEditing(false);
        Alert.alert(t('success'), t('profile_updated'));
      }
    } catch (error) {
      Alert.alert(t('error'), t('update_error'));
    }
  };

  const logout = () => {
    Alert.alert(
      t('logout_title'),
      t('logout_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('disconnect'),
          style: 'destructive',
          onPress: async () => {
            try { await AsyncStorage.clear(); }
            catch (e) { console.error('Erreur déconnexion:', e); }
            finally { if (onLogout) onLogout(); }
          },
        },
      ]
    );
  };

  const align = isRTL ? { textAlign: 'right' } : {};
  const rowDir = isRTL ? { flexDirection: 'row-reverse' } : {};

  return (
    <ScreenTransition style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 100, 120) }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} colors={[THEME.primary, THEME.secondary]} />}
      >
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <MaterialIcons 

name="person" size={60} color={THEME.white} />
          </View>
          <Text style={styles.userName}>{userData.nom} {userData.prenom}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
        </View>

        {/* Statistiques */}
        <View style={[styles.statsContainer, rowDir]}>
          <View style={styles.statBox}>
            <MaterialIcons 

name="shopping-cart" size={30} color={THEME.primary} />
            <Text style={styles.statValue}>{stats.commandesTotales}</Text>
            <Text style={styles.statLabel}>{t('orders')}</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialIcons 

name="attach-money" size={30} color={THEME.success} />
            <Text style={styles.statValue}>{stats.totalDepense} DH</Text>
            <Text style={styles.statLabel}>{t('spent')}</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialIcons 

name="school" size={30} color={THEME.accent} />
            <Text style={styles.statValue}>{stats.formationsTerminees}</Text>
            <Text style={styles.statLabel}>{t('trainings')}</Text>
          </View>
        </View>

        {/* Informations personnelles */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, rowDir]}>
            <Text style={[styles.sectionTitle, align]}>{t('personal_info')}</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <MaterialIcons 

name={editing ? 'close' : 'edit'} size={24} color={THEME.primary} />
            </TouchableOpacity>
          </View>

          {[
            { key: 'nom',       field: 'nom',       keyboard: 'default' },
            { key: 'prenom',    field: 'prenom',    keyboard: 'default' },
            { key: 'telephone', field: 'telephone', keyboard: 'phone-pad' },
            { key: 'adresse',   field: 'adresse',   keyboard: 'default', multiline: true },
          ].map(({ key, field, keyboard, multiline }) => (
            <View key={field} style={styles.inputGroup}>
              <Text style={[styles.label, align]}>{t(key)}</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled, isRTL && { textAlign: 'right' }]}
                value={userData[field]}
                onChangeText={(text) => setUserData({ ...userData, [field]: text })}
                editable={editing}
                keyboardType={keyboard}
                multiline={!!multiline}
              />
            </View>
          ))}

          {editing && (
            <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
              <Text style={styles.saveButtonText}>{t('save_changes')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Paramètres */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, align]}>{t('settings')}</Text>

          {/* Sélecteur de langue */}
          <LanguageSelector />

          <View style={styles.divider} />

          <TouchableOpacity style={[styles.optionItem, rowDir]} onPress={() => navigation.navigate('Points')}>
            <View style={[styles.optionLeft, rowDir]}>
              <MaterialIcons 

name="stars" size={24} color={THEME.accent} />
              <Text style={styles.optionText}>{t('my_points')}</Text>
            </View>
            <MaterialIcons 

name={isRTL ? 'chevron-left' : 'chevron-right'} size={24} color={THEME.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionItem, rowDir]} onPress={() => navigation.navigate('Commandes')}>
            <View style={[styles.optionLeft, rowDir]}>
              <MaterialIcons 

name="history" size={24} color={THEME.secondary} />
              <Text style={styles.optionText}>{t('order_history')}</Text>
            </View>
            <MaterialIcons 

name={isRTL ? 'chevron-left' : 'chevron-right'} size={24} color={THEME.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionItem, rowDir]} onPress={() => setAboutVisible(true)}>
            <View style={[styles.optionLeft, rowDir]}>
              <MaterialIcons 

name="info" size={24} color={THEME.primary} />
              <Text style={styles.optionText}>{t('about')}</Text>
            </View>
            <MaterialIcons 

name={isRTL ? 'chevron-left' : 'chevron-right'} size={24} color={THEME.gray} />
          </TouchableOpacity>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={[styles.logoutButton, rowDir]} onPress={logout}>
          <MaterialIcons 

name="logout" size={24} color={THEME.white} />
          <Text style={styles.logoutButtonText}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      )}

      <Modal transparent animationType="fade" visible={aboutVisible} onRequestClose={() => setAboutVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setAboutVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, align]}>{t('about_title')}</Text>
            <Text style={[styles.modalText, align]}>{t('developed_by')}</Text>
            <Text style={[styles.modalName, align]}>BAQLOUL Majda</Text>
            <Text style={[styles.modalName, align]}>AGAYOU Fadma</Text>
            <Text style={[styles.modalName, align]}>ES-SAIDI Hind</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setAboutVisible(false)}>
              <Text style={styles.modalButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: THEME.background },
  header:           { backgroundColor: THEME.primary, padding: 30, alignItems: 'center' },
  avatarContainer:  { width: 100, height: 100, borderRadius: 50, backgroundColor: THEME.secondary, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  userName:         { fontSize: 24, fontWeight: 'bold', color: THEME.white },
  userEmail:        { fontSize: 14, color: THEME.lightBeige, marginTop: 5 },
  statsContainer:   { flexDirection: 'row', backgroundColor: THEME.white, padding: 20, justifyContent: 'space-around', marginTop: -20, marginHorizontal: 15, borderRadius: 15, elevation: 5 },
  statBox:          { alignItems: 'center' },
  statValue:        { fontSize: 20, fontWeight: 'bold', color: THEME.darkBrown, marginTop: 5 },
  statLabel:        { fontSize: 12, color: THEME.gray, marginTop: 3 },
  section:          { backgroundColor: THEME.white, margin: 15, padding: 20, borderRadius: 15, elevation: 2 },
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle:     { fontSize: 18, fontWeight: 'bold', color: THEME.darkBrown, marginBottom: 12 },
  divider:          { height: 1, backgroundColor: THEME.lightBeige, marginVertical: 12 },
  inputGroup:       { marginBottom: 15 },
  label:            { fontSize: 14, fontWeight: '600', color: THEME.gray, marginBottom: 5 },
  input:            { backgroundColor: THEME.lightBeige, borderRadius: 10, padding: 12, fontSize: 16, color: THEME.black, borderWidth: 1, borderColor: THEME.secondary },
  inputDisabled:    { backgroundColor: THEME.background, borderColor: THEME.lightBeige },
  saveButton:       { backgroundColor: THEME.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveButtonText:   { color: THEME.white, fontSize: 16, fontWeight: 'bold' },
  optionItem:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: THEME.lightBeige },
  optionLeft:       { flexDirection: 'row', alignItems: 'center', gap: 15 },
  optionText:       { fontSize: 16, color: THEME.darkBrown },
  logoutButton:     { backgroundColor: THEME.error, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, marginHorizontal: 15, borderRadius: 12, gap: 10, marginBottom: 10 },
  logoutButtonText: { color: THEME.white, fontSize: 16, fontWeight: 'bold' },
  loadingOverlay:   { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(245,222,179,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalBackdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard:        { width: '100%', maxWidth: 420, backgroundColor: THEME.white, borderRadius: 14, padding: 20 },
  modalTitle:       { fontSize: 20, fontWeight: 'bold', color: THEME.darkBrown, marginBottom: 10 },
  modalText:        { fontSize: 15, color: THEME.gray, marginBottom: 10 },
  modalName:        { fontSize: 16, color: THEME.darkBrown, marginBottom: 4, fontWeight: '600' },
  modalButton:      { marginTop: 16, alignSelf: 'flex-end', backgroundColor: THEME.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  modalButtonText:  { color: THEME.white, fontWeight: 'bold', fontSize: 14 },
});