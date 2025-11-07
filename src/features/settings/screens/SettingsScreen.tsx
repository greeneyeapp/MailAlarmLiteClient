import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../core/constants/Colors';
import { trackEvent } from '../../../core/services/amplitude';
import { useAuth } from '../../auth/context/AuthContext';

const SettingsScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [appLock, setAppLock] = useState(false);

  const handleLogin = () => {
    trackEvent('Login Started', { trigger: 'Settings' });
    navigation.navigate('AuthStack');
  };
  
  const handleUpgrade = () => {
    trackEvent('Pro Upsell Viewed', { trigger: 'Settings' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ayarlar</Text>
      </View>
      <ScrollView style={styles.container}>
        <Text style={styles.sectionTitle}>UYGULAMA</Text>
        <View style={styles.card}>
          <SettingItem 
            icon="star" 
            title="Mail Alarm Pro'ya Yükselt" 
            isNavigatable={true} 
            onPress={handleUpgrade}
          />
        </View>

        <Text style={styles.sectionTitle}>HESAP</Text>
        <View style={styles.card}>
          {user ? (
            <View style={styles.itemContainer}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="person" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.itemTitle}>{user.email}</Text>
            </View>
          ) : (
            <SettingItem 
              icon="login" 
              title="Giriş Yap / Kayıt Ol" 
              isNavigatable={true} 
              onPress={handleLogin} 
            />
          )}
        </View>
        
        <Text style={styles.sectionTitle}>BİLDİRİMLER</Text>
        <View style={styles.card}>
          <SettingItem icon="notifications-active" title="Yüksek Aciliyet Ayarları" isNavigatable={true} />
          <SettingItem icon="notifications" title="Orta Aciliyet Ayarları" isNavigatable={true} />
          <SettingItem icon="notifications-off" title="Düşük Aciliyet Ayarları" isNavigatable={true} />
        </View>

        <Text style={styles.sectionTitle}>GÜVENLİK & GİZLİLİK</Text>
        <View style={styles.card}>
          <SettingItem icon="shield" title="Gizlilik Politikası" isNavigatable={true} />
          <SettingItem 
            icon="fingerprint" 
            title="Uygulama Kilidi" 
            isNavigatable={false}
            control={<Switch value={appLock} onValueChange={setAppLock} trackColor={{false: '#767577', true: Colors.primary}} thumbColor={'white'} />}
          />
        </View>
        
        {user && (
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <MaterialIcons name="logout" size={20} color={Colors.accentRed} />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const SettingItem = ({ icon, title, isNavigatable, control = null, onPress = () => {} }) => (
  <TouchableOpacity style={styles.itemContainer} disabled={!isNavigatable && !control} onPress={onPress}>
    <View style={styles.iconContainer}>
      <MaterialIcons name={icon} size={22} color={Colors.primary} />
    </View>
    <Text style={styles.itemTitle}>{title}</Text>
    {isNavigatable && !control && <MaterialIcons name="chevron-right" size={24} color={Colors.textDisabled} />}
    {control && control}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: { padding: 16, alignItems: 'center', paddingTop: 20 },
  headerTitle: { fontSize: 24, color: 'white', fontFamily: 'Inter-24pt-Bold' },
  container: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { color: Colors.textDisabled, fontSize: 14, marginTop: 24, marginBottom: 8, fontFamily: 'Inter-18pt-Bold', textTransform: 'uppercase' },
  card: { backgroundColor: Colors.backgroundCard, borderRadius: 12, overflow: 'hidden' },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
    minHeight: 70,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemTitle: { flex: 1, color: 'white', fontSize: 16, fontFamily: 'Inter-18pt-Medium' },
  logoutButton: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 32,
    marginBottom: 60,
  },
  logoutText: { color: Colors.accentRed, fontSize: 16, marginLeft: 8, fontFamily: 'Inter-18pt-Medium' },
});

export default SettingsScreen;