import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../core/constants/Colors';
import { useAuth } from '../context/AuthContext';

const OnboardingScreen = () => {
  const { completeOnboarding } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0A192F', Colors.backgroundDark]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="show-chart" size={60} color={Colors.accentOrange} />
          </View>
          <Text style={styles.title}>Mail Alarm Lite'a Hoş Geldiniz</Text>
          <Text style={styles.subtitle}>
            Artık hiçbir önemli e-postayı kaçırmayın.
            Kritik mailleriniz için anında, sesli alarmlar kurun.
          </Text>
        </View>
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: Colors.primary }]} 
            onPress={completeOnboarding}
          >
            <Text style={styles.buttonText}>Başlayalım</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundDark },
  gradient: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  footer: { padding: 20, paddingBottom: 40 },
  logoContainer: {
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: Colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: Colors.accentOrange,
  },
  title: { fontSize: 28, color: 'white', textAlign: 'center', marginBottom: 16, fontFamily: 'Inter-28pt-Bold' },
  subtitle: { fontSize: 16, color: Colors.textSecondaryDark, textAlign: 'center', lineHeight: 24, fontFamily: 'Inter-18pt-Regular' },
  button: { height: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: 'white', fontSize: 18, fontFamily: 'Inter-18pt-Bold' },
});

export default OnboardingScreen;