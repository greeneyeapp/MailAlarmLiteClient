import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../core/constants/Colors';
import { useAuth } from '../context/AuthContext';

const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigation = useNavigation<any>();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      navigation.getParent()?.goBack();
    } catch (error: any) {
      let msg = 'Kayıt başarısız oldu. Lütfen tekrar deneyin.';
      if (error.code === 'auth/email-already-in-use') {
        msg = 'Bu e-posta adresi zaten kullanılıyor.';
      } else if (error.code === 'auth/weak-password') {
        msg = 'Şifre çok zayıf. En az 6 karakter olmalı.';
      }
      Alert.alert('Kayıt Başarısız', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="close" size={28} color={Colors.textDisabled} />
      </TouchableOpacity>
      
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoIcon, { backgroundColor: '#00A6FF' }]}>
            <MaterialIcons name="notifications-active" size={30} color="white" />
          </View>
          <Text style={styles.logoText}>Mail Alarm Lite</Text>
        </View>
        <Text style={styles.title}>Hesabını Oluştur</Text>

        <View style={styles.form}>
          <Text style={styles.label}>E-posta Adresiniz</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="mail" size={20} color="#00A6FF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-posta adresinizi girin"
              placeholderTextColor={Colors.textDisabled}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.label}>Şifre</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#00A6FF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Şifrenizi oluşturun (min. 6 karakter)"
              placeholderTextColor={Colors.textDisabled}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Text style={styles.label}>Şifreyi Doğrula</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#00A6FF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Şifrenizi tekrar girin"
              placeholderTextColor={Colors.textDisabled}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        </View>

        <TouchableOpacity style={[styles.button, { backgroundColor: Colors.accentOrange }]} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Kayıt Ol</Text>}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>
            Zaten hesabın var mı?{' '}
            <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
              Giriş Yap
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 1, padding: 5 },
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  logoContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  logoIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 28, color: Colors.textDark, marginLeft: 12, fontFamily: 'Inter-28pt-Bold' },
  title: { fontSize: 28, color: Colors.textDark, textAlign: 'center', marginBottom: 32, fontFamily: 'Inter-28pt-Bold' },
  form: { width: '100%' },
  label: { color: Colors.textDark, fontSize: 16, marginBottom: 8, fontFamily: 'Inter-18pt-Medium' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundInputDark, borderRadius: 8, height: 56, marginBottom: 16, borderWidth: 1, borderColor: '#4a4a4a' },
  inputIcon: { marginLeft: 16 },
  input: { flex: 1, paddingHorizontal: 12, color: Colors.textDark, fontSize: 16, fontFamily: 'Inter-18pt-Regular' },
  button: { height: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonText: { color: 'white', fontSize: 18, fontFamily: 'Inter-18pt-Bold' },
  loginContainer: { marginTop: 32, alignItems: 'center' },
  loginText: { color: Colors.textDisabled, fontSize: 14, fontFamily: 'Inter-18pt-Regular' },
  loginLink: { color: Colors.accentBlue, fontFamily: 'Inter-18pt-Bold' },
});

export default RegisterScreen;