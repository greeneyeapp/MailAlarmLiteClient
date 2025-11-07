import React from 'react';
import { AuthStatus, useAuth } from '../../features/auth/context/AuthContext';
import OnboardingScreen from '../../features/auth/screens/OnboardingScreen';
import SplashScreen from '../../features/auth/screens/SplashScreen';
import MainStackNavigator from './MainStackNavigator';

const AppNavigator = () => {
  const { status } = useAuth();

  if (status === AuthStatus.LOADING) {
    return <SplashScreen />;
  }

  if (status === AuthStatus.FIRST_LAUNCH) {
    return <OnboardingScreen />;
  }

  return <MainStackNavigator />;
};

export default AppNavigator;