import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { playClickSound } from '../utils/sounds';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubscribe: (plan: string) => void;
  onRestore: () => void;
  parentGender: string;
  onPayFast?: () => void;
}

const FEATURES = [
  { icon: '🌱', label: 'Lesedi\nAI companion' },
  { icon: '😎', label: 'Bra K\nAI companion' },
  { icon: '💅', label: 'Girl Talk\nsessions' },
  { icon: '📄', label: 'Report Card\nscanner' },
  { icon: '📚', label: 'Homework\nhelper' },
  { icon: '✍️', label: 'Message My\nTeacher' },
  { icon: '💉', label: 'Clinic Card\ntracker' },
  { icon: '📖', label: 'Novel\nCorner' },
];

export default function PaywallModal({ visible, onClose, onSubscribe, onRestore, parentGender, onPayFast }: Props) {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

  const isMom   = parentGender === 'mom';
  const accent  = isMom ? '#F472B6' : '#5B8FA8';
  const accent2 = isMom ? '#e8849a' : '#3d6b82';
  const heroBg  = isMom ? '#FFF0F7' : '#EEF4F8';

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.88);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 55,
        friction: 8,
      }).start();
    }
  }, [visible]);

  return (
    // animationType="fade" lets the OS handle the overlay fade — no Animated opacity needed
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

            {/* Hero */}
            <View style={[styles.hero, { backgroundColor: heroBg }]}>
              <Text style={styles.heroEmoji}>✨</Text>
              <Text style={styles.heroTitle}>GentleParent Premium</Text>
              <Text style={styles.heroSub}>Everything you need, fully unlocked</Text>
            </View>

            {/* Feature grid */}
            <View style={styles.gridOuter}>
              <View style={styles.grid}>
                {FEATURES.map((f, i) => (
                  <View key={i} style={[styles.tile, { borderColor: accent + '40' }]}>
                    <Text style={styles.tileIcon}>{f.icon}</Text>
                    <Text style={styles.tileLabel}>{f.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Price */}
            <View style={[styles.priceBlock, { backgroundColor: heroBg }]}>
              <View style={styles.priceRow}>
                <Text style={[styles.priceCurr, { color: accent2 }]}>R</Text>
                <Text style={[styles.priceAmt,  { color: accent2 }]}>69</Text>
                <Text style={[styles.pricePer,  { color: accent2 }]}>/month</Text>
              </View>
              <Text style={styles.priceSub}>Cancel anytime · No hidden fees</Text>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.cta, { backgroundColor: accent, shadowColor: accent2 }]}
              onPress={() => { playClickSound(); onSubscribe('monthly'); }}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>Unlock Premium</Text>
            </TouchableOpacity>

            {/* PayFast alternative (Huawei / web payment) */}
            {onPayFast && (
              <TouchableOpacity
                style={[styles.payfastBtn, { borderColor: accent + '55' }]}
                onPress={() => { playClickSound(); onPayFast(); }}
                activeOpacity={0.85}
              >
                <Text style={[styles.payfastText, { color: accent2 }]}>Pay via PayFast</Text>
                <Text style={styles.payfastSub}>Card · EFT · SnapScan · Ozow</Text>
              </TouchableOpacity>
            )}

            {/* Footer links */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => { playClickSound(); onRestore(); }}>
                <Text style={styles.footerLink}>Restore Purchase</Text>
              </TouchableOpacity>
              <Text style={styles.footerDot}>·</Text>
              <TouchableOpacity onPress={() => { playClickSound(); onClose(); }}>
                <Text style={styles.footerLink}>Maybe later</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    maxHeight: '90%',
  },

  hero: {
    alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20,
  },
  heroEmoji: { fontSize: 36, marginBottom: 8 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  heroSub:   { fontSize: 13, color: '#666', textAlign: 'center' },

  gridOuter: { paddingHorizontal: 16, paddingVertical: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: {
    width: '47%', backgroundColor: '#FAFAFA', borderRadius: 16, borderWidth: 1.5,
    paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center', marginBottom: 10,
  },
  tileIcon:  { fontSize: 22, marginBottom: 5 },
  tileLabel: { fontSize: 12, color: '#555', textAlign: 'center', lineHeight: 16, fontWeight: '600' },

  priceBlock: {
    marginHorizontal: 16, borderRadius: 18, paddingVertical: 18,
    alignItems: 'center', marginBottom: 14,
  },
  priceRow:  { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
  priceCurr: { fontSize: 20, fontWeight: '800', marginBottom: 5, marginRight: 1 },
  priceAmt:  { fontSize: 46, fontWeight: '900', lineHeight: 52 },
  pricePer:  { fontSize: 16, fontWeight: '600', marginBottom: 7, marginLeft: 3 },
  priceSub:  { fontSize: 11, color: '#888' },

  cta: {
    marginHorizontal: 16, borderRadius: 20, paddingVertical: 17, alignItems: 'center',
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 5,
    borderBottomWidth: 5, borderBottomColor: 'rgba(0,0,0,0.13)',
  },
  ctaText: { color: '#FFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },

  payfastBtn: {
    marginHorizontal: 16, borderRadius: 16, paddingVertical: 13,
    alignItems: 'center', borderWidth: 1.5, marginTop: 8, backgroundColor: '#FAFAFA',
  },
  payfastText: { fontSize: 14, fontWeight: '700' },
  payfastSub:  { fontSize: 11, color: '#AAA', marginTop: 2 },

  footer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 16, gap: 8,
  },
  footerLink: { color: '#AAA', fontSize: 13 },
  footerDot:  { color: '#CCC', fontSize: 13 },

});
