import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
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

// ── Learn & Play data ─────────────────────────────────────────────────────────
const LEARN_PLAY_DATA: Record<string, any> = {
  '0–12m': {
    toys: [
      { name: 'High-Contrast Cards', emoji: '🃏', desc: 'Black and white cards stimulate baby\'s developing vision in the first months.', benefits: ['Visual development', 'Brain stimulation', 'Focus & tracking'] },
      { name: 'Soft Rattle', emoji: '🎵', desc: 'A gentle rattle encourages grasping and helps baby connect action with sound.', benefits: ['Hand-eye coordination', 'Cause & effect', 'Sensory exploration'] },
      { name: 'Activity Gym', emoji: '🌈', desc: 'A mat with hanging toys for baby to bat at, encouraging movement and discovery.', benefits: ['Motor development', 'Visual tracking', 'Tummy time support'] },
      { name: 'Teething Rings', emoji: '🔴', desc: 'Safe rings to chew on during teething — look for BPA-free silicone.', benefits: ['Teething relief', 'Oral exploration', 'Grasping practice'] },
      { name: 'Board Books', emoji: '📖', desc: 'Chunky books with simple images and textures for little hands and eyes.', benefits: ['Language development', 'Bonding time', 'Early literacy'] },
    ],
    exercises: [
      { name: 'Tummy Time', emoji: '🤸', desc: 'Place baby on their tummy for 3–5 mins, 2–3 times a day.', benefit: 'Builds neck & core strength' },
      { name: 'Bicycle Legs', emoji: '🚲', desc: 'Gently move baby\'s legs in a cycling motion while they lie on their back.', benefit: 'Aids digestion, strengthens legs' },
      { name: 'Reach & Grab', emoji: '🤲', desc: 'Hold a colourful toy just out of reach and encourage baby to reach for it.', benefit: 'Hand-eye coordination' },
      { name: 'Mirror Play', emoji: '🪞', desc: 'Hold baby in front of a mirror and make faces together.', benefit: 'Self-awareness, social development' },
    ],
    diy: [
      { name: 'Crinkle Bag', emoji: '🛍️', desc: 'Place a plastic bag inside a fabric pouch — baby loves the crinkle sound!', materials: 'Plastic bag + fabric offcut' },
      { name: 'Sensory Bottle', emoji: '🍶', desc: 'Fill a clear bottle with water, glitter and beads. Seal tightly.', materials: 'Empty plastic bottle + glitter + beads' },
      { name: 'Texture Board', emoji: '📋', desc: 'Glue different textured materials onto cardboard — sandpaper, cotton wool, bubble wrap.', materials: 'Cardboard + household textures' },
    ],
  },
  '1–3y': {
    toys: [
      { name: 'Shape Sorter', emoji: '🔷', desc: 'Box with different shaped holes — push matching shapes through the correct hole.', benefits: ['Shape recognition', 'Problem solving', 'Fine motor skills'] },
      { name: 'Stacking Blocks', emoji: '🧱', desc: 'Wooden or foam blocks for building towers and knocking them down.', benefits: ['Spatial reasoning', 'Cause & effect', 'Creativity'] },
      { name: 'Push & Pull Toys', emoji: '🚂', desc: 'Toys on a string or wheels that toddler can push or pull while walking.', benefits: ['Balance & coordination', 'Gross motor skills', 'Independence'] },
      { name: 'Simple Puzzles', emoji: '🧩', desc: '3–6 piece puzzles with chunky knobs for easy gripping.', benefits: ['Problem solving', 'Patience', 'Hand-eye coordination'] },
      { name: 'Play Dough', emoji: '🎨', desc: 'Soft dough for squishing, rolling and shaping — builds creativity.', benefits: ['Creativity', 'Fine motor skills', 'Sensory exploration'] },
    ],
    exercises: [
      { name: 'Obstacle Course', emoji: '🏃', desc: 'Use cushions, tunnels and low steps for toddler to climb over and crawl through.', benefit: 'Gross motor, balance, confidence' },
      { name: 'Dance Party', emoji: '💃', desc: 'Put on music and dance together — copy each other\'s moves!', benefit: 'Coordination, rhythm, joy' },
      { name: 'Ball Kick & Throw', emoji: '⚽', desc: 'Roll, kick and throw a soft ball back and forth.', benefit: 'Gross motor, tracking, taking turns' },
      { name: 'Animal Walks', emoji: '🐻', desc: 'Waddle like a duck, stomp like an elephant, hop like a bunny!', benefit: 'Body awareness, imagination' },
    ],
    diy: [
      { name: 'Cardboard Box Car', emoji: '🚗', desc: 'Cut windows and a steering wheel into a large box — instant car!', materials: 'Large cardboard box + marker' },
      { name: 'Homemade Playdough', emoji: '🎨', desc: 'Mix 2 cups flour, 1 cup salt, 1 cup water, food colouring. Cook on low heat.', materials: 'Flour + salt + water + food colouring' },
      { name: 'Sock Puppets', emoji: '🧦', desc: 'Draw faces on old socks and put on a puppet show together!', materials: 'Old socks + markers + googly eyes' },
      { name: 'Rain Maker', emoji: '🌧️', desc: 'Fill a paper towel tube with rice, seal ends with tape. Shake for rain sounds!', materials: 'Paper tube + rice + tape' },
    ],
  },
  '3–5y': {
    toys: [
      { name: 'LEGO Duplo', emoji: '🧱', desc: 'Large colourful building bricks perfect for small hands to click together.', benefits: ['Creativity', 'Engineering thinking', 'Fine motor skills'] },
      { name: 'Craft Kit', emoji: '✂️', desc: 'Child-safe scissors, glue sticks, stickers and coloured paper for creating.', benefits: ['Creativity', 'Focus', 'Following instructions'] },
      { name: 'Balance Bike', emoji: '🚲', desc: 'Pedal-free bike to build balance and confidence before a real bike.', benefits: ['Balance', 'Coordination', 'Confidence'] },
      { name: 'Memory Card Game', emoji: '🃏', desc: 'Flip cards to find matching pairs — great for 2+ players.', benefits: ['Memory', 'Concentration', 'Taking turns'] },
      { name: 'Dress-Up Box', emoji: '👑', desc: 'Collection of costumes, hats and accessories for imaginative play.', benefits: ['Imagination', 'Language development', 'Social skills'] },
    ],
    exercises: [
      { name: 'Hopscotch', emoji: '🟦', desc: 'Draw a hopscotch grid with chalk outside or tape inside.', benefit: 'Balance, counting, coordination' },
      { name: 'Simon Says', emoji: '🗣️', desc: 'Classic game — Simon says jump! Simon says touch your toes!', benefit: 'Listening skills, body awareness' },
      { name: 'Yoga for Kids', emoji: '🧘', desc: 'Simple poses like tree, cobra and child\'s pose — make animal sounds!', benefit: 'Flexibility, focus, calm' },
      { name: 'Scavenger Hunt', emoji: '🔍', desc: 'Hide objects around the house and give clues to find them.', benefit: 'Problem solving, reading readiness' },
    ],
    diy: [
      { name: 'Bird Feeder', emoji: '🐦', desc: 'Spread peanut butter on a pine cone, roll in birdseed, hang outside.', materials: 'Pine cone + peanut butter + birdseed + string' },
      { name: 'Marble Run', emoji: '🔮', desc: 'Tape toilet rolls and cardboard ramps to a wall — roll marbles down!', materials: 'Toilet rolls + cardboard + tape + marbles' },
      { name: 'Mini Garden', emoji: '🌱', desc: 'Plant seeds in a cup of soil together and track growth each day.', materials: 'Cup + soil + seeds + water' },
      { name: 'Cardboard Castle', emoji: '🏰', desc: 'Stack and tape boxes together, cut windows and a drawbridge.', materials: 'Various cardboard boxes + tape + markers' },
    ],
  },
};

// ── Editorial colour system ───────────────────────────────────────────────────
const AGE_THEMES: Record<string, any> = {
  '0–12m': { primary: '#FF6B6B', secondary: '#FFF0F0', label: 'INFANT',  accent: '#C0392B' },
  '1–3y':  { primary: '#F7B731', secondary: '#FFFBF0', label: 'TODDLER', accent: '#D4890A' },
  '3–5y':  { primary: '#26C6DA', secondary: '#F0FDFF', label: 'PRESCHOOL', accent: '#0097A7' },
};

const TAB_THEMES: Record<string, any> = {
  toys:      { color: '#E91E8C', bg: '#FFF0F8', label: 'TOYS & GEAR' },
  exercises: { color: '#00B894', bg: '#F0FFF8', label: 'ACTIVITIES' },
  diy:       { color: '#E67E22', bg: '#FFF8F0', label: 'DIY PROJECTS' },
};

interface Props {
  onClose: () => void;
  theme: any;
}

export default function LearnAndPlay({ onClose, theme }: Props) {
  const [activeAge, setActiveAge] = useState('0–12m');
  const [activeTab, setActiveTab] = useState('toys');
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const ages = ['0–12m', '1–3y', '3–5y'];
  const tabs = ['toys', 'exercises', 'diy'];

  const data      = LEARN_PLAY_DATA[activeAge];
  const ageTheme  = AGE_THEMES[activeAge];
  const tabTheme  = TAB_THEMES[activeTab];

  const switchContent = (age?: string, tab?: string) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    if (age) setActiveAge(age);
    if (tab) setActiveTab(tab);
  };

  const openGuideVideo = (projectName: string) => {
    const query = encodeURIComponent(`${projectName} DIY for kids ${activeAge}`);
    const url = `https://www.youtube.com/results?search_query=${query}`;

    Alert.alert(
      'Open YouTube?',
      'This will open third-party content in your browser or YouTube app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open',
          onPress: async () => {
            const canOpen = await Linking.canOpenURL(url);
            if (!canOpen) {
              Alert.alert('Unable to open link', 'Please try again later.');
              return;
            }
            await Linking.openURL(url);
          },
        },
      ]
    );
  };

  return (
    <Modal animationType="slide" transparent={false} visible={true}>
      <SafeAreaView style={[styles.container, { backgroundColor: ageTheme.secondary }]}>

        {/* ── Editorial Header ─────────────────────────────────────────────── */}
        <View style={[styles.header, { backgroundColor: ageTheme.primary }]}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerIssue}>INKA-TECH · PARENT GUIDE</Text>
            <Text style={styles.headerTitle}>Learn & Play</Text>
            <Text style={styles.headerSub}>Activities, toys & DIY ideas</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        {/* ── Age selector — editorial pill tabs ───────────────────────────── */}
        <View style={[styles.ageBar, { backgroundColor: ageTheme.primary }]}>
          {ages.map((age) => (
            <TouchableOpacity
              key={age}
              style={[
                styles.ageTab,
                activeAge === age && { backgroundColor: 'white' },
              ]}
              onPress={() => switchContent(age, undefined)}
            >
              <Text style={[
                styles.ageTabText,
                { color: activeAge === age ? ageTheme.primary : 'rgba(255,255,255,0.8)' },
                activeAge === age && { fontWeight: '800' },
              ]}>
                {AGE_THEMES[age].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Content tabs ─────────────────────────────────────────────────── */}
        <View style={[styles.tabBar, { backgroundColor: 'white', borderBottomColor: tabTheme.color + '33' }]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && { borderBottomColor: tabTheme.color, borderBottomWidth: 3 },
              ]}
              onPress={() => switchContent(undefined, tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && { color: TAB_THEMES[tab].color, fontWeight: '800' },
              ]}>
                {TAB_THEMES[tab].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Section label ─────────────────────────────────────────────────── */}
        <View style={[styles.sectionLabel, { backgroundColor: tabTheme.color }]}>
          <Text style={styles.sectionLabelText}>
            {activeAge} · {TAB_THEMES[activeTab].label}
          </Text>
        </View>

        {/* ── Content ───────────────────────────────────────────────────────── */}
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            contentContainerStyle={[styles.content, { backgroundColor: ageTheme.secondary }]}
            showsVerticalScrollIndicator={false}
          >

            {/* TOYS */}
            {activeTab === 'toys' && data.toys.map((toy: any, i: number) => (
              <View key={i} style={styles.editorialCard}>
                {/* Issue number / category bar */}
                <View style={[styles.cardCategory, { backgroundColor: tabTheme.color }]}>
                  <Text style={styles.cardCategoryText}>NO.{String(i + 1).padStart(2, '0')} · RECOMMENDED TOY</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.emojiBox, { backgroundColor: ageTheme.secondary, borderColor: tabTheme.color }]}>
                      <Text style={styles.emojiLarge}>{toy.emoji}</Text>
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={[styles.cardTitle, { color: ageTheme.accent }]}>{toy.name}</Text>
                    <Text style={styles.cardDesc}>{toy.desc}</Text>
                    <View style={styles.tagsWrap}>
                      {toy.benefits.map((b: string, j: number) => (
                        <View key={j} style={[styles.tag, { backgroundColor: tabTheme.bg, borderColor: tabTheme.color }]}>
                          <Text style={[styles.tagText, { color: tabTheme.color }]}>{b}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            ))}

            {/* EXERCISES */}
            {activeTab === 'exercises' && data.exercises.map((ex: any, i: number) => (
              <View key={i} style={styles.editorialCard}>
                <View style={[styles.cardCategory, { backgroundColor: tabTheme.color }]}>
                  <Text style={styles.cardCategoryText}>NO.{String(i + 1).padStart(2, '0')} · ACTIVITY</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.emojiBox, { backgroundColor: ageTheme.secondary, borderColor: tabTheme.color }]}>
                      <Text style={styles.emojiLarge}>{ex.emoji}</Text>
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={[styles.cardTitle, { color: ageTheme.accent }]}>{ex.name}</Text>
                    <Text style={styles.cardDesc}>{ex.desc}</Text>
                    <View style={[styles.benefitBar, { backgroundColor: tabTheme.bg, borderLeftColor: tabTheme.color }]}>
                      <Text style={[styles.benefitBarLabel, { color: tabTheme.color }]}>BENEFIT</Text>
                      <Text style={[styles.benefitBarText, { color: ageTheme.accent }]}>{ex.benefit}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            {/* DIY */}
            {activeTab === 'diy' && data.diy.map((item: any, i: number) => (
              <View key={i} style={styles.editorialCard}>
                <View style={[styles.cardCategory, { backgroundColor: tabTheme.color }]}>
                  <Text style={styles.cardCategoryText}>NO.{String(i + 1).padStart(2, '0')} · DIY PROJECT</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.emojiBox, { backgroundColor: ageTheme.secondary, borderColor: tabTheme.color }]}>
                      <Text style={styles.emojiLarge}>{item.emoji}</Text>
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={[styles.cardTitle, { color: ageTheme.accent }]}>{item.name}</Text>
                    <Text style={styles.cardDesc}>{item.desc}</Text>
                    <View style={[styles.materialsBox, { backgroundColor: tabTheme.bg, borderColor: tabTheme.color }]}>
                      <Text style={[styles.materialsLabel, { color: tabTheme.color }]}>🛒 YOU NEED</Text>
                      <Text style={[styles.materialsText, { color: ageTheme.accent }]}>{item.materials}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.guideBtn, { borderColor: tabTheme.color }]}
                      onPress={() => openGuideVideo(item.name)}
                    >
                      <Text style={[styles.guideBtnText, { color: tabTheme.color }]}>▶ Watch guide video</Text>
                    </TouchableOpacity>
                    <Text style={styles.externalNotice}>Opens YouTube content from third-party creators.</Text>
                  </View>
                </View>
              </View>
            ))}

            <Text style={[styles.footer, { color: ageTheme.accent }]}>
              Built with 💕 by Inka-Tech Solutions
            </Text>

          </ScrollView>
        </Animated.View>

      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    paddingTop: 16, paddingBottom: 20, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7, width: 80,
  },
  backBtnText:  { color: 'white', fontWeight: '700', fontSize: 14 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerIssue:  { color: 'rgba(255,255,255,0.75)', fontSize: 9, letterSpacing: 2, fontWeight: '700', marginBottom: 4 },
  headerTitle:  { color: 'white', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  headerSub:    { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2, fontStyle: 'italic' },

  // ── Age bar ─────────────────────────────────────────────────────────────────
  ageBar: {
    flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 12, gap: 8,
  },
  ageTab: {
    flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  ageTabText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  // ── Content tabs ────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  tab: {
    flex: 1, paddingVertical: 13, alignItems: 'center',
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabText: { color: '#AAA', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  // ── Section label ────────────────────────────────────────────────────────────
  sectionLabel: {
    paddingVertical: 6, paddingHorizontal: 16,
  },
  sectionLabelText: {
    color: 'white', fontSize: 10, fontWeight: '800', letterSpacing: 1.5,
  },

  // ── Content ─────────────────────────────────────────────────────────────────
  content: { padding: 14, paddingBottom: 40 },

  // ── Editorial card ───────────────────────────────────────────────────────────
  editorialCard: {
    backgroundColor: 'white', borderRadius: 16, marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  cardCategory: {
    paddingVertical: 6, paddingHorizontal: 14,
  },
  cardCategoryText: {
    color: 'white', fontSize: 9, fontWeight: '800', letterSpacing: 1.5,
  },
  cardBody: {
    flexDirection: 'row', padding: 14, gap: 12,
  },
  cardLeft: { alignItems: 'center' },
  emojiBox: {
    width: 64, height: 64, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  emojiLarge: { fontSize: 32 },
  cardRight:  { flex: 1 },
  cardTitle:  { fontSize: 16, fontWeight: '800', marginBottom: 5, letterSpacing: -0.3 },
  cardDesc:   { fontSize: 13, color: '#666', lineHeight: 19, marginBottom: 10 },

  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  tagText: { fontSize: 10, fontWeight: '700' },

  benefitBar: {
    borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 6,
    borderRadius: 4,
  },
  benefitBarLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  benefitBarText:  { fontSize: 12, fontWeight: '600' },

  materialsBox: {
    borderRadius: 10, padding: 10, borderWidth: 1,
  },
  materialsLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  materialsText:  { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  guideBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  guideBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  externalNotice: {
    marginTop: 6,
    fontSize: 10,
    color: '#7A7A7A',
  },

  footer: {
    textAlign: 'center', fontSize: 12, fontStyle: 'italic', marginTop: 10,
  },
});
