import { MaterialIcons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { httpsCallable } from '@react-native-firebase/functions';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useNavigation } from '@react-navigation/native';
import {
  makeRedirectUri,
  Prompt,
  ResponseType,
  useAuthRequest,
  useAutoDiscovery
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../core/constants/Colors';
import { useAuth } from '../../auth/context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

// ✅ Client IDs
const WEB_CLIENT_ID = '864714574387-8h2osxpqh2mcrpjcfcva1i9tt9j.apps.googleusercontent.com';
const MICROSOFT_CLIENT_ID = 'aac18dfb-966d-4db2-b266-53455f9f0f4e';

const MICROSOFT_DISCOVERY_URL = 'https://login.microsoftonline.com/common/v2.0';

// ✅ Microsoft için Redirect URI
const REDIRECT_URI = Platform.select({
  android: 'com.greeneyeapp.mailalarmlite:/oauth2redirect',
  ios: 'com.greeneyeapp.mailalarmlite:/oauth2redirect',
  default: makeRedirectUri({ scheme: 'com.greeneyeapp.mailalarmlite' })
});

const MailAccountsScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // ✅ Google Sign-In Yapılandırması
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: true,
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
      ],
    });
    
    console.log('✅ Google Sign-In yapılandırıldı');
  }, []);

  // ✅ Microsoft OAuth
  const microsoftDiscovery = useAutoDiscovery(MICROSOFT_DISCOVERY_URL);
  const [msRequest, msResponse, msPromptAsync] = useAuthRequest(
    {
      clientId: MICROSOFT_CLIENT_ID,
      scopes: [
        'openid',
        'profile',
        'email',
        'offline_access',
        'https://graph.microsoft.com/Mail.Read'
      ],
      redirectUri: REDIRECT_URI,
      responseType: ResponseType.Code,
      usePKCE: false,
      prompt: Prompt.SelectAccount,
    },
    microsoftDiscovery
  );

  useEffect(() => {
    if (msResponse?.type === 'success') {
      const { code } = msResponse.params;
      sendCodeToBackend(code, 'microsoft');
    } else if (msResponse?.type === 'error') {
      console.error('❌ Microsoft hata:', msResponse.error);
      Alert.alert('Microsoft Hatası', msResponse.error?.message || 'Bilinmeyen hata');
      setIsConnecting(false);
    } else if (msResponse?.type === 'dismiss') {
      setIsConnecting(false);
    }
  }, [msResponse]);

  // ✅ GOOGLE LOGIN - Firebase Auth ile
  const handleGoogleLogin = async () => {
    if (!user) {
      navigation.navigate('AuthStack');
      return;
    }
    
    if (isConnecting) return;
    setIsConnecting(true);

    try {
      console.log('🚀 Google Sign-In başlatılıyor...');
      
      // 1. Google ile oturum aç
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { idToken } = await GoogleSignin.signIn();
      
      console.log('✅ Google ID Token alındı');
      
      // 2. Firebase credential oluştur
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // 3. Firebase ile geçici giriş yap (sadece token almak için)
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      console.log('✅ Firebase credential alındı');
      
      // 4. Access token ve refresh token al
      const firebaseUser = userCredential.user;
      const accessToken = await firebaseUser.getIdToken();
      
      console.log('✅ Access token alındı');
      
      // 5. Google user info al
      const userInfo = await GoogleSignin.signIn();
      
      // 6. Backend'e gönder
      await sendGoogleTokenToBackend(accessToken, userInfo.user.email);
      
      // 7. Firebase'den çıkış yap (ana user'ı etkilememek için)
      // await auth().signOut();
      
    } catch (error: any) {
      console.error('❌ Google giriş hatası:', error);
      Alert.alert('Google Hatası', error.message || 'Bilinmeyen hata');
      setIsConnecting(false);
    }
  };

  const sendGoogleTokenToBackend = async (accessToken: string, email: string) => {
    if (!user) return;
    
    try {
      const connectFunction = httpsCallable(undefined, 'connectGoogleAccountHandler');
      
      console.log('📤 Google backend\'e gönderiliyor...');
      
      const result: any = await connectFunction({ 
        accessToken: accessToken,
        email: email,
      });
      
      console.log('📥 Google backend cevabı:', result.data);
      
      if (result.data.status === 'success') {
        Alert.alert('Başarılı', `${email} başarıyla bağlandı.`);
        fetchAccounts();
      } else {
        throw new Error(result.data.message || 'Backend hatası');
      }
    } catch (error: any) {
      console.error('❌ Google backend hatası:', error);
      Alert.alert('Hata', error.message || 'Sunucu hatası');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    if (!user) {
      navigation.navigate('AuthStack');
      return;
    }
    
    if (isConnecting) return;
    setIsConnecting(true);

    try {
      console.log('🚀 Microsoft OAuth başlatılıyor...');
      await msPromptAsync();
    } catch (e) {
      console.error("❌ Microsoft prompt hatası:", e);
      setIsConnecting(false);
      Alert.alert('Hata', 'Microsoft giriş ekranı açılamadı');
    }
  };

  const sendCodeToBackend = async (code: string, provider: 'microsoft') => {
    if (!user) return;
    
    try {
      const connectFunction = httpsCallable(undefined, 'connectMicrosoftAccountHandler');
      
      console.log('📤 Microsoft backend\'e gönderiliyor...');
      
      const result: any = await connectFunction({ 
        authCode: code,
        redirectUri: REDIRECT_URI,
      });
      
      console.log('📥 Microsoft backend cevabı:', result.data);
      
      if (result.data.status === 'success') {
        Alert.alert('Başarılı', `${result.data.email} başarıyla bağlandı.`);
        fetchAccounts();
      } else {
        throw new Error(result.data.message || 'Backend hatası');
      }
    } catch (error: any) {
      console.error('❌ Microsoft backend hatası:', error);
      Alert.alert('Hata', error.message || 'Sunucu hatası');
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchAccounts = () => {
    if (user) {
      setLoading(true);
      const subscriber = firestore()
        .collection('users')
        .doc(user.id)
        .collection('mailAccounts')
        .onSnapshot(querySnapshot => {
          const accountsList: any[] = [];
          querySnapshot.forEach(doc => {
            accountsList.push({ id: doc.id, ...doc.data() });
          });
          setAccounts(accountsList);
          setLoading(false);
        }, (error) => {
          console.error("❌ Hesapları çekerken hata:", error);
          setLoading(false);
        });
      return () => subscriber();
    } else {
      setAccounts([]);
    }
  };
  
  useEffect(fetchAccounts, [user]);

  const handleOAuthLogin = async (provider: 'google' | 'microsoft') => {
    if (provider === 'google') {
      await handleGoogleLogin();
    } else {
      await handleMicrosoftLogin();
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!user) return;
    
    Alert.alert(
      'Hesabı Kaldır',
      'Bu hesabı kaldırmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore()
                .collection('users')
                .doc(user.id)
                .collection('mailAccounts')
                .doc(id)
                .delete();
            } catch (error) {
              Alert.alert('Hata', 'Hesap silinirken bir sorun oluştu.');
            }
          }
        }
      ]
    );
  };

  const renderRightActions = (onDelete: () => void) => (
    <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
      <MaterialIcons name="delete" size={24} color="white" />
      <Text style={styles.deleteText}>Kaldır</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: any }) => (
    <Swipeable renderRightActions={() => renderRightActions(() => handleDelete(item.id))}>
      <View style={styles.itemContainer}>
        <View style={styles.logoContainer}>
          <Image 
            source={{ 
              uri: item.provider === 'google' 
                ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAD5u10blDruPxuxJnDMX_ZYT2uMDxGPZWSCKsesM21IT_wkmPciA-Dz8poRPmfLxvAV6fZZYuGe4EJxEkNj2RzbRal1ku5rFBl-q4lXVufUDfjPZ0O0iPIL1Y-09-Hyr4YTMC7uGld6jmCoEgK1FbPwgzwsCuKk0Vsj_TAawkpIACycLUFA_WAEImV-iZnwmKyr2WB4SpFp99trziJDZb5a0yTLDG0RWjSnVtNSLDyiUB5KJQKMsMoEB1SO2qFQ8q444VjFarts6zx' 
                : 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3XQcC1pWn_2TW-mELBp8TMyJUIxlBeTZSHAX3W2vyyDNfil2Q2YmjZcnL6rU7c0Bo6Xf6TvY8NCb9Lb2qg4QRmfRbhnkNUHSga78WWRYTQpBM5CipmtdVSr4_sJxe6l1DLxQQc4Juz_rDN2ZYE2Z9be3dZv88tOE3oPDQFRYz8fpUqQnrsD6mSZJU5b3KZE9v61NWFjMp_LN27mOrbs4zr2JtEMARyTf4EdB_gZzo_sNWZ9ElVOGObHhhYIFB69nn9mbDgwlzAxuq' 
            }} 
            style={styles.logo} 
          />
        </View>
        <Text style={styles.emailText}>{item.email}</Text>
      </View>
    </Swipeable>
  );

  if (!user) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.guestContainer]}>
        <MaterialIcons name="mail" size={60} color={Colors.primary} />
        <Text style={styles.guestTitle}>Mail Hesaplarınızı Yönetin</Text>
        <Text style={styles.guestSubtitle}>
          Google veya Outlook hesaplarınızı bağlayarak mail alarmları oluşturmak için lütfen giriş yapın.
        </Text>
        <Button title="Giriş Yap / Kayıt Ol" onPress={() => navigation.navigate('AuthStack')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eklenmiş Hesaplar</Text>
      </View>
      
      {(loading || isConnecting) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {loading ? 'Hesaplar yükleniyor...' : 'Bağlanıyor...'}
          </Text>
        </View>
      )}
      
      <FlatList
        data={accounts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          !loading && !isConnecting && (
            <View style={styles.providerContainer}>
              <Text style={styles.providerHeader}>Hangi hesabı eklemek istersiniz?</Text>
              <ProviderButton 
                provider="Google" 
                icon="mail" 
                color="#4285F4" 
                onPress={() => handleOAuthLogin('google')} 
              />
              <ProviderButton 
                provider="Outlook / Microsoft 365" 
                icon="business" 
                color="#0072C6" 
                onPress={() => handleOAuthLogin('microsoft')} 
              />
            </View>
          )
        )}
      />
      
      {accounts.length > 0 && !loading && !isConnecting && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => {
              Alert.alert('Hesap Ekle', 'Hangi hesabı eklemek istersiniz?', [
                { text: 'Google', onPress: () => handleOAuthLogin('google') },
                { text: 'Microsoft', onPress: () => handleOAuthLogin('microsoft') },
                { text: 'İptal', style: 'cancel' }
              ]);
            }}
          >
            <MaterialIcons name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>Yeni Hesap Ekle</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const ProviderButton = ({ provider, icon, color, onPress }: any) => (
  <TouchableOpacity style={[styles.providerButton, { borderColor: color + '50' }]} onPress={onPress}>
    <MaterialIcons name={icon} size={24} color={color} />
    <Text style={styles.providerButtonText}>{provider}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundDark },
  header: { padding: 16, paddingTop: 20 },
  headerTitle: { fontSize: 24, color: 'white', fontFamily: 'Inter-24pt-Bold' },
  list: { padding: 16, gap: 12 },
  loadingContainer: { marginTop: 20, alignItems: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondaryDark, fontFamily: 'Inter-18pt-Regular' },
  providerContainer: { marginTop: 30, paddingHorizontal: 20, gap: 15 },
  providerHeader: { color: Colors.textSecondaryDark, textAlign: 'center', marginBottom: 10, fontFamily: 'Inter-18pt-Medium', fontSize: 16 },
  providerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    gap: 15,
  },
  providerButtonText: { color: 'white', fontSize: 16, fontFamily: 'Inter-18pt-Medium' },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    padding: 12,
    borderRadius: 8,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logo: { width: 24, height: 24 },
  emailText: { color: 'white', fontSize: 16, fontFamily: 'Inter-18pt-Regular' },
  footer: { padding: 16 },
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter-Bold' },
  deleteButton: {
    backgroundColor: Colors.accentOrange,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 8,
  },
  deleteText: { color: 'white', fontSize: 12, marginTop: 4, fontFamily: 'Inter-18pt-Regular' },
  guestContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  guestTitle: {
    fontSize: 22,
    color: 'white',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Inter-24pt-Bold',
  },
  guestSubtitle: {
    fontSize: 16,
    color: Colors.textSecondaryDark,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Inter-18pt-Regular',
  },
});

export default MailAccountsScreen;