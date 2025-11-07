import { Identify, identify, init, setUserId, track } from '@amplitude/analytics-react-native';

const AMPLITUDE_API_KEY = '40a41fac41083648c73f0f648c196c12';

export const initAmplitude = async () => {
  try {
    await init(AMPLITUDE_API_KEY, undefined, {
      serverZone: 'EU',
      disableCookies: true, // Cookie kullanımını devre dışı bırak
      logLevel: 1, // Hata loglarını azalt (0: None, 1: Error, 2: Warn, 3: Verbose, 4: Debug)
    });
    console.log('Amplitude (EU Bölgesi) başlatıldı');
  } catch (error) {
    console.error("Amplitude başlatılamadı:", error);
  }
};

export const trackEvent = (eventName: string, eventProperties?: Record<string, any>) => {
  try {
    track(eventName, eventProperties);
  } catch (error) {
    console.error("Amplitude event hatası:", error);
  }
};

export const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
  try {
    setUserId(userId);
    if (userProperties) {
      const identifyObj = new Identify();
      for (const key in userProperties) {
        identifyObj.set(key, userProperties[key]);
      }
      identify(identifyObj);
    }
  } catch (error) {
    console.error("Amplitude identify hatası:", error);
  }
};