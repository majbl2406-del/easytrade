import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Animated, ActivityIndicator,
} from 'react-native';
import { getAuth, sendEmailVerification, reload } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { THEME } from '../../theme';

const auth = getAuth();

export default function VerifyEmailScreen({ route, navigation }) {
const { email, nom, prenom, telephone, adresse } = route.params || {};
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Erreur', 'Session expirée. Veuillez vous réinscrire.');
        navigation.navigate('Register');
        return;
      }

      await reload(user);

      if (user.emailVerified) {
        const token = await user.getIdToken();
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify({
          uid:      user.uid,
          email:    user.email,
          nom,
          prenom,
          telephone,
          adresse,
        }));

        try {
          await api.post('/auth/verify-email', { email: user.email, firebaseUid: user.uid });
        } catch (_) {}

        if (navigation.reset) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } else {
        Alert.alert(
          'Email non vérifié',
          'Veuillez cliquer sur le lien dans l\'email que nous vous avons envoyé à ' + email,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de vérifier. Réessayez.');
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Erreur', 'Session expirée.');
        return;
      }
      await sendEmailVerification(user);
      setCountdown(60);
      Alert.alert('Email envoyé', 'Un nouvel email de vérification a été envoyé à ' + email);
    } catch (error) {
      if (error.code === 'auth/too-many-requests') {
        Alert.alert('Trop de tentatives', 'Veuillez attendre avant de renvoyer un email.');
        setCountdown(60);
      } else {
        Alert.alert('Erreur', 'Impossible d\'envoyer l\'email. Réessayez.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        <View style={styles.iconWrapper}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>✉️</Text>
          </View>
        </View>

        <Text style={styles.title}>Vérifiez votre email</Text>
        <Text style={styles.subtitle}>Nous avons envoyé un lien de vérification à</Text>
        <Text style={styles.email}>{email}</Text>

        <View style={styles.stepsBox}>
          <StepRow number="1" text="Ouvrez votre boîte email" />
          <StepRow number="2" text="Cliquez sur le lien de vérification" />
          <StepRow number="3" text="Revenez ici et appuyez sur 'J'ai vérifié'" />
        </View>

        <TouchableOpacity
          style={[styles.button, checking && styles.buttonDisabled]}
          onPress={handleCheckVerification}
          disabled={checking}
          activeOpacity={0.85}
        >
          {checking
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <Text style={styles.buttonText}>✓  J'ai vérifié mon email</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resendButton, (countdown > 0 || resending) && styles.resendDisabled]}
          onPress={handleResendEmail}
          disabled={countdown > 0 || resending}
          activeOpacity={0.7}
        >
          {resending
            ? <ActivityIndicator color="#A0784A" size="small" />
            : <Text style={[styles.resendText, countdown > 0 && styles.resendTextDisabled]}>
                {countdown > 0 ? `Renvoyer dans ${countdown}s` : "Renvoyer l'email"}
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.backRow} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.backText}>← Modifier mon email</Text>
        </TouchableOpacity>

      </Animated.View>
    </View>
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
  container:          { flex: 1, backgroundColor: THEME.background, justifyContent: 'center' },
  decorCircle1:       { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(196,160,0,0.07)', top: -60, right: -80 },
  decorCircle2:       { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(92,60,31,0.05)', bottom: 80, left: -50 },

  content:            { marginHorizontal: 28, backgroundColor: THEME.white, borderRadius: 28, padding: 30, shadowColor: THEME.darkBrown, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 8, borderWidth: 1, borderColor: THEME.lightBeige, alignItems: 'center' },

  iconWrapper:        { marginBottom: 20 },
  iconCircle:         { width: 90, height: 90, borderRadius: 45, backgroundColor: THEME.lightBeige, borderWidth: 2, borderColor: THEME.accent, justifyContent: 'center', alignItems: 'center', shadowColor: THEME.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  iconEmoji:          { fontSize: 40 },

  title:              { fontSize: 24, fontWeight: '800', color: THEME.darkBrown, marginBottom: 8, letterSpacing: 0.3, textAlign: 'center' },
  subtitle:           { fontSize: 14, color: THEME.gray, textAlign: 'center', marginBottom: 4 },
  email:              { fontSize: 15, fontWeight: '700', color: THEME.primary, marginBottom: 24, textAlign: 'center' },

  stepsBox:           { width: '100%', backgroundColor: THEME.lightBeige, borderRadius: 14, padding: 16, marginBottom: 24, gap: 12 },
  stepRow:            { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBadge:          { width: 28, height: 28, borderRadius: 14, backgroundColor: THEME.accent, justifyContent: 'center', alignItems: 'center' },
  stepNumber:         { fontSize: 13, fontWeight: '800', color: THEME.darkBrown },
  stepText:           { fontSize: 13, color: THEME.primary, fontWeight: '500', flex: 1 },

  button:             { width: '100%', backgroundColor: THEME.darkBrown, borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center', shadowColor: THEME.darkBrown, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, marginBottom: 12 },
  buttonDisabled:     { backgroundColor: THEME.gray },
  buttonText:         { color: THEME.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  resendButton:       { paddingVertical: 10, paddingHorizontal: 20 },
  resendDisabled:     { opacity: 0.5 },
  resendText:         { fontSize: 14, color: THEME.gray, fontWeight: '600', textDecorationLine: 'underline' },
  resendTextDisabled: { textDecorationLine: 'none', color: THEME.gray },

  backRow:            { marginTop: 16 },
  backText:           { fontSize: 13, color: THEME.gray, fontWeight: '500' },
});