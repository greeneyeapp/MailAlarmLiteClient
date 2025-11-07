import { setNotificationCategories } from '../../features/alarms/services/NotificationManager.ios';
import { initAmplitude } from './amplitude';

export const initServices = async () => {
  await initAmplitude();
  await setNotificationCategories();
};