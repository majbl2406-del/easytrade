import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, Alert, KeyboardAvoidingView, Platform,
  Animated, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useTheme } from '../../ThemeContext';
import api from '../../services/api';
import { auth } from '../../config/firebase';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation, onAuthSuccess }) {
  const { THEME, isDark } = useTheme();

  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [loading,       setLoading]       = useState(false);
  const [focusEmail,    setFocusEmail]    = useState(false);
  const [focusPassword, setFocusPassword] = useState(false);

  const logoAnim    = useRef(new Animated.Value(0)).current;
  const formAnim    = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(180, [
      Animated.spring(logoAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.spring(formAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Erreur', 'Veuillez remplir tous les champs'); return; }

    Animated.sequence([
      Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true, speed: 50 }),
      Animated.spring(buttonScale, { toValue: 1,    useNativeDriver: true, speed: 50 }),
    ]).start();

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const idToken = await userCredential.user.getIdToken();
      const response = await api.post('/auth/login-firebase', { idToken });

      if (response.data.success) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        if (onAuthSuccess) onAuthSuccess();
      } else {
        Alert.alert('Erreur', response.data.message || 'Identifiants incorrects');
      }
    } catch (error) {
      let message = 'Erreur de connexion. Veuillez réessayer.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') message = 'Email ou mot de passe incorrect.';
      else if (error.code === 'auth/user-not-found')        message = 'Aucun compte trouvé avec cet email.';
      else if (error.code === 'auth/too-many-requests')     message = 'Trop de tentatives. Réessayez plus tard.';
      else if (error.code === 'auth/network-request-failed') message = 'Pas de connexion internet.';
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(THEME, isDark, focusEmail, focusPassword);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <View style={styles.content}>

        {/* LOGO */}
        <Animated.View style={[styles.logoContainer, {
          opacity: logoAnim,
          transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
        }]}>
          <View style={styles.logoShadow}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.appName}>EasyTrade</Text>
          <View style={styles.taglineRow}>
            <View style={styles.taglineLine} />
            <Text style={styles.tagline}>Votre partenaire commercial</Text>
            <View style={styles.taglineLine} />
          </View>
        </Animated.View>

        {/* FORMULAIRE */}
        <Animated.View style={[styles.formContainer, {
          opacity: formAnim,
          transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        }]}>
          <Text style={styles.welcomeText}>Connexion</Text>

          <View style={[styles.inputWrapper, focusEmail && styles.inputWrapperFocused]}>
            <TextInput
              style={styles.input}
              placeholder="Adresse email"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusEmail(true)}
              onBlur={() => setFocusEmail(false)}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={isDark ? '#6A5A4A' : '#C4A882'}
            />
          </View>

          <View style={[styles.inputWrapper, focusPassword && styles.inputWrapperFocused]}>
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusPassword(true)}
              onBlur={() => setFocusPassword(false)}
              secureTextEntry
              placeholderTextColor={isDark ? '#6A5A4A' : '#C4A882'}
            />
          </View>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.forgotRow}>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.separatorLine} />
          </View>

          <TouchableOpacity style={styles.registerRow} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>Pas encore de compte ? </Text>
            <Text style={styles.registerLink}>S'inscrire</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (THEME, isDark, focusEmail, focusPassword) => StyleSheet.create({
  container:           { flex: 1, backgroundColor: THEME.background },
  decorCircle1:        { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: isDark ? 'rgba(245,197,24,0.04)' : 'rgba(245,197,24,0.07)', top: -80, right: -80 },
  decorCircle2:        { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(92,61,30,0.05)', bottom: 60, left: -60 },
  content:             { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },

  logoContainer:       { alignItems: 'center', marginBottom: 36 },
  logoShadow:          { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 10, borderRadius: 75, marginBottom: 16 },
  logoImage:           { width: 140, height: 140, borderRadius: 70 },
  appName:             { fontSize: 34, fontWeight: '800', color: THEME.text, letterSpacing: 0.5, marginBottom: 8 },
  taglineRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taglineLine:         { flex: 1, height: 1, backgroundColor: THEME.border, maxWidth: 40 },
  tagline:             { fontSize: 13, color: THEME.textSecondary, fontStyle: 'italic', letterSpacing: 0.3 },

  formContainer:       { backgroundColor: THEME.card, borderRadius: 24, paddingHorizontal: 24, paddingVertical: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.4 : 0.08, shadowRadius: 20, elevation: 6, borderWidth: 1, borderColor: THEME.border },
  welcomeText:         { fontSize: 24, fontWeight: '800', color: THEME.text, marginBottom: 24, letterSpacing: 0.3 },

  inputWrapper:        { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.inputBg, borderRadius: 14, borderWidth: 1.5, borderColor: THEME.border, paddingHorizontal: 14, height: 52, marginBottom: 14 },
  inputWrapperFocused: { borderColor: '#F5C518', backgroundColor: isDark ? '#2A2500' : '#FFFDF8' },
  input:               { flex: 1, fontSize: 15, color: THEME.text, fontWeight: '500' },

  forgotText:          { fontSize: 13, color: THEME.textSecondary, fontWeight: '600' },
  forgotRow:           { alignItems: 'center', marginTop: 14, marginBottom: 4 },

  button:              { backgroundColor: THEME.primary, borderRadius: 14, height: 54, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  buttonDisabled:      { opacity: 0.6 },
  buttonText:          { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },

  separator:           { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  separatorLine:       { flex: 1, height: 1, backgroundColor: THEME.border },
  separatorText:       { fontSize: 13, color: THEME.textSecondary, fontWeight: '600' },

  registerRow:         { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText:        { fontSize: 14, color: THEME.textSecondary },
  registerLink:        { fontSize: 14, color: THEME.text, fontWeight: '800', textDecorationLine: 'underline' },
});