import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useNotifications, AppNotification } from '../hooks/useNotifications';
import { cancelConversationReminder } from '../services/notificationService';

interface Props {
  onClose:      () => void;
  onResumeChat: (companionId: 'lesedi' | 'brak') => void;
}

export function NotificationCentre({ onClose, onResumeChat }: Props) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  async function handleResumeChat(notif: AppNotification) {
    await markRead(notif.id);
    if (notif.companionId) {
      await cancelConversationReminder(notif.companionId);
      onResumeChat(notif.companionId);
    }
  }

  function renderItem({ item }: { item: AppNotification }) {
    const isUnfinished = item.type === 'unfinished_conversation';
    const isUnread     = !item.read;

    return (
      <TouchableOpacity
        style={[styles.item, isUnread && styles.itemUnread]}
        onPress={() => markRead(item.id)}
        activeOpacity={0.75}
      >
        <View style={[styles.icon, isUnfinished ? styles.iconOrange : styles.iconPurple]}>
          <Text style={styles.iconEmoji}>{isUnfinished ? '💬' : '✨'}</Text>
        </View>

        <View style={styles.body}>
          <View style={[styles.pill, isUnfinished ? styles.pillOrange : styles.pillPurple]}>
            <Text style={[styles.pillText, isUnfinished ? styles.pillTextOrange : styles.pillTextPurple]}>
              {isUnfinished ? '⏸  Unfinished chat' : '✦  Daily motivation'}
            </Text>
          </View>

          {item.companionId && (
            <Text style={styles.sender}>
              {item.companionId === 'lesedi' ? 'Lesedi' : 'Bra K'}
            </Text>
          )}

          {isUnfinished ? (
            <Text style={styles.message}>{item.body}</Text>
          ) : (
            <View style={styles.quoteBlock}>
              <Text style={styles.quoteText}>"{item.body}"</Text>
            </View>
          )}

          {isUnfinished && item.companionId && (
            <TouchableOpacity style={styles.resumeBtn} onPress={() => handleResumeChat(item)}>
              <Text style={styles.resumeText}>▶  Resume chat</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
        </View>

        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={styles.markAll}>Mark all read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🌿</Text>
          <Text style={styles.emptyTitle}>All caught up</Text>
          <Text style={styles.emptySub}>
            No new notifications.{'\n'}Your daily quote will arrive tomorrow morning.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}

function formatTime(ts: number): string {
  const diff  = Date.now() - ts;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return 'Just now';
  if (mins < 60)  return `${mins} min ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderColor: '#dde8df',
  },
  title:         { fontSize: 22, fontWeight: '700', color: '#1a2e1f' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  markAll:       { fontSize: 13, color: '#4a7c59', fontWeight: '500' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#e8f0eb', alignItems: 'center', justifyContent: 'center',
  },
  closeText: { color: '#4a7c59', fontSize: 14, fontWeight: '600' },

  item:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, paddingHorizontal: 20 },
  itemUnread: { backgroundColor: '#fdf8f2' },

  icon:        { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  iconOrange:  { backgroundColor: '#fdf0e3' },
  iconPurple:  { backgroundColor: '#f0eaff' },
  iconEmoji:   { fontSize: 22 },

  body: { flex: 1 },

  pill:          { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 5 },
  pillOrange:    { backgroundColor: '#fff0e3' },
  pillPurple:    { backgroundColor: '#f0eaff' },
  pillText:      { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  pillTextOrange:{ color: '#e8923a' },
  pillTextPurple:{ color: '#7c5cbf' },

  sender:  { fontSize: 13, fontWeight: '600', color: '#5a7060', marginBottom: 3 },
  message: { fontSize: 14, color: '#1a2e1f', lineHeight: 21, marginBottom: 6 },

  quoteBlock: {
    marginTop: 4, marginBottom: 6,
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: '#f7f3ff',
    borderLeftWidth: 3, borderLeftColor: '#7c5cbf',
    borderTopRightRadius: 8, borderBottomRightRadius: 8,
  },
  quoteText: { fontSize: 13, fontStyle: 'italic', color: '#5a3d96', lineHeight: 20 },

  resumeBtn: {
    alignSelf: 'flex-start', marginTop: 8, marginBottom: 4,
    backgroundColor: '#e8923a', borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 14,
  },
  resumeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  time: { fontSize: 12, color: '#8fa893', marginTop: 4 },

  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e8923a', marginTop: 6, flexShrink: 0 },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon:  { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1a2e1f', marginBottom: 8 },
  emptySub:   { fontSize: 14, color: '#8fa893', textAlign: 'center', lineHeight: 22 },
});
