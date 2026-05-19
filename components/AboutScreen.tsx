import React from 'react';
import {
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  onClose: () => void;
  theme: any;
}

export default function AboutScreen({ onClose, theme }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" transparent={false} visible={true}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.aboutButton, shadowColor: theme.aboutButtonShadow }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: theme.cardText }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.cardText }]}>About</Text>
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}>
          {/* Logo section */}
          <View style={styles.logoSection}>
            <Text style={styles.logoEmoji}>🌱</Text>
            <Text style={[styles.appName, { color: theme.logoText }]}>GentleParent</Text>
            <Text style={[styles.tagline, { color: theme.subText }]}>Raising kind humans</Text>
            <Text style={[styles.version, { color: theme.footerText }]}>Version 1.1.0</Text>
          </View>

          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.cardText }]}>💕 What is GentleParent?</Text>
            <Text style={[styles.cardText, { color: theme.cardSubText }]}>
              GentleParent is an AI-powered parenting companion designed to support caregivers
              with gentle, evidence-based advice for raising happy, emotionally healthy children.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.cardText }]}>🌟 Meet Lesedi</Text>
            <Text style={[styles.cardText, { color: theme.cardSubText }]}>
              Lesedi — meaning "light" in Sotho — is your personal parenting companion inside GentleParent.
              She's not just an assistant; she's a knowledgeable friend who listens, understands, and supports
              you through every parenting moment, big or small.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.cardText }]}>😎 Meet Bra K</Text>
            <Text style={[styles.cardText, { color: theme.cardSubText }]}>
              Bra K is your streetwise kasi companion — always ready to chat about sports, cars, business,
              fashion and life. For everyone! Sharp sharp! 🤝
            </Text>
          </View>

          <View style={[styles.card, styles.disclaimerCard]}>
            <Text style={[styles.cardTitle, { color: theme.cardText }]}>⚠️ Important Disclaimer</Text>
            <Text style={[styles.cardText, { color: theme.cardSubText }]}>
              GentleParent provides AI-generated guidance for informational purposes only.
              It is not a substitute for professional medical, psychological, or clinical advice.
              Always consult a qualified professional for serious concerns about your child's health or wellbeing.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.cardText }]}>📄 Legal</Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => Linking.openURL('https://yebomrleft.github.io/gentleparent-legal/privacy_policy.md')}
            >
              <Text style={styles.linkText}>🔒 Privacy Policy</Text>
              <Text style={[styles.linkArrow, { color: theme.footerText }]}>→</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => Linking.openURL('https://yebomrleft.github.io/gentleparent-legal/terms_of_service.md')}
            >
              <Text style={styles.linkText}>📋 Terms of Service</Text>
              <Text style={[styles.linkArrow, { color: theme.footerText }]}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.cardText }]}>🛠️ Built by</Text>
            <Text style={[styles.creditName, { color: theme.logoText }]}>Inka-Tech Solutions</Text>
            <Text style={[styles.creditText, { color: theme.cardSubText }]}>
              Passionate about building technology that makes a real difference in people's lives.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.cardText }]}>⚡ Powered by</Text>
            <Text style={[styles.cardText, { color: theme.cardSubText }]}>
              🤖 OpenAI{'\n'}🔍 Perplexity AI{'\n'}🔥 Google Firebase{'\n'}⚛️ React Native & Expo
            </Text>
          </View>

          <Text style={[styles.footer, { color: theme.footerText }]}>
            Made with 💕 for parents everywhere{'\n'}© 2026 Inka-Tech Solutions
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 20, paddingBottom: 16, paddingHorizontal: 15,
    flexDirection: 'row', alignItems: 'center',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginRight: 12,
  },
  closeButtonText: { fontSize: 15, fontWeight: 'bold' },
  headerTitle:     { fontSize: 20, fontWeight: 'bold' },

  content: { padding: 16 },

  logoSection: { alignItems: 'center', paddingVertical: 24 },
  logoEmoji:   { fontSize: 56, marginBottom: 10 },
  appName:     { fontSize: 30, fontWeight: 'bold', letterSpacing: 0.5 },
  tagline:     { fontSize: 15, fontStyle: 'italic', marginTop: 6 },
  version:     { fontSize: 12, marginTop: 8 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 20, padding: 18,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  disclaimerCard: { borderLeftWidth: 4, borderLeftColor: '#FFA000' },
  cardTitle:  { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  cardText:   { fontSize: 14, lineHeight: 22 },

  linkButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  linkText:   { fontSize: 15, color: '#555' },
  linkArrow:  { fontSize: 18 },
  divider:    { height: 1, backgroundColor: '#E8E8E8' },

  creditName: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  creditText: { fontSize: 14, lineHeight: 20 },

  footer: { textAlign: 'center', fontSize: 12, lineHeight: 20, marginTop: 8, marginBottom: 16 },
});
