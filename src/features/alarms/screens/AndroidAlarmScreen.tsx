import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../core/constants/Colors';

const AndroidAlarmScreen = ({ route }) => {
  const navigation = useNavigation();
  const { alarmTitle = "Proje Teslim Toplantısı", alarmSubtitle = "Gönderen: Ahmet Yılmaz" } = route.params || {};

  const handleSnooze = () => {
    console.log('Alarm ertelendi.');
    navigation.goBack();
  };
  
  const handleStop = () => {
    console.log('Alarm durduruldu.');
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={['rgba(10, 22, 34, 0.8)', 'rgba(31, 41, 55, 0.8)']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.headerText}>Alarm!</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{alarmTitle}</Text>
          <Text style={styles.subtitle}>{alarmSubtitle}</Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSnooze}>
          <MaterialIcons name="snooze" size={24} color="white" />
          <Text style={styles.buttonText}>Ertele</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: Colors.primary }]} onPress={handleStop}>
          <MaterialIcons name="alarm-off" size={24} color="white" />
          <Text style={styles.buttonText}>Durdur</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', alignItems: 'center' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: '20%' },
  headerText: { fontSize: 28, color: Colors.accentOrange, marginBottom: 60, fontFamily: 'Inter-28pt-Bold' },
  infoContainer: { alignItems: 'center', marginVertical: 40 },
  title: { fontSize: 24, color: 'white', textAlign: 'center', fontFamily: 'Inter-24pt-Bold' },
  subtitle: { fontSize: 16, color: Colors.textDark, marginTop: 8, fontFamily: 'Inter-18pt-Regular' },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.backgroundCardItem,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: { color: 'white', fontSize: 16, fontFamily: 'Inter-18pt-Bold' },
});

export default AndroidAlarmScreen;