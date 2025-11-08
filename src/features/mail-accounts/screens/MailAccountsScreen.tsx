import { MaterialIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import { useNavigation } from '@react-navigation/native';
import * as AuthSession from 'expo-auth-session';
import {
  Prompt,
  ResponseType,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../core/constants/Colors';
import { useAuth } from '../../auth/context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

// ✅ Client IDs
// ÖNEMLİ: Google Cloud Console'dan aldığın "Web application" tipi OAuth Client ID'sini buraya yapıştır.
const WEB_CLIENT_ID = '864714574387-mcid117mjpbq8tvffudvrt38624lbh6r.apps.googleusercontent.com';

const MICROSOFT_CLIENT_ID = 'e3df04b4-24dc-4c66-b9d3-2811f85f1624';
const MICROSOFT_DISCOVERY_URL =
  'https://login.microsoftonline.com/common/v2.0';

// ✅ Yönlendirme URI'leri (Redirect URIs)
// Bu URI'leri Google/Microsoft panellerine eklemelisin.
const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({
  useProxy: true,
});
const MICROSOFT_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'com.greeneyeapp.mailalarmlite',
  path: 'oauth2redirect/microsoft',
});

console.log('KULLANILAN GOOGLE REDIRECT URI:', GOOGLE_REDIRECT_URI);
console.log('KULLANILAN MICROSOFT REDIRECT URI:', MICROSOFT_REDIRECT_URI);

const MailAccountsScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // ✅ Google OAuth - expo-auth-session ile
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: WEB_CLIENT_ID, // Sadece "Web application" Client ID'si
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    responseType: ResponseType.Code,
    redirectUri: GOOGLE_REDIRECT_URI,
  });

  // ✅ Google OAuth response handling
  useEffect(() => {
    if (!googleResponse) return;

    if (googleResponse.type === 'success') {
      const { code } = googleResponse.params;
      console.log('✅ Google authorization code alındı');
      sendCodeToBackend(code, 'google');
    } else if (
      googleResponse.type !== 'dismiss' &&
      googleResponse.type !== 'cancel'
    ) {
      console.error('❌ Google OAuth hatası:', googleResponse);
      Alert.alert('Google Hatası', 'Giriş işlemi başarısız oldu.');
      setIsConnecting(false);
    } else {
      console.log('ℹ️ Google OAuth kullanıcı tarafından iptal edildi');
      setIsConnecting(false);
    }
  }, [googleResponse]);

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
        'https://graph.microsoft.com/Mail.Read',
      ],
      redirectUri: MICROSOFT_REDIRECT_URI,
      responseType: ResponseType.Code,
      usePKCE: false,
      prompt: Prompt.SelectAccount,
    },
    microsoftDiscovery,
  );

  // ✅ Microsoft OAuth response handling
  useEffect(() => {
    if (!msResponse) return;

    if (msResponse.type === 'success') {
      const { code } = msResponse.params;
      console.log('✅ Microsoft authorization code alındı');
      sendCodeToBackend(code, 'microsoft');
    } else if (msResponse.type !== 'dismiss' && msResponse.type !== 'cancel') {
      console.error('❌ Microsoft OAuth hatası:', msResponse);
      Alert.alert('Microsoft Hatası', 'Giriş işlemi başarısız oldu.');
      setIsConnecting(false);
    } else {
      console.log('ℹ️ Microsoft OAuth kullanıcı tarafından iptal edildi');
      setIsConnecting(false);
    }
  }, [msResponse]);

  // ✅ Google giriş akışı
  const handleGoogleLogin = async () => {
    if (!user) {
      navigation.navigate('AuthStack');
      return;
    }
    if (isConnecting) return;

    setIsConnecting(true);
    await googlePromptAsync();
  };

  // ✅ Microsoft girişini tetikler
  const handleMicrosoftLogin = async () => {
    if (!user) {
      navigation.navigate('AuthStack');
      return;
    }
    if (isConnecting) return;

    setIsConnecting(true);
    await msPromptAsync();
  };

  // ✅ Backend'e kod gönderme
  const sendCodeToBackend = async (code: string, provider: 'google' | 'microsoft') => {
    if (!user) {
      setIsConnecting(false);
      return;
    }

    try {
      const functionName =
        provider === 'google'
          ? 'connectGoogleAccount'
          : 'connectMicrosoftAccount';

      console.log(`📤 ${provider} backend'e gönderiliyor...`);
      const functionsInstance = (functions() as any).region('europe-west3');
      const connectFunction = functionsInstance.httpsCallable(functionName);

      const result: any = await connectFunction({
        authCode: code,
        redirectUri:
          provider === 'google' ? GOOGLE_REDIRECT_URI : MICROSOFT_REDIRECT_URI,
      });

      console.log(`📥 ${provider} backend cevabı:`, result.data);

      if (result.data.status === 'success') {
        Alert.alert('Başarılı', `${result.data.email} başarıyla bağlandı.`);
      } else {
        throw new Error(
          result.data.message || 'Bilinmeyen bir backend hatası oluştu.',
        );
      }
    } catch (error: any) {
      console.error(`❌ ${provider} backend hatası DETAY:`, {
        code: error.code,
        message: error.message,
        details: error.details,
      });

      let errorMessage = 'Sunucuyla iletişim kurulamadı.';
      if (error.code === 'functions/unauthenticated') {
        errorMessage = 'Oturum süreniz dolmuş. Lütfen yeniden giriş yapın.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Bağlantı Hatası', errorMessage);
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
        .onSnapshot(
          querySnapshot => {
            const accountsList: any[] = [];
            querySnapshot.forEach(doc => {
              accountsList.push({ id: doc.id, ...doc.data() });
            });
            setAccounts(accountsList);
            setLoading(false);
          },
          error => {
            console.error('❌ Hesapları çekerken hata:', error);
            setLoading(false);
          },
        );
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
          },
        },
      ],
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
              uri:
                item.provider === 'google'
                  ? 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png'
                  : 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Microsoft_Office_15_Logo.svg/800px-Microsoft_Office_15_Logo.svg.png',
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
        <Button
          title="Giriş Yap / Kayıt Ol"
          onPress={() => navigation.navigate('AuthStack')}
        />
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
        ListEmptyComponent={() =>
          !loading &&
          !isConnecting && (
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
        }
      />

      {accounts.length > 0 && !loading && !isConnecting && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              Alert.alert('Hesap Ekle', 'Hangi hesabı eklemek istersiniz?', [
                { text: 'Google', onPress: handleGoogleLogin },
                { text: 'Microsoft', onPress: handleMicrosoftLogin },
                { text: 'İptal', style: 'cancel' },
              ]);
            }}>
            <MaterialIcons name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>Yeni Hesap Ekle</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const ProviderButton = ({ provider, icon, color, onPress }: any) => (
  <TouchableOpacity
    style={[styles.providerButton, { borderColor: color + '50' }]}
    onPress={onPress}>
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