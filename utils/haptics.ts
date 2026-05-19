import * as Haptics from 'expo-haptics';

export const haptics = {
  press: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  nav: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
};