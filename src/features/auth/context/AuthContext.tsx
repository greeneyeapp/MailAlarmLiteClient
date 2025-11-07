import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserWithEmailAndPassword, FirebaseAuthTypes, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { identifyUser, trackEvent } from '../../../core/services/amplitude';

export interface UserProfile {
  id: string;
  email: string;
}

export enum AuthStatus {
  LOADING,
  FIRST_LAUNCH,
  UNAUTHENTICATED_GUEST,
  AUTHENTICATED_USER,
}

interface AuthContextType {
  status: AuthStatus;
  user: UserProfile | null;
  firebaseUser: FirebaseAuthTypes.User | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  completeOnboarding: () => void;
  syncUser: (fbUser: FirebaseAuthTypes.User) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
const firebaseAuth = getAuth();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState(AuthStatus.LOADING);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const hasCompletedOnboarding = await AsyncStorage.getItem('@hasCompletedOnboarding');
        if (hasCompletedOnboarding !== 'true') {
          setStatus(AuthStatus.FIRST_LAUNCH);
          return false;
        }
        return true;
      } catch (e) {
        return true; 
      }
    };

    const subscriber = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      const onboardingDone = await checkOnboarding();
      if (!onboardingDone) return;
      
      if (fbUser) {
        await syncUser(fbUser);
      } else {
        setUser(null);
        setFirebaseUser(null);
        setStatus(AuthStatus.UNAUTHENTICATED_GUEST);
      }
    });
    
    return subscriber; 
  }, []);

  const syncUser = async (fbUser: FirebaseAuthTypes.User) => {
    setFirebaseUser(fbUser);
    const userDoc = await firestore().collection('users').doc(fbUser.uid).get();
    
    let userProfile: UserProfile;
    if (!userDoc.exists) {
      userProfile = {
        id: fbUser.uid,
        email: fbUser.email!,
      };
      await firestore().collection('users').doc(fbUser.uid).set(userProfile);
    } else {
      userProfile = userDoc.data() as UserProfile;
    }
    
    setUser(userProfile);
    identifyUser(fbUser.uid, { email: fbUser.email });
    setStatus(AuthStatus.AUTHENTICATED_USER);
  };

  const login = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, pass);
    await syncUser(userCredential.user);
    trackEvent('User Logged In');
  };

  const register = async (email: string, pass: string) => {
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
    await syncUser(userCredential.user);
    trackEvent('User Signed Up');
  };

  const logout = async () => {
    await signOut(firebaseAuth);
    setUser(null);
    setFirebaseUser(null);
    setStatus(AuthStatus.UNAUTHENTICATED_GUEST);
    trackEvent('User Logged Out');
  };
  
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@hasCompletedOnboarding', 'true');
      setStatus(AuthStatus.UNAUTHENTICATED_GUEST);
      trackEvent('Onboarding Completed');
    } catch(e) {
      console.error("Onboarding tamamlama hatası:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ status, user, firebaseUser, login, register, logout, completeOnboarding, syncUser, setPremiumStatus: () => {} }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};