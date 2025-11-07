import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../core/constants/Colors';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigation = useNavigation<any>();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigation.getParent()?.goBack();
    } catch (error: any) {
      Alert.alert('Giriş Başarısız', 'E-posta veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.getParent()?.goBack()}>
        <MaterialIcons name="close" size={28} color={Colors.textDisabled} />
      </TouchableOpacity>
      
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoIcon, { backgroundColor: Colors.accentOrange }]}>
            <MaterialIcons name="mail" size={30} color="white" />
          </View>
          <Text style={styles.logoText}>Mail Alarm Lite</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Giriş Yap</Text>
          <Text style={styles.subtitle}>Hesabınıza tekrar hoş geldiniz</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>E-posta Adresi</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="alternate-email" size={20} color={Colors.textDisabled} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-posta adresinizi girin"
              placeholderTextColor={Colors.textDisabled}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={styles.label}>Şifre</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color={Colors.textDisabled} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Şifrenizi girin"
              placeholderTextColor={Colors.textDisabled}
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeIcon}>
              <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={20} color={Colors.textDisabled} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.forgotPassContainer}>
          <Text style={styles.forgotPassText}>Şifremi Unuttum?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: Colors.accentOrange }]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Giriş Yap</Text>}
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>
            Hesabın yok mu?{' '}
            <Text style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
              Hesap Oluştur
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
  logoContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  logoIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 28, color: Colors.textDark, marginLeft: 12, fontFamily: 'Inter-28pt-Bold' },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, color: Colors.textDark, fontFamily: 'Inter-28pt-Bold' },
  subtitle: { fontSize: 16, color: Colors.textDisabled, marginTop: 8, fontFamily: 'Inter-18pt-Regular' },
  form: { width: '100%' },
  label: { color: Colors.textDark, fontSize: 16, marginBottom: 8, fontFamily: 'Inter-18pt-Medium' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundInputDark, borderRadius: 8, height: 56, marginBottom: 16 },
  inputIcon: { marginLeft: 16 },
  input: { flex: 1, paddingHorizontal: 12, color: Colors.textDark, fontSize: 16, fontFamily: 'Inter-18pt-Regular' },
  eyeIcon: { padding: 12 },
  forgotPassContainer: { alignSelf: 'flex-end', marginVertical: 8 },
  forgotPassText: { color: Colors.accentBlue, fontSize: 14, fontFamily: 'Inter-18pt-Medium' },
  button: { height: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonText: { color: 'white', fontSize: 18, fontFamily: 'Inter-18pt-Bold' },
  registerContainer: { marginTop: 40, alignItems: 'center' },
  registerText: { color: Colors.textDisabled, fontSize: 14, fontFamily: 'Inter-18pt-Regular' },
  registerLink: { color: Colors.accentBlue, fontFamily: 'Inter-18pt-Bold' },
});

export default LoginScreen;