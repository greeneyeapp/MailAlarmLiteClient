import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ALARM_CATEGORY_ID = 'alarm-actions';

export const requestIOSCriticalAlertsPermission = async () => {
  if (Platform.OS !== 'ios') return;
  
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowCriticalAlerts: true,
    },
  });
  if (status !== 'granted') {
    console.warn('Kritik Uyarı izni alınamadı!');
  }
  return status === 'granted';
};

export const scheduleIOSNotification = async (alarmId: string, title: string, body: string, timestamp: number, isCritical: boolean, sound: string = 'default') => {
  if (Platform.OS !== 'ios') return;

  await Notifications.scheduleNotificationAsync({
    identifier: alarmId,
    content: {
      title: title,
      body: body,
      sound: isCritical ? { critical: true, name: sound, volume: 1.0 } : sound,
      categoryIdentifier: ALARM_CATEGORY_ID,
    },
    trigger: { date: timestamp },
  });
};

export const cancelIOSNotification = async (alarmId: string) => {
  if (Platform.OS !== 'ios') return;
  await Notifications.cancelScheduledNotificationAsync(alarmId);
};

export const setNotificationCategories = async () => {
  if (Platform.OS !== 'ios') return;
  
  await Notifications.setNotificationCategoryAsync(ALARM_CATEGORY_ID, [
    { identifier: 'snooze', buttonTitle: 'Ertele', options: {} },
    { identifier: 'stop', buttonTitle: 'Durdur', options: { isDestructive: true } },
  ]);
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});