import { MaterialIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../core/constants/Colors';
import { trackEvent } from '../../../core/services/amplitude';
import { useAuth } from '../../auth/context/AuthContext';

type Priority = 'low' | 'medium' | 'high';

const AddMailAlarmModal = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const alarmToEdit = route.params?.alarmToEdit;
  
  const [priority, setPriority] = useState<Priority>(alarmToEdit?.priority || 'medium');
  const [sender, setSender] = useState(alarmToEdit?.sender || '');
  const [subject, setSubject] = useState(alarmToEdit?.subject || '');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  const isEditing = !!alarmToEdit;

  const handleSaveAlarm = async () => {
    if (!user) {
      navigation.goBack();
      return;
    }
    if (!sender && !subject) {
      Alert.alert('Hata', 'En az bir kriter (Gönderici veya Başlık) girmelisiniz.');
      return;
    }
    
    setLoading(true);
    
    const alarmData = {
      sender: sender || null,
      subject: subject || null,
      priority: priority,
      mailAccountId: alarmToEdit?.mailAccountId || null,
      enabled: alarmToEdit?.enabled ?? true,
      ownerId: user.id,
      createdAt: alarmToEdit?.createdAt || firestore.FieldValue.serverTimestamp(),
    };
    
    try {
      const alarmRef = firestore()
        .collection('users')
        .doc(user.id)
        .collection('mailAlarms');
        
      if (isEditing) {
        await alarmRef.doc(alarmToEdit.id).set(alarmData);
        trackEvent('Mail Alarm Updated', { priority });
      } else {
        await alarmRef.add(alarmData);
        trackEvent('Mail Alarm Created', { priority });
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Alarm kaydedilirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.sheetHandle} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isEditing ? 'Alarmı Düzenle' : 'Yeni Mail Alarmı Oluştur'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={Colors.textDisabled} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Gönderici Adresi (İsteğe Bağlı)"
          placeholderTextColor={Colors.textDisabled}
          value={sender}
          onChangeText={setSender}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Mail Başlığı (İsteğe Bağlı)"
          placeholderTextColor={Colors.textDisabled}
          value={subject}
          onChangeText={setSubject}
        />

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
        <TouchableOpacity style={styles.soundButton}>
          <Text style={styles.soundText}>Yükseliş (Varsayılan)</Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={Colors.textDisabled} />
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.createButton} onPress={handleSaveAlarm} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.createButtonText}>{isEditing ? 'Değişiklikleri Kaydet' : 'Alarmı Oluştur'}</Text>}
        </TouchableOpacity>
      </View>
    </View>
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
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#4a4a4f', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  headerTitle: { flex: 1, color: 'white', fontSize: 18, textAlign: 'center', fontFamily: 'Inter-18pt-Bold' },
  closeButton: { position: 'absolute', right: 16, top: 16 },
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
});

export default AddMailAlarmModal;