import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/core/navigation/AppNavigator';
import { initServices } from './src/core/services/init';
import { AuthProvider } from './src/features/auth/context/AuthContext';

LogBox.ignoreLogs([
  "AsyncStorage has been extracted"
]);

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

const [fontsLoaded] = useFonts({
    // --- 18pt Ailesi ---
    'Inter-18pt-Regular': require('./assets/fonts/Inter_18pt-Regular.ttf'),
    'Inter-18pt-Medium': require('./assets/fonts/Inter_18pt-Medium.ttf'),
    'Inter-18pt-Bold': require('./assets/fonts/Inter_18pt-Bold.ttf'),

    // --- 24pt Ailesi ---
    'Inter-24pt-Regular': require('./assets/fonts/Inter_24pt-Regular.ttf'),
    'Inter-24pt-Medium': require('./assets/fonts/Inter_24pt-Medium.ttf'),
    'Inter-24pt-Bold': require('./assets/fonts/Inter_24pt-Bold.ttf'),

    // --- 28pt Ailesi ---
    'Inter-28pt-Regular': require('./assets/fonts/Inter_28pt-Regular.ttf'),
    'Inter-28pt-Medium': require('./assets/fonts/Inter_28pt-Medium.ttf'),
    'Inter-28pt-Bold': require('./assets/fonts/Inter_28pt-Bold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        await initServices();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    if (fontsLoaded) {
      prepare();
    }
  }, [fontsLoaded]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}