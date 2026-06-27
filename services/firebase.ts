import { httpsCallable } from 'firebase/functions';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { functions, auth } from '../config/firebase';

// ── Vision ────────────────────────────────────────────────────────────────────
const analyzeImageFunction = httpsCallable(functions, 'analyzeImage');

interface VisionResult {
  success: boolean;
  data: string;
  fallback: string;
}

export const analyzeImage = async (
  base64Image: string,
  prompt: string,
  mimeType: string = 'image/jpeg',
  maxTokens: number = 900,
  model: string = 'gpt-4o-mini',
): Promise<VisionResult> => {
  try {
    const result = await analyzeImageFunction({ base64Image, prompt, mimeType, maxTokens, model });
    const d = result.data as any;
    return {
      success: d.success ?? false,
      data: d.data ?? '',
      fallback: d.fallback ?? "Couldn't analyse the image right now. Please try again. 💕",
    };
  } catch {
    return { success: false, data: '', fallback: "Couldn't analyse the image right now. Please try again. 💕" };
  }
};

const getDailyQuoteFunction = httpsCallable(functions, 'getDailyQuote');

export const getDailyQuote = async (theme?: string): Promise<string | null> => {
  try {
    const result = await getDailyQuoteFunction({ theme });
    const data = result.data as any;
    return data.success ? (data.data as string) : null;
  } catch {
    return null;
  }
};

const generateCompanionFollowUpFunction = httpsCallable(functions, 'generateCompanionFollowUp');

export const generateCompanionFollowUp = async (
  companionId: string,
  lastMessage: string,
  userName?: string,
  parentGender?: string,
): Promise<string | null> => {
  try {
    const result = await generateCompanionFollowUpFunction({ companionId, lastMessage, userName, parentGender });
    const data = result.data as any;
    return data.success ? (data.data as string) : null;
  } catch {
    return null;
  }
};

const generateStoryFunction = httpsCallable(functions, 'generateStory');

export const generateStory = async (prompt: string): Promise<string | null> => {
  try {
    const result = await generateStoryFunction({ prompt });
    const data = result.data as any;
    return data.success ? (data.data as string) : null;
  } catch {
    return null;
  }
};

const getParentingAdviceFunction = httpsCallable(functions, 'getParentingAdvice');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface ParentingAdviceResponse {
  success: boolean;
  data?: string;
  fallback?: string;
}

type CompanionType = 'lesedi' | 'braK';

const callCompanionFunction = async (
  message: string,
  companion: CompanionType,
  category: string,
  history: Message[],
  userName: string,
  childName: string,
  parentGender: string,
  isGirlTalk: boolean,
  useSlang: boolean,
  userMood: number | null = null,
): Promise<ParentingAdviceResponse> => {
  try {
    const trimmedHistory = history.slice(-10);

    const result = await getParentingAdviceFunction({
      message,
      companion,
      category,
      history: trimmedHistory,
      userName,
      childName,
      parentGender,
      isGirlTalk,
      useSlang,
      userMood,
    });

    const responseData = result.data as any;
    return {
      success: responseData.success,
      data: responseData.data,
      fallback: responseData.fallback,
    };
  } catch (error) {
    console.error('❌ Error calling Firebase function:', error);
    return {
      success: false,
      fallback: companion === 'braK'
        ? 'Eish my bra, something went wrong on my side. Try again sharp sharp! 😅'
        : "I'm having trouble connecting right now. Please try again. 💕",
    };
  }
};

export const getParentingAdvice = async (
  message: string,
  category: string = 'general',
  history: Message[] = [],
  userName: string = '',
  childName: string = '',
  parentGender: string = 'mom',
  isGirlTalk: boolean = false,
  useSlang: boolean = false,
  userMood: number | null = null,
): Promise<ParentingAdviceResponse> => {
  return callCompanionFunction(
    message,
    'lesedi',
    category,
    history,
    userName,
    childName,
    parentGender,
    isGirlTalk,
    useSlang,
    userMood,
  );
};

export const parentingAdviceResponse = async (
  message: string,
  history: Message[] = [],
  userName: string = '',
  useSlang: boolean = false,
  userMood: number | null = null,
): Promise<ParentingAdviceResponse> => {
  return callCompanionFunction(
    message,
    'braK',
    'general',
    history,
    userName,
    '',
    'dad',
    false,
    useSlang,
    userMood,
  );
};

// ── PayFast (Huawei / web payment) ────────────────────────────────────────────

const createPayfastPaymentFn = httpsCallable(functions, 'createPayfastPayment');
const checkHuaweiPremiumFn   = httpsCallable(functions, 'checkHuaweiPremium');

export const createPayfastPaymentUrl = async (
  installId: string,
  name: string,
  opts?: { uid?: string; email?: string; web?: boolean },
): Promise<string | null> => {
  try {
    const result = await createPayfastPaymentFn({ installId, name, ...opts });
    const d = result.data as any;
    return d.success ? (d.url as string) : null;
  } catch {
    return null;
  }
};

export const checkHuaweiPremium = async (idOrInstallId: string): Promise<boolean> => {
  try {
    const result = await checkHuaweiPremiumFn({ installId: idOrInstallId, uid: idOrInstallId });
    return (result.data as any)?.premium === true;
  } catch {
    return false;
  }
};

// ── Account auth (email/password) — used by the web app to manage subscriptions ──

const cancelSubscriptionFn = httpsCallable(functions, 'cancelPayfastSubscription');

export const onAuthChange = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb);

export const currentUser = () => auth.currentUser;
export const isSignedInAccount = () => !!auth.currentUser && !auth.currentUser.isAnonymous;

/** Sign up with email/password. If the current session is anonymous, upgrade it
 *  in place (keeps the same uid + any data) so an existing subscription stays tied. */
export const signUpEmail = async (email: string, password: string, name?: string) => {
  const existing = auth.currentUser;
  let user: User;
  if (existing && existing.isAnonymous) {
    const cred = EmailAuthProvider.credential(email, password);
    const res = await linkWithCredential(existing, cred);
    user = res.user;
  } else {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    user = res.user;
  }
  if (name) { try { await updateProfile(user, { displayName: name }); } catch {} }
  return user;
};

export const loginEmail = async (email: string, password: string) => {
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
};

export const logoutAccount = async () => { await signOut(auth); };

export const sendPasswordReset = async (email: string) => { await sendPasswordResetEmail(auth, email); };

export const cancelSubscription = async (uid: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await cancelSubscriptionFn({ uid });
    return result.data as any;
  } catch (e) {
    return { success: false, error: String(e) };
  }
};