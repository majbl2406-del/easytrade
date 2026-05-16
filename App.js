import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// i18n
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { I18nManager } from 'react-native';
I18nManager.forceRTL(false);
I18nManager.allowRTL(false);

// Theme
import { ThemeProvider, useTheme } from './ThemeContext';

// Import des écrans
import LoginScreen from './screens/Auth/LoginScreen';
import RegisterScreen from './screens/Auth/RegisterScreen';
import VerifyEmailScreen from './screens/Auth/VerifyEmailScreen';
import ForgotPasswordScreen from './screens/Auth/ForgotPasswordScreen';
import HomeScreen from './screens/Home/HomeScreen';
import FournisseursScreen from './screens/Fournisseurs/FournisseursScreen';
import ProduitsScreen from './screens/Produits/ProduitsScreen';
import CommandesScreen from './screens/Commandes/CommandesScreen';
import FormationsScreen from './screens/Formations/FormationsScreen';
import ProfileScreen from './screens/Profile/ProfileScreen';
import PointsScreen from './screens/Points/PointsScreen';
import HistoriqueScreen from './screens/HistoriqueScreen';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ onLogout }) {
  const { t } = useLanguage();
  const { THEME } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Accueil:      'home',
            Fournisseurs: 'store',
            Commandes:    'shopping-cart',
            Formations:   'school',
            Profil:       'person',
          };
          return <MaterialIcons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor:   THEME.primary,
        tabBarInactiveTintColor: THEME.gray,
        tabBarHideOnKeyboard:    true,
        tabBarStyle: {
          backgroundColor: THEME.surface,
          position: 'absolute',
          left: 14, right: 14, bottom: 10,
          borderTopWidth: 0,
          borderRadius: 18,
          height: 66,
          paddingBottom: 8, paddingTop: 8,
          elevation: 12,
          shadowColor: THEME.black,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.18,
          shadowRadius: 12,
        },
        tabBarItemStyle:  { borderRadius: 12, marginHorizontal: 2 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        sceneContainerStyle: { backgroundColor: THEME.background },
        headerStyle:      { backgroundColor: THEME.primary },
        headerTintColor:  THEME.white,
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Accueil"      component={HomeScreen}         options={{ title: t('tab_home') }} />
      <Tab.Screen name="Fournisseurs" component={FournisseursScreen} options={{ title: t('tab_suppliers') }} />
      <Tab.Screen name="Commandes"    component={CommandesScreen}    options={{ title: t('tab_orders') }} />
      <Tab.Screen name="Formations"   component={FormationsScreen}   options={{ title: t('tab_trainings') }} />
      <Tab.Screen
        name="Profil"
        options={{ title: t('tab_profile') }}
        children={(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { t } = useLanguage();
  const { THEME } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuthStatus(); }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background }}>
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          ...TransitionPresets.SlideFromRightIOS,
          gestureEnabled: true,
          headerStyle:      { backgroundColor: THEME.primary },
          headerTintColor:  THEME.white,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen
              name="Login"
              children={(props) => <LoginScreen {...props} onAuthSuccess={() => setIsAuthenticated(true)} />}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              children={(props) => <RegisterScreen {...props} onAuthSuccess={() => setIsAuthenticated(true)} />}
              options={{ title: t('screen_register') }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="VerifyEmail"
              component={VerifyEmailScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              children={(props) => (
                <MainTabs
                  {...props}
                  onLogout={async () => {
                    await AsyncStorage.clear();
                    setIsAuthenticated(false);
                  }}
                />
              )}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Produits"
              component={ProduitsScreen}
              options={{ title: t('screen_products') }}
            />
            <Stack.Screen
              name="Points"
              component={PointsScreen}
              options={{ title: t('screen_points') }}
            />
            <Stack.Screen
              name="Historique"
              component={HistoriqueScreen}
              options={{ title: 'Historique' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// AppNavigator doit être dans ThemeProvider pour accéder à useTheme()
function Root() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default Root;