import { MaterialIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../core/constants/Colors';
import { trackEvent } from '../../../core/services/amplitude';
import { useAuth } from '../../auth/context/AuthContext';
import { setNativeAlarm } from '../services/AlarmManager.android';
import { scheduleIOSNotification } from '../services/NotificationManager.ios';

type Priority = 'low' | 'medium' | 'high';
type Days = { [key: string]: boolean };

const weekDays = [
  { key: 'mon', label: 'Pzt' },
  { key: 'tue', label: 'Sal' },
  { key: 'wed', label: 'Çar' },
  { key: 'thu', label: 'Per' },
  { key: 'fri', label: 'Cum' },
  { key: 'sat', label: 'Cmt' },
  { key: 'sun', label: 'Paz' },
];

const AddNormalAlarmScreen = () => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [selectedDays, setSelectedDays] = useState<Days>({});
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  const toggleDay = (dayKey: string) => {
    setSelectedDays(prev => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };

  const handleCreateAlarm = async () => {
    if (!user) {
      Alert.alert("Hata", "Normal alarm kurmak için giriş yapmalısınız.", [
        { text: "Vazgeç" },
        { text: "Giriş Yap", onPress: () => navigation.navigate('AuthStack') }
      ]);
      return;
    }
    
    setLoading(true);
    const alarmTime = new Date();
    alarmTime.setHours(7, 30, 0); 
    const timestamp = alarmTime.getTime();

    const alarmData = {
      title: title || "Normal Alarm",
      time: "07:30",
      type: 'normal',
      icon: 'alarm',
      priority: priority,
      days: selectedDays,
      enabled: true,
      ownerId: user.id,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    try {
      await firestore()
        .collection('users')
        .doc(user.id)
        .collection('mailAlarms')
        .add(alarmData);

      if (Platform.OS === 'android') {
        await setNativeAlarm(alarmData.title, timestamp, alarmData.title, 'Normal Alarm');
      } else {
        await scheduleIOSNotification(alarmData.title, alarmData.title, 'Normal Alarm', timestamp, priority === 'high');
      }
      
      trackEvent('Normal Alarm Created', { priority });
      Alert.alert("Başarılı", "Normal alarm kuruldu.");
      navigation.goBack();

    } catch (error) {
      console.error("Alarm kurulamadı:", error);
      Alert.alert("Hata", "Alarm kurulurken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectSound = () => {
    trackEvent('Sound Picker Opened', { source: 'Normal Alarm' });
    Alert.alert("Özellik Hazırlanıyor", "Alarm sesi değiştirme özelliği yakında eklenecektir.");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Yeni Normal Alarm</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={Colors.textDisabled} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          <TextInput
            style={styles.input}
            placeholder="Alarm Başlığı (İsteğe Bağlı)"
            placeholderTextColor={Colors.textDisabled}
            value={title}
            onChangeText={setTitle}
          />
          
          <Text style={styles.sectionTitle}>Alarm Zamanı</Text>
          <TouchableOpacity style={styles.soundButton}>
            <Text style={styles.soundText}>07:30</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={Colors.textDisabled} />
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Tekrarla</Text>
          <View style={styles.weekContainer}>
            {weekDays.map(day => {
              const isActive = selectedDays[day.key];
              return (
                <TouchableOpacity 
                  key={day.key} 
                  style={[styles.dayButton, isActive && styles.dayButtonActive]}
                  onPress={() => toggleDay(day.key)}
                >
                  <Text style={[styles.dayText, isActive && styles.dayTextActive]}>{day.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Alarm Aciliyeti</Text>
          <View style={styles.priorityContainer}>
            <PriorityButton 
              label="Düşük" 
              icon="arrow-downward" 
              value="low" 
              priority={priority} 
              setPriority={setPriority} 
              color={Colors.accentGreen} 
              activeBg={Colors.accentGreenMuted} 
            />
            <PriorityButton 
              label="Orta" 
              icon="horizontal-rule" 
              value="medium" 
              priority={priority} 
              setPriority={setPriority} 
              color={Colors.accentYellow} 
              activeBg={Colors.accentYellowMuted} 
            />
            <PriorityButton 
              label="Yüksek" 
              icon="arrow-upward" 
              value="high" 
              priority={priority} 
              setPriority={setPriority} 
              color={Colors.accentRed} 
              activeBg={Colors.accentRedMuted} 
            />
          </View>

          <Text style={styles.sectionTitle}>Alarm Sesi</Text>
          <TouchableOpacity style={styles.soundButton} onPress={handleSelectSound}>
            <Text style={styles.soundText}>Yükseliş (Varsayılan)</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={Colors.textDisabled} />
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateAlarm} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.createButtonText}>Alarmı Oluştur</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const PriorityButton = ({ label, icon, value, priority, setPriority, color, activeBg }) => {
  const isActive = priority === value;
  return (
    <TouchableOpacity 
      style={[styles.priorityButton, isActive && { borderColor: color, backgroundColor: activeBg }]}
      onPress={() => setPriority(value)}>
      <MaterialIcons name={icon} size={20} color={isActive ? color : Colors.textDisabled} />
      <Text style={[styles.priorityText, isActive && { color: color }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
  },
  modalContainer: {
    flex: 1,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundCardItem,
  },
  headerTitle: { flex: 1, color: 'white', fontSize: 18, textAlign: 'center', fontFamily: 'Inter-18pt-Bold' },
  closeButton: { padding: 4 }, 
  content: { padding: 16, flex: 1 },
  input: {
    backgroundColor: Colors.backgroundCardItem,
    color: 'white',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    fontFamily: 'Inter-18pt-Regular',
  },
  sectionTitle: { color: 'white', fontSize: 16, marginTop: 16, marginBottom: 8, fontFamily: 'Inter-18pt-Bold' },
  priorityContainer: { flexDirection: 'row', gap: 12 },
  priorityButton: {
    flex: 1,
    height: 56,
    backgroundColor: Colors.backgroundCardItem,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  priorityText: { color: Colors.textDisabled, fontSize: 14, marginTop: 2, fontFamily: 'Inter-18pt-Regular' },
  prioLowActive: { borderColor: Colors.accentGreen, backgroundColor: Colors.accentGreenMuted },
  prioMediumActive: { borderColor: Colors.accentYellow, backgroundColor: Colors.accentYellowMuted },
  prioHighActive: { borderColor: Colors.accentRed, backgroundColor: Colors.accentRedMuted },
  soundButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCardItem,
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  soundText: { color: 'white', fontSize: 16, fontFamily: 'Inter-18pt-Regular' },
  footer: { padding: 16, borderTopWidth: 1, borderColor: Colors.backgroundCardItem },
  createButton: { backgroundColor: Colors.accentBlue, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  createButtonText: { color: 'white', fontSize: 16, fontFamily: 'Inter-18pt-Bold' },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCardItem,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-18pt-Medium',
  },
  dayTextActive: {
    color: 'white',
  },
});

export default AddNormalAlarmScreen;