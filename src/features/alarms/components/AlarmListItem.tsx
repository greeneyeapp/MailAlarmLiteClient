import { MaterialIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../core/constants/Colors';
import { trackEvent } from '../../../core/services/amplitude';
import { useAuth } from '../../auth/context/AuthContext';

const AlarmListItem = ({ alarm }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEnabled, setIsEnabled] = useState(alarm.enabled);
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const getPriorityColor = () => {
    if (alarm.priority === 'high') return Colors.accentRed;
    if (alarm.priority === 'medium') return Colors.accentYellow;
    return Colors.accentGreen;
  };

  const priorityColor = getPriorityColor();

  const onToggleSwitch = async () => {
    if (!user) return;
    const newEnabledState = !isEnabled;
    setIsEnabled(newEnabledState);
    try {
      await firestore()
        .collection('users')
        .doc(user.id)
        .collection('mailAlarms')
        .doc(alarm.id)
        .update({ enabled: newEnabledState });
    } catch (error) {
      console.error("Alarm durumu güncellenemedi:", error);
      setIsEnabled(!newEnabledState);
    }
  };

  const handleDelete = () => {
    if (!user) return;

    Alert.alert(
      "Alarmı Sil",
      "Bu alarmı kalıcı olarak silmek istediğinizden emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive", 
          onPress: async () => {
            try {
              await firestore()
                .collection('users')
                .doc(user.id)
                .collection('mailAlarms')
                .doc(alarm.id)
                .delete();
              trackEvent('Mail Alarm Deleted');
            } catch (error) {
              Alert.alert("Hata", "Alarm silinirken bir sorun oluştu.");
            }
          }
        }
      ]
    );
  };
  
  const handleEdit = () => {
    trackEvent('Mail Alarm Edit Started');
    navigation.navigate('AddMailAlarm', { alarmToEdit: alarm });
  };

  const handleSoundChange = () => {
    trackEvent('Sound Picker Opened', { source: 'Alarm List Item' });
    Alert.alert("Özellik Hazırlanıyor", "Alarm sesi değiştirme özelliği yakında eklenecektir.");
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.mainContent}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />
        <View style={styles.iconContainer}>
          <MaterialIcons name={alarm.icon || 'mail'} size={30} color="white" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{alarm.title || alarm.subject || `Gönderen: ${alarm.sender}`}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{alarm.time || alarm.subject || `Gönderen: ${alarm.sender}`}</Text>
        </View>
        <Switch
          trackColor={{ false: Colors.backgroundCardItem, true: Colors.primary }}
          thumbColor={'white'}
          ios_backgroundColor={Colors.backgroundCardItem}
          onValueChange={onToggleSwitch}
          value={isEnabled}
          style={styles.switch}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <MaterialIcons name="edit" size={20} color={Colors.textSecondaryDark} />
              <Text style={styles.actionText}>Düzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <MaterialIcons name="delete" size={20} color={Colors.textSecondaryDark} />
              <Text style={styles.actionText}>Sil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleSoundChange}>
              <MaterialIcons name="music-note" size={20} color={Colors.textSecondaryDark} />
              <Text style={styles.actionText}>Sesi Değiştir</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  priorityBar: {
    width: 6,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.backgroundCardItem,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-18pt-Medium',
  },
  subtitle: {
    color: Colors.textSecondaryDark,
    fontSize: 14,
    marginTop: 2,
    fontFamily: 'Inter-18pt-Regular',
  },
  switch: {
    marginLeft: 8,
    transform: Platform.OS === 'ios' ? [] : [{ scale: 1.2 }],
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundCardItem,
    padding: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: Colors.textSecondaryDark,
    fontSize: 12,
    fontFamily: 'Inter-18pt-Regular',
  },
});

export default AlarmListItem;