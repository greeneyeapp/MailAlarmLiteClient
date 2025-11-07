import { NativeModules, Platform } from 'react-native';
const { AlarmModule } = NativeModules;

export const setNativeAlarm = async (alarmId: string, timestamp: number, title: string, subtitle: string) => {
  if (Platform.OS !== 'android') return;
  
  if (AlarmModule) {
    try {
      await AlarmModule.setFullScreenAlarm(alarmId, timestamp, title, subtitle);
      console.log('Native Android alarmı kuruldu:', alarmId);
    } catch (e) {
      console.error('Native alarm kurulurken hata:', e);
    }
  } else {
    console.warn('AlarmModule bulunamadı. (Sadece Android)');
  }
};

export const cancelNativeAlarm = async (alarmId: string) => {
  if (Platform.OS !== 'android') return;

  if (AlarmModule) {
    try {
      await AlarmModule.cancelAlarm(alarmId);
      console.log('Native Android alarmı iptal edildi:', alarmId);
    } catch (e) {
      console.error('Native alarm iptal edilirken hata:', e);
    }
  }
};