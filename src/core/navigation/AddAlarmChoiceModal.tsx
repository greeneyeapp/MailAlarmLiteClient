import { MaterialIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../features/auth/context/AuthContext';
import { Colors } from '../constants/Colors';
import { trackEvent } from '../services/amplitude';

const AddAlarmChoiceModal = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  
  const onAddMailAlarm = async () => {
    if (!user) {
      trackEvent('Mail Alarm Add Attempt', { isGuest: true });
      navigation.goBack(); 
      navigation.navigate('AuthStack');
      return;
    }

    const alarmCollection = firestore().collection('users').doc(user.id).collection('mailAlarms');
    const snapshot = await alarmCollection.limit(1).get();

    if (!snapshot.empty) {
      trackEvent('Pro Upsell Viewed', { trigger: 'Mail Alarm Limit' });
      navigation.goBack();
      Alert.alert(
        'Limit Aşıldı',
        'Mail Alarm Lite ile sadece 1 adet mail alarmı oluşturabilirsiniz. Sınırsız alarm için lütfen Mail Alarm Pro\'ya geçin.',
        [{ text: 'Tamam' }]
      );
      return;
    }
    
    trackEvent('Mail Alarm Add Started');
    navigation.goBack(); 
    navigation.navigate('AddMailAlarm');
  };

  const onAddNormalAlarm = () => {
    trackEvent('Normal Alarm Add Started');
    navigation.goBack(); 
    navigation.navigate('AddNormalAlarm');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.sheetHandle} />
        <Text style={styles.title}>Yeni Alarm Ekle</Text>
        
        <TouchableOpacity style={styles.button} onPress={onAddNormalAlarm}>
          <MaterialIcons name="add-alarm" size={24} color={Colors.accentGreen} />
          <Text style={styles.buttonText}>Normal Alarm</Text>
          <MaterialIcons name="chevron-right" size={24} color={Colors.textDisabled} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={onAddMailAlarm}>
          <MaterialIcons name="mail" size={24} color={Colors.primary} />
          <Text style={styles.buttonText}>Mail Alarmı</Text>
          <MaterialIcons name="chevron-right" size={24} color={Colors.textDisabled} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Vazgeç</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  container: {
    backgroundColor: Colors.backgroundCard,
    padding: 16,
    paddingBottom: 32,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  sheetHandle: { 
    width: 36, 
    height: 4, 
    backgroundColor: '#4a4a4f', 
    borderRadius: 2, 
    alignSelf: 'center', 
    marginBottom: 16 
  },
  title: {
    fontFamily: 'Inter-18pt-Bold',
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCardItem,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    flex: 1,
    fontFamily: 'Inter-18pt-Medium',
    fontSize: 16,
    color: 'white',
    marginLeft: 16,
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontFamily: 'Inter-18pt-Bold',
    fontSize: 16,
    color: Colors.accentBlue,
  },
});

export default AddAlarmChoiceModal;