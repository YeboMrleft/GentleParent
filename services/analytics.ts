import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from '../config/firebase';

const APP_VERSION = '1.5.2';
const INSTALL_ID_KEY = 'install_id_v1';

const track = async (event: string, params: Record<string, any> = {}) => {
  try {
    await addDoc(collection(db, 'analytics_events'), {
      event,
      userId:     auth.currentUser?.uid ?? 'anonymous',
      platform:   Platform.OS,
      appVersion: APP_VERSION,
      timestamp:  serverTimestamp(),
      ...params,
    });
  } catch {
    // never crash the app for analytics
  }
};

// ── Run once per install: write a document to the `users` collection ──────────
export const registerInstall = async (): Promise<void> => {
  try {
    let installId = await AsyncStorage.getItem(INSTALL_ID_KEY);
    if (installId) return; // already registered

    installId = crypto.randomUUID();
    await AsyncStorage.setItem(INSTALL_ID_KEY, installId);

    await setDoc(doc(db, 'users', installId), {
      installId,
      platform:   Platform.OS,
      appVersion: APP_VERSION,
      firstSeen:  serverTimestamp(),
    });
  } catch {
    // never crash the app for analytics
  }
};

export const Analytics = {
  appOpen:           ()             => track('app_open'),
  screenView:        (screen: string)          => track('screen_view',        { screen }),
  featureUsed:       (feature: string)         => track('feature_used',       { feature }),
  paywallShown:      ()             => track('paywall_shown'),
  premiumConverted:  (plan: string)            => track('premium_converted',  { plan }),
  trialStarted:      (plan: string)            => track('trial_started',      { plan }),
  purchaseRestored:  ()             => track('purchase_restored'),
  companionMessage:  (companion: string)       => track('companion_message',  { companion }),
  scanUsed:          (scanType: string)        => track('scan_used',          { scanType }),
};
