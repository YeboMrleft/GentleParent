import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotifType = 'unfinished_conversation' | 'daily_quote';

export interface AppNotification {
  id:           string;
  type:         NotifType;
  title:        string;
  body:         string;
  companionId?: 'lesedi' | 'brak';
  timestamp:    number;
  read:         boolean;
}

const STORAGE_KEY = 'gp_notifications';

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener(notif => {
      addNotification(notif);
    });
    const responded = Notifications.addNotificationResponseReceivedListener(({ notification }) => {
      addNotification(notification);
    });
    return () => {
      received.remove();
      responded.remove();
    };
  }, []);

  async function loadNotifications() {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) setNotifications(JSON.parse(raw));
  }

  function addNotification(notif: Notifications.Notification) {
    const { title, body, data } = notif.request.content;
    const newItem: AppNotification = {
      id:          notif.request.identifier,
      type:        (data?.type as NotifType) ?? 'daily_quote',
      title:       title ?? '',
      body:        body  ?? '',
      companionId: data?.companionId as 'lesedi' | 'brak' | undefined,
      timestamp:   Date.now(),
      read:        false,
    };
    setNotifications(prev => {
      const updated = [newItem, ...prev].slice(0, 50);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAll = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setNotifications([]);
  }, []);

  return { notifications, unreadCount, markRead, markAllRead, clearAll };
}
