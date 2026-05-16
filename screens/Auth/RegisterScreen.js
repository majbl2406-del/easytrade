import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  Animated, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps } from 'firebase/app';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useTheme } from '../../ThemeContext';
import api from '../../services/api';

const firebaseConfig = {
  apiKey: "AIzaSyBlJ6lkfelqbsW7L72OAQwrihf6OsidU88",
  authDomain: "easytrade-90538.firebaseapp.com",
  projectId: "easytrade-90538",
  storageBucket: "easytrade-90538.firebasestorage.app",
  messagingSenderId: "813702750761",
  appId: "1:813702750761:web:f0daaada711cb90cab3238",
};
if (!getApps().length) initializeApp(firebaseConfig);

// InputField EN DEHORS du composant ← CORRECTION DU BUG CLAVIER
const InputField = ({ label, fieldKey, placeholder, keyboard, secure, required, focusField, setFocusField, form, setField, THEME, isDark }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={{ fontSize: 13, fontWeight: '700', color: THEME.text, marginBottom: 6 }}>
      {label}{required && <Text style={{ color: '#F5C518' }}> *</Text>}
    </Text>
    <View style={{
      flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.inputBg,
      borderRadius: 12, borderWidth: 1.5,
      borderColor: focusField === fieldKey ? '#F5C518' : THEME.border,
      paddingHorizontal: 14, height: 48,
    }}>
      <TextInput
        style={{ flex: 1, fontSize: 14, color: THEME.text, fontWeight: '500' }}
        value={form[fieldKey]}
        onChangeText={(v) => setField(fieldKey, v)}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#6A5A4A' : '#C4A882'}
        keyboardType={keyboard || 'default'}
        secureTextEntry={!!secure}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
        onFocus={() => setFocusField(fieldKey)}
        onBlur={() => setFocusField('')}
      />
    </View>
  </View>
);

export default function RegisterScreen({ navigation, onAuthSuccess }) {
  const { THEME, isDark } = useTheme();

  const [form, setForm] = useState({
    nom: '', prenom: '', telephone: '', adresse: '',
    email: '', password: '', confirmPassword: '',
  });
  const [loading,    setLoading]    = useState(false);
  const [focusField, setFocusField] = useState('');

  const formAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(logoAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.spring(formAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
    ]).start();
  }, []);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    const { email, nom, prenom, password, confirmPassword } = form;
    if (!email || !nom || !prenom || !password) { Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires.'); return; }
    if (password.length < 6) { Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (password !== confirmPassword) { Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.'); return; }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email.trim().toLowerCase(), form.password);
      await sendEmailVerification(userCredential.user);

      try {
        await api.post('/auth/register', {
          nom:         form.nom.trim(),
          prenom:      form.prenom.trim(),
          telephone:   form.telephone.trim(),
          adresse:     form.adresse.trim(),
          email:       form.email.trim().toLowerCase(),
          password:    form.password,
          firebaseUid: userCredential.user.uid,
        });
      } catch (backendError) {
        await userCredential.user.delete();
        throw new Error('Erreur serveur lors de la création du compte. Veuillez réessayer.');
      }

      navigation.navigate('VerifyEmail', {
        email:     form.email.trim().toLowerCase(),
        nom:       form.nom.trim(),
        prenom:    form.prenom.trim(),
        telephone: form.telephone.trim(),
        adresse:   form.adresse.trim(),
      });
    } catch (error) {
      let message = error.message || "Erreur lors de l'inscription.";
      if (error.code === 'auth/email-already-in-use') message = 'Cet email est déjà utilisé.';
      else if (error.code === 'auth/invalid-email')   message = 'Adresse email invalide.';
      else if (error.code === 'auth/weak-password')   message = 'Mot de passe trop faible (minimum 6 caractères).';
      else if (error.code === 'auth/network-request-failed') message = 'Pas de connexion internet.';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(THEME, isDark);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* LOGO */}
        <Animated.View style={[styles.logoContainer, {
          opacity: logoAnim,
          transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
        }]}>
          <View style={styles.logoShadow}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.appName}>EasyTrade</Text>
          <View style={styles.taglineRow}>
            <View style={styles.taglineLine} />
            <Text style={styles.tagline}>Créer votre compte</Text>
            <View style={styles.taglineLine} />
          </View>
        </Animated.View>

        {/* FORMULAIRE */}
        <Animated.View style={[styles.formContainer, {
          opacity: formAnim,
          transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        }]}>
          <Text style={styles.title}>Inscription</Text>
          <Text style={styles.subtitle}>Rejoignez la communauté EasyTrade</Text>

          {/* Nom + Prénom */}
          <View style={{ flexDirection: 'row', marginBottom: 14 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Nom <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrapper, focusField === 'nom' && styles.inputWrapperFocused]}>
                <TextInput style={styles.input} value={form.nom} onChangeText={(v) => setField('nom', v)} placeholder="Nom" placeholderTextColor={isDark ? '#6A5A4A' : '#C4A882'} onFocus={() => setFocusField('nom')} onBlur={() => setFocusField('')} />
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Prénom <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrapper, focusField === 'prenom' && styles.inputWrapperFocused]}>
                <TextInput style={styles.input} value={form.prenom} onChangeText={(v) => setField('prenom', v)} placeholder="Prénom" placeholderTextColor={isDark ? '#6A5A4A' : '#C4A882'} onFocus={() => setFocusField('prenom')} onBlur={() => setFocusField('')} />
              </View>
            </View>
          </View>

          <InputField label="Téléphone"              fieldKey="telephone"       placeholder="+212 6 XX XX XX XX" keyboard="phone-pad"      focusField={focusField} setFocusField={setFocusField} form={form} setField={setField} THEME={THEME} isDark={isDark} />
          <InputField label="Adresse"                fieldKey="adresse"         placeholder="Votre adresse"                                focusField={focusField} setFocusField={setFocusField} form={form} setField={setField} THEME={THEME} isDark={isDark} />
          <InputField label="Email"                  fieldKey="email"           placeholder="email@exemple.com"  keyboard="email-address" required focusField={focusField} setFocusField={setFocusField} form={form} setField={setField} THEME={THEME} isDark={isDark} />
          <InputField label="Mot de passe"           fieldKey="password"        placeholder="Minimum 6 caractères" secure required        focusField={focusField} setFocusField={setFocusField} form={form} setField={setField} THEME={THEME} isDark={isDark} />
          <InputField label="Confirmer mot de passe" fieldKey="confirmPassword" placeholder="Retapez le mot de passe" secure required    focusField={focusField} setFocusField={setFocusField} form={form} setField={setField} THEME={THEME} isDark={isDark} />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>{loading ? 'Inscription...' : "S'inscrire"}</Text>
          </TouchableOpacity>

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.separatorLine} />
          </View>

          <TouchableOpacity style={styles.loginRow} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Déjà un compte ? </Text>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (THEME, isDark) => StyleSheet.create({
  container:           { flex: 1, backgroundColor: THEME.background },
  decorCircle1:        { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: isDark ? 'rgba(245,197,24,0.04)' : 'rgba(245,197,24,0.07)', top: -80, right: -80 },
  decorCircle2:        { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(92,61,30,0.05)', bottom: 60, left: -60 },
  content:             { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 40 },

  logoContainer:       { alignItems: 'center', marginBottom: 28 },
  logoShadow:          { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 10, borderRadius: 55, marginBottom: 14 },
  logoImage:           { width: 110, height: 110, borderRadius: 55 },
  appName:             { fontSize: 30, fontWeight: '800', color: THEME.text, letterSpacing: 0.5, marginBottom: 6 },
  taglineRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taglineLine:         { flex: 1, height: 1, backgroundColor: THEME.border, maxWidth: 40 },
  tagline:             { fontSize: 13, color: THEME.textSecondary, fontStyle: 'italic' },

  formContainer:       { backgroundColor: THEME.card, borderRadius: 24, paddingHorizontal: 22, paddingVertical: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.4 : 0.08, shadowRadius: 20, elevation: 6, borderWidth: 1, borderColor: THEME.border },
  title:               { fontSize: 24, fontWeight: '800', color: THEME.text, marginBottom: 4, letterSpacing: 0.3 },
  subtitle:            { fontSize: 13, color: THEME.textSecondary, marginBottom: 22 },

  label:               { fontSize: 13, fontWeight: '700', color: THEME.text, marginBottom: 6 },
  required:            { color: '#F5C518' },
  inputWrapper:        { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.inputBg, borderRadius: 12, borderWidth: 1.5, borderColor: THEME.border, paddingHorizontal: 14, height: 48 },
  inputWrapperFocused: { borderColor: '#F5C518', backgroundColor: isDark ? '#2A2500' : '#FFFDF8' },
  input:               { flex: 1, fontSize: 14, color: THEME.text, fontWeight: '500' },

  button:              { marginTop: 8, backgroundColor: THEME.primary, borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  buttonDisabled:      { opacity: 0.6 },
  buttonText:          { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },

  separator:           { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  separatorLine:       { flex: 1, height: 1, backgroundColor: THEME.border },
  separatorText:       { fontSize: 13, color: THEME.textSecondary, fontWeight: '600' },

  loginRow:            { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText:           { fontSize: 14, color: THEME.textSecondary },
  loginLink:           { fontSize: 14, color: THEME.text, fontWeight: '800', textDecorationLine: 'underline' },
});