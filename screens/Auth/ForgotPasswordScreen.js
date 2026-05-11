import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, Animated,
  Image, ActivityIndicator,
} from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBlJ6lkfelqbsW7L72OAQwrihf6OsidU88",
  authDomain: "easytrade-90538.firebaseapp.com",
  projectId: "easytrade-90538",
  storageBucket: "easytrade-90538.firebasestorage.app",
  messagingSenderId: "813702750761",
  appId: "1:813702750761:web:f0daaada711cb90cab3238",
};

if (!getApps().length) initializeApp(firebaseConfig);
const auth = getAuth();

export default function ForgotPasswordScreen({ navigation }) {
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [focused,   setFocused]   = useState(false);
  const [countdown, setCountdown] = useState(0);

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (sent) {
      Animated.spring(successAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
    }
  }, [sent]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendReset = async () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre adresse email.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Erreur', 'Adresse email invalide.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setSent(true);
      setCountdown(60);
    } catch (error) {
      let message = "Erreur lors de l'envoi de l'email.";
      if (error.code === 'auth/user-not-found')    message = 'Aucun compte trouvé avec cet email.';
      if (error.code === 'auth/invalid-email')     message = 'Adresse email invalide.';
      if (error.code === 'auth/too-many-requests') message = 'Trop de tentatives. Réessayez plus tard.';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setCountdown(60);
      Alert.alert('Email envoyé', 'Un nouvel email a été envoyé.');
    } catch (_) {
      Alert.alert('Erreur', "Impossible d'envoyer l'email. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoShadow}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.appName}>EasyTrade</Text>
        </View>

        <View style={styles.card}>
          {!sent ? (
            <>
              <View style={styles.iconCircle}>
                <Text style={styles.iconEmoji}>🔑</Text>
              </View>
              <Text style={styles.title}>Mot de passe oublié ?</Text>
              <Text style={styles.subtitle}>
                Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </Text>

              <Text style={styles.label}>Adresse email <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@exemple.com"
                  placeholderTextColor="#C4A882"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendReset}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={styles.buttonText}>Envoyer le lien</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.backRow} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.backText}>← Retour à la connexion</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Animated.View style={[styles.successContainer, {
              opacity: successAnim,
              transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
            }]}>
              <View style={styles.successIcon}>
                <Text style={styles.successEmoji}>📬</Text>
              </View>
              <Text style={styles.successTitle}>Email envoyé !</Text>
              <Text style={styles.successText}>Nous avons envoyé un lien de réinitialisation à</Text>
              <Text style={styles.successEmail}>{email}</Text>

              <View style={styles.stepsBox}>
                <StepRow number="1" text="Ouvrez votre boîte email" />
                <StepRow number="2" text="Cliquez sur le lien de réinitialisation" />
                <StepRow number="3" text="Créez votre nouveau mot de passe" />
              </View>

              <TouchableOpacity
                style={[styles.button, (countdown > 0 || loading) && styles.buttonDisabled]}
                onPress={handleResend}
                disabled={countdown > 0 || loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={styles.buttonText}>
                      {countdown > 0 ? `Renvoyer dans ${countdown}s` : "Renvoyer l'email"}
                    </Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.backRow} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.backText}>← Retour à la connexion</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

function StepRow({ number, text }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepNumber}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#FDFAF6', justifyContent: 'center' },
  decorCircle1:       { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(245,197,24,0.07)', top: -60, right: -80 },
  decorCircle2:       { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(92,61,30,0.05)', bottom: 80, left: -50 },

  content:            { marginHorizontal: 24 },

  logoContainer:      { alignItems: 'center', marginBottom: 24 },
  logoShadow:         { shadowColor: '#5C3D1E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 10, borderRadius: 45, marginBottom: 10 },
  logoImage:          { width: 90, height: 90, borderRadius: 45 },
  appName:            { fontSize: 26, fontWeight: '800', color: '#3E2510', letterSpacing: 0.5 },

  card:               { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 28, shadowColor: '#3E2510', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 8, borderWidth: 1, borderColor: '#F0E8DA', alignItems: 'center' },

  iconCircle:         { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF8EC', borderWidth: 2, borderColor: '#F5C518', justifyContent: 'center', alignItems: 'center', marginBottom: 18, shadowColor: '#F5C518', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  iconEmoji:          { fontSize: 36 },

  title:              { fontSize: 22, fontWeight: '800', color: '#3E2510', marginBottom: 8, textAlign: 'center', letterSpacing: 0.3 },
  subtitle:           { fontSize: 13, color: '#A0784A', textAlign: 'center', lineHeight: 20, marginBottom: 22 },

  label:              { alignSelf: 'flex-start', fontSize: 13, fontWeight: '700', color: '#5C3D1E', marginBottom: 6 },
  required:           { color: '#F5C518' },

  inputWrapper:       { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAF6F0', borderRadius: 12, borderWidth: 1.5, borderColor: '#EDE3D3', paddingHorizontal: 14, height: 50, marginBottom: 20 },
  inputWrapperFocused:{ borderColor: '#F5C518', backgroundColor: '#FFFDF8', shadowColor: '#F5C518', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  input:              { flex: 1, fontSize: 14, color: '#3E2510', fontWeight: '500' },

  button:             { width: '100%', backgroundColor: '#3E2510', borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center', shadowColor: '#3E2510', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, marginBottom: 14 },
  buttonDisabled:     { backgroundColor: '#A0784A' },
  buttonText:         { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  backRow:            { paddingVertical: 4 },
  backText:           { fontSize: 13, color: '#B89878', fontWeight: '500' },

  successContainer:   { width: '100%', alignItems: 'center' },
  successIcon:        { width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFF8EC', borderWidth: 2, borderColor: '#F5C518', justifyContent: 'center', alignItems: 'center', marginBottom: 18, shadowColor: '#F5C518', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  successEmoji:       { fontSize: 40 },
  successTitle:       { fontSize: 22, fontWeight: '800', color: '#3E2510', marginBottom: 8, textAlign: 'center' },
  successText:        { fontSize: 13, color: '#A0784A', textAlign: 'center', marginBottom: 4 },
  successEmail:       { fontSize: 15, fontWeight: '700', color: '#5C3D1E', marginBottom: 20, textAlign: 'center' },

  stepsBox:           { width: '100%', backgroundColor: '#FAF6F0', borderRadius: 14, padding: 16, marginBottom: 22, gap: 12 },
  stepRow:            { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBadge:          { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5C518', justifyContent: 'center', alignItems: 'center' },
  stepNumber:         { fontSize: 13, fontWeight: '800', color: '#3E2510' },
  stepText:           { fontSize: 13, color: '#5C3D1E', fontWeight: '500', flex: 1 },
});