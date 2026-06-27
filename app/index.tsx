import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { Alert, Appearance, BackHandler, Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { ThemeProvider, useThemeContext } from '../context/ThemeContext';
import AboutScreen from '../components/AboutScreen';
import BraKScreen from '../components/BraKScreen';
import NovelReaderScreen from '../components/NovelReaderScreen';
import ClinicCardScanner from '../components/ClinicCardScanner';
import ChatScreen from '../components/ChatScreen';
import ChoreChart from '../components/ChoreChart';
import CompanionsScreen from '../components/CompanionsScreen';
import DevelopmentTracker from '../components/DevelopmentTracker';
import GentleParentSplash from '../components/GentleParentSplash';
import GirlTalkScreen from '../components/GirlTalkScreen';
import HomeScreen from '../components/HomeScreen';
import HomeworkHelper from '../components/HomeworkHelper';
import HomeworkReminder from '../components/HomeworkReminder';
import InkaTechSplash from '../components/InkaTechSplash';
import LearnAndPlay from '../components/LearnAndPlay';
import { NotificationCentre } from '../components/NotificationCentre';
import OnboardingScreen from '../components/OnboardingScreen';
import PaywallModal from '../components/PaywallModal';
import FAQScreen from '../components/FAQScreen';
import WalkthroughModal from '../components/WalkthroughModal';
import ReportCardScanner from '../components/ReportCardScanner';
import GradeRPrepGuide from '../components/GradeRPrepGuide';
import MedicationReminders from '../components/MedicationReminders';
import SchoolHubScreen from '../components/SchoolHubScreen';
import SchoolScheduleScanner from '../components/SchoolScheduleScanner';
import SchoolReadinessTracker from '../components/SchoolReadinessTracker';
import SettingsScreen from '../components/SettingsScreen';
import TeacherCommsScreen from '../components/TeacherCommsScreen';
import TermPlanner from '../components/TermPlanner';
import * as WebBrowser from 'expo-web-browser';
import { createPayfastPaymentUrl, checkHuaweiPremium, onAuthChange } from '../services/firebase';
import AccountScreen from '../components/AccountScreen';
import { isHuaweiDevice, getInstallId } from '../utils/platform';
import { requestNotificationPermission } from '../services/notificationService';
import { Analytics, registerInstall } from '../services/analytics';
import { getNotifSettings, rescheduleMedicationReminders, scheduleDailyTip, scheduleChildBirthdayReminder, scheduleChoreReminder, scheduleCompanionCheckIn, scheduleEngagementNotifications, scheduleGirlTalkReminder, scheduleHomeworkReminder, scheduleNovelSpotlight, scheduleWeatherNotification, setupNotifications } from '../utils/notifications';
import { getCompanionMessageCount, getMessageCount } from '../utils/paywall';
import { initSounds, setSoundEnabled } from '../utils/sounds';
import { scheduleBraKDailyNudge } from '../utils/braKNotification';
import { scheduleLesediDailyNudge } from '../utils/lesediNotification';

// ── Themes ────────────────────────────────────────────────────────────────────
const momTheme = {
  background:           '#FFF0F5',
  header:               '#E75480',
  headerShadow:         '#c0396a',
  logoText:             '#E75480',
  cardText:             '#3D001A',
  cardSubText:          '#994466',
  botBubble:            '#FFFFFF',
  userBubble:           '#E75480',  
  userBubbleText:       '#FFFFFF',  
  quickQuestionsBorder: '#F8C8D8',
  inputBorder:          '#F8C8D8',
  inputBackground:      '#FFF8FB',
  aboutButton:          '#FFD6E7',
  footerText:           '#bb6688',
  subText:              '#bb6688',
};

const dadTheme = {
  background:           '#F0F4FF',
  header:               '#2C5F8A',
  headerShadow:         '#1a3f5c',
  logoText:             '#2C5F8A',
  cardText:             '#0D1B2A',
  cardSubText:          '#4A6FA5',
  botBubble:            '#FFFFFF',
  userBubble:           '#2C5F8A',  
  userBubbleText:       '#FFFFFF',  
  quickQuestionsBorder: '#C5D8F0',
  inputBorder:          '#C5D8F0',
  inputBackground:      '#F5F8FF',
  aboutButton:          '#D6E8FF',
  footerText:           '#6688aa',
  subText:              '#6688aa',
};

// ── Screen type ───────────────────────────────────────────────────────────────
type Screen =
  | 'splash_inka'
  | 'splash_gp'
  | 'onboarding'
  | 'home'
  | 'chat'
  | 'girlTalk'
  | 'braK'
  | 'tracker'
  | 'learnPlay'
  | 'companions'
  | 'about'
  | 'settings'
  | 'account'
  | 'notificationCentre'
  | 'schoolHub'
  | 'reportCard'
  | 'homeworkHelper'
  | 'homeworkReminder'
  | 'teacherComms'
  | 'choreChart'
  | 'medicationReminders'
  | 'schoolReadiness'
  | 'termPlanner'
  | 'gradeRGuide'
  | 'novels'
  | 'faqs'
  | 'clinicCard'
  | 'schoolSchedule';

type ChildProfile = {
  id: string;
  name: string;
  birthday?: string;
};

const CHILDREN_KEY = 'children_v1';

// Set true to unlock all premium screens for testing without bypassing the message counter
const UNLOCK_ALL_SCREENS = false;
const ACTIVE_CHILD_KEY = 'active_child_id';

function IndexContent() {
  const { theme: contextTheme } = useThemeContext();
  const [screen,       setScreen]       = useState<Screen>('splash_inka');
  const [userName,     setUserName]     = useState('');
  const [children,     setChildren]     = useState<ChildProfile[]>([]);
  const [activeChildId, setActiveChildId] = useState('');
  const [parentGender, setParentGender] = useState('');
  const [themeMode,    setThemeMode]    = useState<'light' | 'dark' | 'system'>('system');
  const [systemIsDark, setSystemIsDark] = useState(Appearance.getColorScheme() === 'dark');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const isDarkMode = themeMode === 'dark' || (themeMode === 'system' && systemIsDark);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [showPaywall,     setShowPaywall]     = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [isPremium,    setIsPremium]    = useState(false);
  const [isPurchasesConfigured, setIsPurchasesConfigured] = useState(false);
  const [isLoaded,     setIsLoaded]     = useState(false);
  const [companionMsgCount, setCompanionMsgCount] = useState(0);
  const [parentingMsgCount, setParentingMsgCount] = useState(0);

  const activeChild = children.find((c) => c.id === activeChildId) ?? children[0] ?? null;
  const childName = activeChild?.name ?? '';
  const childBirthday = activeChild?.birthday ?? '';

  const makeChild = (name: string, birthday?: string): ChildProfile => ({
    id: `child_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    birthday,
  });

  const persistChildren = async (nextChildren: ChildProfile[], nextActiveChildId: string) => {
    const selected = nextChildren.find((c) => c.id === nextActiveChildId) ?? nextChildren[0] ?? null;
    const selectedId = selected?.id ?? '';

    await AsyncStorage.multiSet([
      [CHILDREN_KEY, JSON.stringify(nextChildren)],
      [ACTIVE_CHILD_KEY, selectedId],
      ['child_name', selected?.name ?? ''],
      ['child_birthday', selected?.birthday ?? ''],
    ]);

    setChildren(nextChildren);
    setActiveChildId(selectedId);
  };

  // Match the entitlement identifier set in your RevenueCat dashboard.
  const ENTITLEMENT_ID = 'premium';

  const hasActiveEntitlement = (info?: CustomerInfo | null): boolean => {
    if (!info) return false;
    // Primary: check the named entitlement from the RevenueCat dashboard.
    if (info.entitlements.active[ENTITLEMENT_ID] !== undefined) return true;
    // Fallback: any active entitlement (handles renamed/multiple entitlements).
    return Object.keys(info.entitlements.active).length > 0;
  };

  const configurePurchases = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return false;
    }

    const config = Constants.expoConfig?.extra ?? {};
    const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? config.revenuecatAndroidApiKey;
    const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? config.revenuecatIosApiKey;
    const apiKey = Platform.OS === 'android' ? androidKey : iosKey;

    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    try {
      Purchases.configure({ apiKey });
      return true;
    } catch {
      return false;
    }
  };

  const refreshPremiumStatus = async () => {
    if (!isPurchasesConfigured) {
      setIsPremium(false);
      return;
    }

    try {
      const info = await Purchases.getCustomerInfo();
      setIsPremium(hasActiveEntitlement(info));
    } catch {
      setIsPremium(false);
    }
  };

  const findPackageForPlan = (plan: string, availablePackages: PurchasesPackage[]) => {
    if (plan === 'yearly') {
      return availablePackages.find((p) => p.packageType === Purchases.PACKAGE_TYPE.ANNUAL);
    }
    return availablePackages.find((p) => p.packageType === Purchases.PACKAGE_TYPE.MONTHLY);
  };

  const openPaywall = () => {
    Analytics.paywallShown();
    setShowPaywall(true);
  };

  const handleSubscribe = async (plan: string) => {
    if (!isPurchasesConfigured) {
      Alert.alert('Subscriptions unavailable', 'RevenueCat is not configured yet. Add your API keys and rebuild.');
      return;
    }

    try {
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;

      if (!currentOffering) {
        Alert.alert('Not available', 'No subscription offering is available right now.');
        return;
      }

      const selectedPackage = findPackageForPlan(plan, currentOffering.availablePackages);
      if (!selectedPackage) {
        Alert.alert('Plan unavailable', 'That subscription plan is not available right now.');
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      const premiumUnlocked = hasActiveEntitlement(customerInfo);
      setIsPremium(premiumUnlocked);

      if (premiumUnlocked) {
        Analytics.premiumConverted(plan);
        setShowPaywall(false);
      }
    } catch (error: any) {
      if (!error?.userCancelled) {
        Alert.alert('Purchase failed', 'Could not complete purchase. Please try again.');
      }
    }
  };

  const handleRestore = async () => {
    if (!isPurchasesConfigured) {
      Alert.alert('Restore unavailable', 'RevenueCat is not configured yet. Add your API keys and rebuild.');
      return;
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      const premiumUnlocked = hasActiveEntitlement(customerInfo);
      setIsPremium(premiumUnlocked);

      if (premiumUnlocked) {
        Analytics.purchaseRestored();
        setShowPaywall(false);
      } else {
        Alert.alert('No purchase found', 'We could not find an active subscription to restore.');
      }
    } catch {
      Alert.alert('Restore failed', 'Could not restore purchases right now. Please try again.');
    }
  };

// Web: paywall "Pay via PayFast" routes to the Account screen (sign in → subscribe).
const handlePaywallPayFast = () => {
  if (Platform.OS === 'web') { setShowPaywall(false); setScreen('account'); }
  else handlePayFastSubscribe();
};

// Web: restore Premium for a signed-in account, and finish a PayFast return.
useEffect(() => {
  if (Platform.OS !== 'web') return;
  let isReturn = false;
  try { isReturn = new URLSearchParams(window.location.search).get('sub') === 'success'; } catch {}
  const unsub = onAuthChange((u) => {
    if (!u || u.isAnonymous) return;
    (async () => {
      for (let i = 0; i < (isReturn ? 6 : 1); i++) {
        const premium = await checkHuaweiPremium(u.uid);
        if (premium) { setIsPremium(true); break; }
        if (isReturn) await new Promise((r) => setTimeout(r, 2500));
      }
    })();
  });
  return unsub;
}, []);

const handlePayFastSubscribe = async () => {
    try {
      const installId = await getInstallId();
      const url = await createPayfastPaymentUrl(installId, userName || 'User');
      if (!url) { Alert.alert('Error', 'Could not create payment link. Please try again.'); return; }
      await WebBrowser.openBrowserAsync(url);
      // Give ITN a moment to arrive then check Firestore
      await new Promise(r => setTimeout(r, 2500));
      const premium = await checkHuaweiPremium(installId);
      if (premium) {
        setIsPremium(true);
        setShowPaywall(false);
        Analytics.premiumConverted('payfast_monthly');
      } else {
        Alert.alert('Payment pending', 'If you completed payment, your premium will activate within a minute. Tap "Restore Purchase" to check again.');
      }
    } catch {
      Alert.alert('Payment error', 'Could not open payment page. Please try again.');
    }
  };

const handleSetThemeMode = async (mode: 'light' | 'dark' | 'system') => {
  setThemeMode(mode);
  await AsyncStorage.setItem('theme_mode', mode);
};

const handleToggleSound = async () => {
  const newVal = !soundEnabled;
  setSoundEnabled(newVal);
  await AsyncStorage.setItem('sound_enabled', String(newVal));
};

  const baseTheme = parentGender === 'mom' ? momTheme : dadTheme;
  const theme = isDarkMode ? {
    ...baseTheme,
    background:           '#111111',
    cardText:             '#EEEEEE',
    cardSubText:          '#AAAAAA',
    botBubble:            '#1E1E1E',
    quickQuestionsBorder: '#333333',
    inputBorder:          '#333333',
    inputBackground:      '#1A1A1A',
    aboutButton:          '#2A2A2A',
    footerText:           '#888888',
    subText:              '#888888',
  } : baseTheme;

  // ── Sync sound toggle to module-level flag ────────────────────────────
  useEffect(() => {
    setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // ── Track live system theme changes ─────────────────────────────────────
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemIsDark(colorScheme === 'dark');
    });
    return () => sub.remove();
  }, []);

  // ── Load persisted user data ─────────────────────────────────────────────
useEffect(() => {
  (async () => {
    try {
    const [
      name,
      legacyChildName,
      gender,
      legacyChildBirthday,
      savedThemeMode,
      legacyDarkMode,
      soundEnabledStr,
      walkthroughSeen,
      companionCount,
      parentingCount,
      childrenJson,
      storedActiveChildId,
    ] = await Promise.all([
      AsyncStorage.getItem('user_name'),
      AsyncStorage.getItem('child_name'),
      AsyncStorage.getItem('parent_gender'),
      AsyncStorage.getItem('child_birthday'),
      AsyncStorage.getItem('theme_mode'),
      AsyncStorage.getItem('dark_mode'),
      AsyncStorage.getItem('sound_enabled'),
      AsyncStorage.getItem('walkthrough_seen'),
      getCompanionMessageCount(),
      getMessageCount(),
      AsyncStorage.getItem(CHILDREN_KEY),
      AsyncStorage.getItem(ACTIVE_CHILD_KEY),
    ]);

    let nextChildren: ChildProfile[] = [];
    if (childrenJson) {
      try {
        const parsed = JSON.parse(childrenJson);
        if (Array.isArray(parsed)) {
          nextChildren = parsed.filter((item) => (
            item && typeof item.id === 'string' && typeof item.name === 'string'
          ));
        }
      } catch {
        nextChildren = [];
      }
    }

    if (nextChildren.length === 0 && legacyChildName) {
      nextChildren = [makeChild(legacyChildName, legacyChildBirthday || undefined)];
    }

    let nextActiveChildId = storedActiveChildId || '';
    if (!nextChildren.find((c) => c.id === nextActiveChildId)) {
      nextActiveChildId = nextChildren[0]?.id ?? '';
    }

    if (nextChildren.length > 0) {
      await persistChildren(nextChildren, nextActiveChildId);
    }

    if (name)   setUserName(name);
    if (gender) setParentGender(gender);
    if (savedThemeMode === 'light' || savedThemeMode === 'dark' || savedThemeMode === 'system') {
      setThemeMode(savedThemeMode);
    } else if (legacyDarkMode !== null) {
      setThemeMode(legacyDarkMode === 'true' ? 'dark' : 'light');
    }
    if (soundEnabledStr !== null) setSoundEnabled(soundEnabledStr === 'true');
    if (!walkthroughSeen) setShowWalkthrough(true);
    setCompanionMsgCount(companionCount);
    setParentingMsgCount(parentingCount);

    // Essential UI state is loaded — render now. Optional native features
    // (purchases, sounds, notifications) follow and must never block first paint
    // (some can hang on web).
    setIsLoaded(true);

    const purchasesReady = await configurePurchases();
    setIsPurchasesConfigured(purchasesReady);

    if (purchasesReady) {
      await refreshPremiumStatus();
    } else {
      setIsPremium(false);
    }

    // On Huawei (no GMS), check PayFast premium from Firestore
    if (isHuaweiDevice()) {
      try {
        const installId = await getInstallId();
        const huaweiPremium = await checkHuaweiPremium(installId);
        if (huaweiPremium) setIsPremium(true);
      } catch {
        // non-fatal — user can always restore via PayFast button
      }
    }

    // Initialize sounds
    await initSounds();

    // Set up notifications — silently skip in Expo Go (remote notifications removed in SDK 53+)
    try {
      setupNotifications();
      const granted = await requestNotificationPermission();
      if (granted) {
        const activeChild = nextChildren.find((c) => c.id === nextActiveChildId);
        const activeChildName = activeChild?.name || legacyChildName || 'your little one';
        const notifSettings = await getNotifSettings();
        if (notifSettings.enabled) {
          scheduleWeatherNotification(notifSettings.hour, notifSettings.minute, activeChildName, name || '');
        }
        scheduleDailyTip();
        scheduleEngagementNotifications(activeChildName);
        scheduleNovelSpotlight();
        scheduleChoreReminder(activeChildName);
        scheduleHomeworkReminder(activeChildName);
        scheduleGirlTalkReminder();
        scheduleCompanionCheckIn();
        scheduleBraKDailyNudge(name || '', gender || '');
        scheduleLesediDailyNudge(name || '', gender || '');
        rescheduleMedicationReminders();
        const activeBirthday = activeChild?.birthday ?? '';
        if (activeBirthday) scheduleChildBirthdayReminder(activeChildName, activeBirthday);
      }
    } catch {
      // Expo Go on Android doesn't support push notifications; continue without them
    }

    registerInstall();
    Analytics.appOpen();
    } catch (e) {
      // On web some native calls (purchases, sounds, notifications) may fail —
      // never block first render because of them.
      console.warn('[startup] load error (continuing):', e);
    } finally {
      setIsLoaded(true);
    }
  })();
}, []);

  // ── Screen view tracking ──────────────────────────────────────────────────
  useEffect(() => {
    if (isLoaded) Analytics.screenView(screen);
  }, [screen, isLoaded]);

  // ── Hardware Back Button Handling ─────────────────────────────────────────
  useEffect(() => {
    const backAction = () => {
      switch (screen) {
        case 'home':
          // On home screen, let the system handle back (exit app)
          return false;
        case 'companions':
        case 'chat':
        case 'tracker':
        case 'learnPlay':
        case 'about':
        case 'settings':
        case 'notificationCentre':
        case 'schoolHub':
        case 'schoolSchedule':
        case 'choreChart':
        case 'medicationReminders':
        case 'novels':
        case 'faqs':
        case 'clinicCard':
          setScreen('home');
          return true;
        case 'girlTalk':
        case 'braK':
          setScreen('companions');
          return true;
        case 'reportCard':
        case 'homeworkHelper':
        case 'homeworkReminder':
        case 'teacherComms':
        case 'schoolReadiness':
        case 'termPlanner':
        case 'gradeRGuide':
          setScreen('schoolHub');
          return true;
        default:
          // For splash/onboarding screens, don't handle back
          return false;
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [screen]);

  // ── Routing ──────────────────────────────────────────────────────────────
  if (!isLoaded) return null;

  if (screen === 'splash_inka') {
    return (
      <InkaTechSplash
        onDone={() => setScreen('splash_gp')}
      />
    );
  }

  if (screen === 'splash_gp') {
    return (
      <GentleParentSplash
        theme={contextTheme}
        onDone={() => {
          if (!userName) {
            setScreen('onboarding');
          } else {
            setScreen('home');
          }
        }}
      />
    );
  }

  if (screen === 'onboarding') {
    return (
      <OnboardingScreen
        onComplete={(name, child, gender) => {
          setUserName(name);
          setParentGender(gender);
          void persistChildren([makeChild(child)], '');
          setScreen('home');
        }}
      />
    );
  }

if (screen === 'chat' && selectedCategory) {
  return (
    <>
      <ChatScreen
        category={selectedCategory}
        userName={userName}
        childName={childName}
        parentGender={parentGender}
        theme={theme}
        isPremium={isPremium}
        msgCount={parentingMsgCount}
        onMsgSent={(n) => setParentingMsgCount(n)}
        onBack={() => setScreen('home')}
        onPaywall={() => openPaywall()}
      />
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={handleSubscribe}
        onRestore={handleRestore}
        parentGender={parentGender}
        onPayFast={(!isPurchasesConfigured || isHuaweiDevice()) ? handlePaywallPayFast : undefined}
      />
    </>
  );
}

if (screen === 'girlTalk') {
  return (
    <>
      <GirlTalkScreen
        userName={userName}
        childName={childName}
        parentGender={parentGender}
        isPremium={isPremium}
        msgCount={companionMsgCount}
        onMsgSent={(n) => setCompanionMsgCount(n)}
        onClose={() => setScreen('home')}
        onPaywall={() => openPaywall()}
      />
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={handleSubscribe}
        onRestore={handleRestore}
        parentGender={parentGender}
        onPayFast={(!isPurchasesConfigured || isHuaweiDevice()) ? handlePaywallPayFast : undefined}
      />
    </>
  );
}
if (screen === 'braK') {
  return (
    <>
      <BraKScreen
        userName={userName}
        parentGender={parentGender}
        isPremium={isPremium}
        msgCount={companionMsgCount}
        onMsgSent={(n) => setCompanionMsgCount(n)}
        onClose={() => setScreen('companions')}
        onPaywall={() => openPaywall()}
      />
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={handleSubscribe}
        onRestore={handleRestore}
        parentGender={parentGender}
        onPayFast={(!isPurchasesConfigured || isHuaweiDevice()) ? handlePaywallPayFast : undefined}
      />
    </>
  );
}

  if (screen === 'tracker') {
    return (
      <DevelopmentTracker
        childName={childName}
        childBirthday={childBirthday}
        allChildren={children.map((c) => ({ name: c.name, birthday: c.birthday ?? '' }))}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setScreen('home')}
      />
    );
  }

if (screen === 'learnPlay') {
  return (
    <LearnAndPlay
      theme={theme}
      onClose={() => setScreen('home')}
    />
  );
}

 if (screen === 'companions') {
  return (
    <CompanionsScreen
      userName={userName}
      theme={theme}
      soundEnabled={soundEnabled}
      onClose={() => setScreen('home')}
      onSelectLesedi={() => setScreen('girlTalk')}
      onSelectBraK={() => setScreen('braK')}
    />
  );
}

  if (screen === 'about') {
    return (
      <AboutScreen
        theme={theme}
        onClose={() => setScreen('home')}
      />
    );
  }

if (screen === 'account') {
  return (
    <AccountScreen
      onClose={() => setScreen('settings')}
      userName={userName}
      isPremium={isPremium}
      onPremiumChange={setIsPremium}
    />
  );
}

if (screen === 'settings') {
  return (
    <SettingsScreen
      userName={userName}
      onAccount={Platform.OS === 'web' ? () => setScreen('account') : undefined}
      childName={childName}
      childBirthday={childBirthday}        // ← add this
      parentGender={parentGender}
      isDarkMode={isDarkMode}
      themeMode={themeMode}
      soundEnabled={soundEnabled}
      onSetThemeMode={handleSetThemeMode}
      onToggleSound={handleToggleSound}
      onClose={() => setScreen('home')}
      onSaveName={async (name) => {         // ← add this
        setUserName(name);
        await AsyncStorage.setItem('user_name', name);
      }}
      onSaveChild={async (name) => {        // ← add this
        const trimmed = name.trim();
        if (!trimmed || !activeChild) return;
        const nextChildren = children.map((child) => (
          child.id === activeChild.id ? { ...child, name: trimmed } : child
        ));
        await persistChildren(nextChildren, activeChild.id);
      }}
      onSaveBirthday={async (iso) => {      // ← add this
        if (!activeChild) return;
        const nextChildren = children.map((child) => (
          child.id === activeChild.id ? { ...child, birthday: iso || undefined } : child
        ));
        await persistChildren(nextChildren, activeChild.id);
      }}
      children={children}
      activeChildId={activeChildId}
      onSetActiveChild={async (childId) => {
        if (!children.find((child) => child.id === childId)) return;
        await persistChildren(children, childId);
      }}
      onAddChild={async (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const nextChildren = [...children, makeChild(trimmed)];
        const newActiveId = nextChildren[nextChildren.length - 1].id;
        await persistChildren(nextChildren, newActiveId);
      }}
      onFAQs={() => { setScreen('faqs'); }}
      onRestartWalkthrough={() => setShowWalkthrough(true)}
      onReset={async () => {
        await AsyncStorage.clear();
        setUserName('');
        setChildren([]);
        setActiveChildId('');
        setParentGender('');
        setThemeMode('system');
        setSoundEnabled(true);
        setScreen('onboarding');
      }}
    />
  );
}

  if (screen === 'notificationCentre') {
    return (
      <NotificationCentre
        onClose={() => setScreen('home')}
        onResumeChat={(companionId) => {
          if (companionId === 'lesedi') {
            setScreen('girlTalk');
          } else {
            setScreen('braK');
          }
        }}
      />
    );
  }

  if (screen === 'schoolHub') {
    return (
      <>
        <SchoolHubScreen
          childName={childName}
          childBirthday={childBirthday}
          theme={theme}
          isDarkMode={isDarkMode}
          onClose={() => setScreen('home')}
          onReportCard={() => (isPremium || UNLOCK_ALL_SCREENS) ? setScreen('reportCard') : openPaywall()}
          onHomework={() => (isPremium || UNLOCK_ALL_SCREENS) ? setScreen('homeworkHelper') : openPaywall()}
          onTeacherComms={() => (isPremium || UNLOCK_ALL_SCREENS) ? setScreen('teacherComms') : openPaywall()}
          onSchoolReadiness={() => setScreen('schoolReadiness')}
          onTermPlanner={() => setScreen('termPlanner')}
          onGradeRGuide={() => setScreen('gradeRGuide')}
          onHomeworkReminder={() => setScreen('homeworkReminder')}
          onSchoolSchedule={() => (isPremium || UNLOCK_ALL_SCREENS) ? setScreen('schoolSchedule') : openPaywall()}
        />
        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          onSubscribe={handleSubscribe}
          onRestore={handleRestore}
          parentGender={parentGender}
        />
      </>
    );
  }

  if (screen === 'schoolReadiness') {
    return (
      <SchoolReadinessTracker
        childName={childName}
        childNames={children.map((c) => c.name).filter(Boolean)}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setScreen('schoolHub')}
      />
    );
  }

  if (screen === 'termPlanner') {
    return (
      <TermPlanner
        childName={childName}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setScreen('schoolHub')}
      />
    );
  }

  if (screen === 'gradeRGuide') {
    return (
      <GradeRPrepGuide
        childName={childName}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setScreen('schoolHub')}
      />
    );
  }

  if (screen === 'reportCard') {
    return (
      <ReportCardScanner
        childName={childName}
        childNames={children.map((c) => c.name).filter(Boolean)}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setScreen('schoolHub')}
      />
    );
  }

  if (screen === 'homeworkHelper') {
    return (
      <HomeworkHelper
        childName={childName}
        childNames={children.map((c) => c.name).filter(Boolean)}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setScreen('schoolHub')}
      />
    );
  }

  if (screen === 'homeworkReminder') {
    return (
      <HomeworkReminder
        childName={childName}
        childNames={children.map((c) => c.name).filter(Boolean)}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setScreen('schoolHub')}
      />
    );
  }

  if (screen === 'teacherComms') {
    return (
      <TeacherCommsScreen
        childName={childName}
        childNames={children.map((c) => c.name).filter(Boolean)}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setScreen('schoolHub')}
      />
    );
  }

  if (screen === 'choreChart') {
    return (
      <ChoreChart
        childName={childName}
        childNames={children.map((c) => c.name).filter(Boolean)}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setScreen('home')}
      />
    );
  }

  if (screen === 'medicationReminders') {
    return (
      <MedicationReminders
        childNames={children.map((c) => c.name).filter(Boolean)}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setScreen('home')}
      />
    );
  }

  if (screen === 'faqs') {
    return (
      <FAQScreen
        theme={theme}
        isDarkMode={isDarkMode}
        parentGender={parentGender}
        onClose={() => setScreen('home')}
      />
    );
  }

  if (screen === 'schoolSchedule') {
    return (
      <SchoolScheduleScanner
        childName={childName}
        childNames={children.map((c) => c.name).filter(Boolean)}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setScreen('schoolHub')}
      />
    );
  }

  if (screen === 'clinicCard') {
    return (
      <ClinicCardScanner
        childName={childName}
        childNames={children.map((c) => c.name).filter(Boolean)}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setScreen('home')}
      />
    );
  }

  if (screen === 'novels') {
    return (
      <>
        <NovelReaderScreen
          theme={theme}
          isDarkMode={isDarkMode}
          isPremium={isPremium}
          parentGender={parentGender}
          onClose={() => setScreen('home')}
          onPaywall={() => openPaywall()}
        />
        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          onSubscribe={handleSubscribe}
          onRestore={handleRestore}
          parentGender={parentGender}
        />
      </>
    );
  }

  // ── Default: Home ────────────────────────────────────────────────────────
  return (
    <>
      <HomeScreen
        userName={userName}
        childName={childName}
        childNames={children.map((c) => c.name).filter(Boolean)}
        parentGender={parentGender}
        theme={theme}
        isDarkMode={isDarkMode}
        childBirthday={childBirthday}
        soundEnabled={soundEnabled}
        onSelectCategory={(cat) => { setSelectedCategory(cat); setScreen('chat'); }}
        onGirlTalk={() => setScreen('girlTalk')}
        onTracker={() => setScreen('tracker')}
        onLearnPlay={() => setScreen('learnPlay')}
        onCompanions={() => setScreen('companions')}
        onSchoolHub={() => setScreen('schoolHub')}
        onChoreChart={() => setScreen('choreChart')}
        onMedicationReminders={() => setScreen('medicationReminders')}
        onNovels={() => setScreen('novels')}
        onClinicCard={() => (isPremium || UNLOCK_ALL_SCREENS) ? setScreen('clinicCard') : openPaywall()}
        onAbout={() => setScreen('about')}
        onSettings={() => setScreen('settings')}
        onNotifications={() => setScreen('notificationCentre')}
        onSaveBirthday={async (iso) => {
          if (!activeChild) return;
          const nextChildren = children.map((child) => (
            child.id === activeChild.id ? { ...child, birthday: iso || undefined } : child
          ));
          await persistChildren(nextChildren, activeChild.id);
        }}
      />
      {showPaywall && (
        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          onSubscribe={handleSubscribe}
          onRestore={handleRestore}
          parentGender={parentGender}
        />
      )}
      <WalkthroughModal
        visible={showWalkthrough}
        parentGender={parentGender}
        onDone={async () => {
          setShowWalkthrough(false);
          await AsyncStorage.setItem('walkthrough_seen', 'true');
        }}
      />
    </>
  );
}

// Wrap with ThemeProvider to enable theme system
export default function Index() {
  return (
    <ThemeProvider>
      <IndexContent />
    </ThemeProvider>
  );
}
