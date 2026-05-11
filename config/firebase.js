import { initializeApp, getApps } from 'firebase/app';

import {
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';

import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBlJ6lkfelqbsW7L72OAQwrihf6OsidU88",
  authDomain: "easytrade-90538.firebaseapp.com",
  projectId: "easytrade-90538",
  storageBucket: "easytrade-90538.firebasestorage.app",
  messagingSenderId: "813702750761",
  appId: "1:813702750761:web:f0daaada711cb90cab3238",
};

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});