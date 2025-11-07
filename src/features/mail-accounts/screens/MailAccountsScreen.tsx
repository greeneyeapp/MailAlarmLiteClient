import { MaterialIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { httpsCallable } from '@react-native-firebase/functions';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useNavigation } from '@react-navigation/native';
import {
  Prompt,
  ResponseType,
  useAuthRequest,
  useAutoDiscovery
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
// DÜZELTME: useState ve useEffect importları eklendi
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../core/constants/Colors';
import { useAuth } from '../../auth/context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

// ✅ Client IDs
const WEB_CLIENT_ID = '864714574387-8h2osphqh2mcnp11fcnpcrj4va1l8to9.apps.googleusercontent.com';
// YENİ: Azure'da oluşturduğunuz yeni uygulamanın Client ID'si
const MICROSOFT_CLIENT_ID = 'e3df04b4-24dc-4c66-b9d3-2811f85f1624';

const MICROSOFT_DISCOVERY_URL = 'https://login.microsoftonline.com/common/v2.0';

// ✅ Microsoft için Redirect URI (Bu değerin Azure'daki ile aynı olduğundan emin olun)
const REDIRECT_URI = 'com.greeneyeapp.mailalarmlite://oauth2redirect';

// Hata ayıklama için konsola yazdırma
console.log("KULLANILAN REDIRECT URI:", REDIRECT_URI);

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
      offlineAccess: true, // Sunucuda refresh token alabilmek için bu zorunludur
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
      usePKCE: false, // Sunucu tarafı akış için PKCE kapalı
      prompt: Prompt.SelectAccount,
    },
    microsoftDiscovery
  );

  useEffect(() => {
    if (isConnecting) return; // Zaten bir işlem varsa tekrar tetikleme
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

  // YENİ & DÜZELTİLMİŞ: Google giriş akışı artık `serverAuthCode` kullanıyor
  const handleGoogleLogin = async () => {
    if (!user) {
      navigation.navigate('AuthStack');
      return;
    }
    if (isConnecting) return;
    setIsConnecting(true);

    try {
      console.log('🚀 Google Sign-In başlatılıyor...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { serverAuthCode } = await GoogleSignin.signIn();

      if (serverAuthCode) {
        console.log('✅ Google Server Auth Code alındı, backend\'e gönderiliyor...');
        await sendCodeToBackend(serverAuthCode, 'google');
      } else {
        throw new Error("Google'dan sunucu yetki kodu alınamadı.");
      }
    } catch (error: any) {
      if (error.code === 12501) { // Kullanıcı iptal etti
        console.log('Kullanıcı Google giriş işlemini iptal etti.');
        setIsConnecting(false);
      } else {
        console.error('❌ Google giriş hatası:', error);
        Alert.alert('Google Hatası', `Hata: ${error.message}` || 'Bilinmeyen hata');
        setIsConnecting(false);
      }
    }
  };

  // YENİ & DÜZELTİLMİŞ: Microsoft girişini tetikler
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

  // YENİ & BİRLEŞTİRİLMİŞ: Hem Google hem Microsoft için tek backend fonksiyonu
  const sendCodeToBackend = async (code: string, provider: 'google' | 'microsoft') => {
    if (!user) {
      setIsConnecting(false);
      return;
    };

    // isConnecting zaten true olmalı, ama garantiye alalım
    if (!isConnecting) setIsConnecting(true);

    try {
      // Hangi Firebase Cloud Function'ın çağrılacağını belirle
      const functionName = provider === 'google' ? 'connectgoogleaccount' : 'connectmicrosoftaccount';
      const connectFunction = httpsCallable(undefined, functionName);

      console.log(`📤 ${provider} backend'e gönderiliyor...`);

      const result: any = await connectFunction({
        authCode: code,
        redirectUri: REDIRECT_URI,
      });

      console.log(`📥 ${provider} backend cevabı:`, result.data);

      if (result.data.status === 'success') {
        Alert.alert('Başarılı', `${result.data.email} başarıyla bağlandı.`);
        // Firestore onSnapshot zaten listeyi güncelleyeceği için fetchAccounts() çağırmaya gerek yok.
      } else {
        throw new Error(result.data.message || 'Bilinmeyen bir backend hatası oluştu.');
      }
    } catch (error: any) {
      // Hatanın tüm detaylarını görmek için objenin tamamını loglayalım
      console.error(`❌ ${provider} backend hatası DETAY:`, JSON.stringify(error, null, 2));
      Alert.alert('Bağlantı Hatası', `Kod: ${error.code} - Mesaj: ${error.message}` || 'Sunucuyla iletişim kurulamadı.');
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
                ? 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png'
                : 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Microsoft_Office_15_Logo.svg/800px-Microsoft_Office_15_Logo.svg.png'
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
            {loading ? 'Hesaplar yükleniyor...' : 'Bağlanıyor... Lütfen bekleyin.'}
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
                onPress={handleGoogleLogin}
              />
              <ProviderButton
                provider="Outlook / Microsoft 365"
                icon="business"
                color="#0072C6"
                onPress={handleMicrosoftLogin}
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
                { text: 'Google', onPress: handleGoogleLogin },
                { text: 'Microsoft', onPress: handleMicrosoftLogin },
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 },
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
  logo: { width: 24, height: 24, resizeMode: 'contain' },
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
  addButtonText: { color: 'white', fontSize: 16, fontFamily: 'Inter-18pt-Bold' },
  deleteButton: {
    backgroundColor: Colors.accentRed,
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