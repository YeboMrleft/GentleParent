import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  signUpEmail,
  loginEmail,
  logoutAccount,
  sendPasswordReset,
  onAuthChange,
  createPayfastPaymentUrl,
  checkHuaweiPremium,
  cancelSubscription,
} from '../services/firebase';

interface Props {
  onClose: () => void;
  userName?: string;
  isPremium: boolean;
  onPremiumChange: (premium: boolean) => void;
}

const ROSE = '#C9397A';
const ROSE_DEEP = '#91214F';
const INK = '#12080E';
const MUTED = '#7A5068';
const SAND = '#FAF7F4';
const LINE = 'rgba(18,8,14,0.10)';

export default function AccountScreen({ onClose, userName, isPremium, onPremiumChange }: Props) {
  const [user, setUser] = useState(() => null as null | { uid: string; email: string | null; isAnonymous: boolean });
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [name, setName] = useState(userName ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    return onAuthChange((u) => {
      setUser(u ? { uid: u.uid, email: u.email, isAnonymous: u.isAnonymous } : null);
      if (u && !u.isAnonymous) {
        checkHuaweiPremium(u.uid).then(onPremiumChange).catch(() => {});
      }
    });
  }, []);

  const signedInAccount = !!user && !user.isAnonymous;

  const handleAuth = async () => {
    setError('');
    if (!email.includes('@') || password.length < 6) {
      setError('Enter a valid email and a password of at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') await signUpEmail(email.trim(), password, name.trim() || undefined);
      else await loginEmail(email.trim(), password);
      setPassword('');
    } catch (e: any) {
      const code = String(e?.code || e?.message || e);
      if (code.includes('email-already-in-use')) setError('That email is already registered — try logging in.');
      else if (code.includes('invalid-credential') || code.includes('wrong-password')) setError('Incorrect email or password.');
      else if (code.includes('operation-not-allowed')) setError('Email sign-in is not enabled yet. Please contact support.');
      else setError('Could not complete that. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setError(''); setNotice('');
    if (!email.includes('@')) { setError('Enter your email in the field above, then tap reset.'); return; }
    setBusy(true);
    try {
      await sendPasswordReset(email.trim());
      setNotice('Password reset link sent — check your inbox (and spam folder).');
    } catch {
      setError('Could not send the reset email. Check the address and try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      const url = await createPayfastPaymentUrl(user.uid, name || userName || 'User', {
        uid: user.uid,
        email: user.email ?? undefined,
        web: Platform.OS === 'web',
      });
      if (!url) { setError('Could not start checkout. Please try again.'); setBusy(false); return; }
      if (Platform.OS === 'web') {
        // full redirect to PayFast; user returns to /?sub=success
        // @ts-ignore web-only
        window.location.href = url;
      } else {
        await Linking.openURL(url);
        setBusy(false);
      }
    } catch {
      setError('Could not start checkout. Please try again.');
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      const res = await cancelSubscription(user.uid);
      if (res.success) onPremiumChange(false);
      else setError('Could not cancel right now. Please try again or contact support.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal animationType="slide" visible transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.back}><Text style={styles.backTxt}>← Back</Text></TouchableOpacity>
          <Text style={styles.title}>Account</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {!signedInAccount ? (
            <>
              <Text style={styles.h1}>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</Text>
              <Text style={styles.sub}>An account lets you subscribe to Premium and manage it on any device — no Google needed.</Text>

              <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tab, mode === 'signup' && styles.tabActive]} onPress={() => setMode('signup')}>
                  <Text style={[styles.tabTxt, mode === 'signup' && styles.tabTxtActive]}>Sign Up</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, mode === 'login' && styles.tabActive]} onPress={() => setMode('login')}>
                  <Text style={[styles.tabTxt, mode === 'login' && styles.tabTxtActive]}>Log In</Text>
                </TouchableOpacity>
              </View>

              {mode === 'signup' && (
                <>
                  <Text style={styles.label}>Your name</Text>
                  <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Thandi" placeholderTextColor="#B9A6B0" />
                </>
              )}
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#B9A6B0" autoCapitalize="none" keyboardType="email-address" />
              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="At least 6 characters" placeholderTextColor="#B9A6B0" secureTextEntry />

              {!!error && <Text style={styles.error}>{error}</Text>}
              {!!notice && <Text style={styles.notice}>{notice}</Text>}

              <TouchableOpacity style={styles.primary} onPress={handleAuth} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryTxt}>{mode === 'signup' ? 'Create account' : 'Log in'}</Text>}
              </TouchableOpacity>

              {mode === 'login' && (
                <TouchableOpacity style={styles.forgot} onPress={handleReset} disabled={busy}>
                  <Text style={styles.forgotTxt}>Forgot password?</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={styles.h1}>Hi{name ? `, ${name}` : ''} 👋</Text>
              <Text style={styles.sub}>{user?.email}</Text>

              <View style={styles.statusCard}>
                <Text style={styles.statusLabel}>Subscription</Text>
                <Text style={[styles.statusValue, { color: isPremium ? '#16A34A' : MUTED }]}>
                  {isPremium ? '★ Premium — Active' : 'Free plan'}
                </Text>
                <Text style={styles.statusNote}>
                  {isPremium ? 'R69/month · renews automatically' : 'Unlock School Hub, Novel Corner, Clinic Card scanner & more.'}
                </Text>
              </View>

              {!!error && <Text style={styles.error}>{error}</Text>}

              {!isPremium ? (
                <TouchableOpacity style={styles.primary} onPress={handleSubscribe} disabled={busy}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryTxt}>Subscribe — R69/mo via PayFast</Text>}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={busy}>
                  {busy ? <ActivityIndicator color={ROSE_DEEP} /> : <Text style={styles.cancelTxt}>Cancel subscription</Text>}
                </TouchableOpacity>
              )}

              {!isPremium && <Text style={styles.payNote}>Card · EFT · SnapScan · Ozow — secured by PayFast</Text>}

              <TouchableOpacity style={styles.logout} onPress={logoutAccount} disabled={busy}>
                <Text style={styles.logoutTxt}>Log out</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SAND },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: LINE },
  back: { width: 60 }, backTxt: { color: ROSE, fontSize: 15, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '800', color: INK },
  body: { padding: 24, paddingBottom: 60 },
  h1: { fontSize: 26, fontWeight: '800', color: INK, marginBottom: 8 },
  sub: { fontSize: 14, color: MUTED, lineHeight: 20, marginBottom: 22 },
  tabs: { flexDirection: 'row', backgroundColor: '#F1E4EC', borderRadius: 14, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  tabTxt: { fontSize: 14, fontWeight: '700', color: MUTED },
  tabTxtActive: { color: ROSE_DEEP },
  label: { fontSize: 12, fontWeight: '700', color: MUTED, marginBottom: 7, marginTop: 14, letterSpacing: 0.3 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: LINE, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: INK },
  error: { color: '#DC2626', fontSize: 13, marginTop: 14, lineHeight: 18 },
  notice: { color: '#16A34A', fontSize: 13, marginTop: 14, lineHeight: 18 },
  forgot: { alignItems: 'center', marginTop: 16 },
  forgotTxt: { color: ROSE, fontSize: 13.5, fontWeight: '600', textDecorationLine: 'underline' },
  primary: { backgroundColor: ROSE, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 22, shadowColor: ROSE, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  primaryTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  statusCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: LINE, borderRadius: 18, padding: 22, marginBottom: 6 },
  statusLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', color: MUTED, marginBottom: 8 },
  statusValue: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  statusNote: { fontSize: 13, color: MUTED, lineHeight: 19 },
  cancelBtn: { borderWidth: 1.5, borderColor: ROSE_DEEP, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  cancelTxt: { color: ROSE_DEEP, fontSize: 15, fontWeight: '800' },
  payNote: { fontSize: 11.5, color: MUTED, textAlign: 'center', marginTop: 12 },
  logout: { alignItems: 'center', marginTop: 30 },
  logoutTxt: { color: MUTED, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
