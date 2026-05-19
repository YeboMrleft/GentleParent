import React from 'react';
import {
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { playClickSound } from '../utils/sounds';

// Inline online indicator (matches source pattern)
function OnlineIndicator({ style = {} }: any) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 5 }, style]}>
      <View style={{
        width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50',
        shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4,
      }} />
      <Text style={{ fontSize: 11, color: '#4CAF50', fontWeight: '600' }}>Online</Text>
    </View>
  );
}

interface Props {
  onClose: () => void;
  onSelectLesedi: () => void;
  onSelectBraK: () => void;
  userName: string;
  theme?: any;
  soundEnabled: boolean;
}

export default function CompanionsScreen({ onClose, onSelectLesedi, onSelectBraK, userName, theme, soundEnabled }: Props) {
  const bg = theme?.background || '#EFEFEF';
  return (
    <Modal animationType="slide" transparent={false} visible={true}>
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { playClickSound(soundEnabled); onClose(); }} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Companions</Text>
          <OnlineIndicator style={{ marginLeft: 'auto' as any }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.greeting}>Hey {userName || 'there'}! 👋</Text>
          <Text style={styles.subtitle}>Who do you want to chat with today?</Text>

          {/* ── Lesedi Card ──────────────────────────────────────────────── */}
          <TouchableOpacity style={styles.lesediCard} onPress={() => { playClickSound(soundEnabled); onSelectLesedi(); }} activeOpacity={0.88}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>🌱</Text>
              <View style={styles.lesediGlow} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.lesediName}>Lesedi</Text>
              <Text style={styles.lesediTagline}>✨ "Light" in Sotho • For everyone</Text>
              <Text style={styles.lesediDescription}>
                Your warm, wise companion for parenting advice, celeb gossip, relationships, lifestyle and everything in between. For moms AND dads.
              </Text>
              <View style={styles.tagsRow}>
                {['👶 Parenting', '💅 Gossip', '💕 Relationships', '🌸 Lifestyle'].map((tag) => (
                  <View key={tag} style={styles.lesediTag}>
                    <Text style={styles.lesediTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.lesediArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Bra K Card ───────────────────────────────────────────────── */}
          <TouchableOpacity style={styles.braKCard} onPress={() => { playClickSound(soundEnabled); onSelectBraK(); }} activeOpacity={0.88}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>😎</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.braKName}>Bra K</Text>
              <Text style={styles.braKTagline}>🏘️ From the kasi • For everyone</Text>
              <Text style={styles.braKDescription}>
                Your streetwise homeboy for sports, cars, business, fashion and good vibes. Sharp sharp! 🤝
              </Text>
              <View style={styles.tagsRow}>
                {['⚽ Sports', '🚗 Cars', '💼 Business', '👟 Fashion'].map((tag) => (
                  <View key={tag} style={styles.braKTag}>
                    <Text style={styles.braKTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.braKArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.footer}>Built with 💕 & 🔥 by Inka-Tech Solutions</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFEFEF' },
  header: {
    backgroundColor: '#FFFFFF', paddingTop: 20, paddingBottom: 16, paddingHorizontal: 15,
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 3,
  },
  closeButton: {
    backgroundColor: '#F5F5F5', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: '#E0E0E0', marginRight: 12,
  },
  closeButtonText: { color: '#555', fontSize: 15, fontWeight: 'bold' },
  headerTitle:     { color: '#222', fontSize: 20, fontWeight: 'bold' },

  content:  { padding: 20, paddingBottom: 40 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#222', textAlign: 'center', marginTop: 10, marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28, fontStyle: 'italic' },

  // ── Lesedi card ──────────────────────────────────────────────────────────
  lesediCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#C9B1E8',
    borderBottomWidth: 5, borderBottomColor: '#9B7FA8',
    shadowColor: '#C9B1E8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 6, marginBottom: 8,
  },
  avatarContainer: { alignItems: 'center', marginRight: 16, position: 'relative' },
  avatarEmoji:     { fontSize: 48 },
  lesediGlow: {
    position: 'absolute', width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#C9B1E8', opacity: 0.2, top: -4, left: -4,
  },
  cardContent:      { flex: 1 },
  lesediName:       { fontSize: 22, fontWeight: 'bold', color: '#7B5EA7', marginBottom: 2 },
  lesediTagline:    { fontSize: 12, color: '#9B7FA8', fontStyle: 'italic', marginBottom: 8 },
  lesediDescription:{ fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 10 },
  tagsRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  lesediTag: {
    backgroundColor: 'rgba(201,177,232,0.2)', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(201,177,232,0.4)',
  },
  lesediTagText: { fontSize: 11, color: '#7B5EA7' },
  lesediArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#EDD9FF', alignItems: 'center', justifyContent: 'center',
  },

  // ── Divider ──────────────────────────────────────────────────────────────
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { color: '#AAA', fontSize: 13 },

  // ── Bra K card ───────────────────────────────────────────────────────────
  braKCard: {
    backgroundColor: '#1A2E20', borderRadius: 24, padding: 20,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#4CAF50',
    borderBottomWidth: 5, borderBottomColor: '#2E7D32',
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 6, marginBottom: 8,
  },
  braKName:        { fontSize: 22, fontWeight: 'bold', color: '#4CAF50', marginBottom: 2 },
  braKTagline:     { fontSize: 12, color: '#81C784', fontStyle: 'italic', marginBottom: 8 },
  braKDescription: { fontSize: 13, color: '#A5D6A7', lineHeight: 19, marginBottom: 10 },
  braKTag: {
    backgroundColor: 'rgba(76,175,80,0.15)', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(76,175,80,0.3)',
  },
  braKTagText: { fontSize: 11, color: '#4CAF50' },
  braKArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(76,175,80,0.2)', alignItems: 'center', justifyContent: 'center',
  },

  arrowText: { fontSize: 16, fontWeight: 'bold', color: '#888' },
  footer:    { textAlign: 'center', color: '#AAA', fontSize: 12, marginTop: 24, fontStyle: 'italic' },
});
