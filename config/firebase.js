import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBchxRAoLU2d9LJ9xrv40jjvtStZSdvSOE",
  authDomain: "gentleparent-e4900.firebaseapp.com",
  projectId: "gentleparent-e4900",
  storageBucket: "gentleparent-e4900.firebasestorage.app",
  messagingSenderId: "506810468724",
  appId: "1:506810468724:web:fbe443ce932edefa750421",
  measurementId: "G-41ZC502919"
};

const app = initializeApp(firebaseConfig);

// Auth persists between sessions. On native we use AsyncStorage persistence;
// getReactNativePersistence doesn't exist in the Firebase web SDK, so on web
// we use getAuth (default browser localStorage persistence).
export const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');

// Auto sign-in anonymously so Firebase function calls are authenticated
signInAnonymously(auth).catch(console.error);

export default app;