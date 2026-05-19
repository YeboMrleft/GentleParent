import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth, signInAnonymously } from 'firebase/auth';
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

// ✅ Auth now persists between sessions using AsyncStorage
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');

// Auto sign-in anonymously so Firebase function calls are authenticated
signInAnonymously(auth).catch(console.error);

export default app;