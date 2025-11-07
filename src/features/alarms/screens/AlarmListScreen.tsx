import { MaterialIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../core/constants/Colors';
import { useAuth } from '../../auth/context/AuthContext';
import AlarmListItem from '../components/AlarmListItem';

const AlarmListScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [alarms, setAlarms] = useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        const subscriber = firestore()
          .collection('users')
          .doc(user.id)
          .collection('mailAlarms')
          .onSnapshot(querySnapshot => {
            const alarmsList: any[] = [];
            querySnapshot.forEach(doc => {
              alarmsList.push({ id: doc.id, ...doc.data() });
            });
            setAlarms(alarmsList);
          });

        return () => subscriber();
      } else {
        setAlarms([]);
      }
    }, [user])
  );
  
  const activeAlarms = alarms.filter(a => a.enabled !== false);
  const passiveAlarms = alarms.filter(a => a.enabled === false);

  const openAddAlarmModal = () => {
    navigation.navigate('AddAlarmChoice');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Mail Alarm Lite</Text>
              <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color={Colors.textSecondaryDark} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Alarmlarda ara..."
                  placeholderTextColor={Colors.textSecondaryDark}
                />
              </View>
            </View>
            <Text style={styles.sectionTitle}>Aktif Alarmlar</Text>
          </>
        }
        data={activeAlarms}
        renderItem={({ item }) => <AlarmListItem alarm={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={
          <>
            <Text style={styles.sectionTitle}>Pasif Alarmlar</Text>
            {passiveAlarms.map(alarm => (
              <AlarmListItem key={alarm.id} alarm={alarm} />
            ))}
            <View style={{ height: 180 }} />
          </>
        }
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={openAddAlarmModal}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundDark },
  listContainer: { paddingHorizontal: 16, gap: 12 },
  header: { padding: 16, paddingTop: 20, backgroundColor: Colors.backgroundDark },
  headerTitle: { fontSize: 24, color: 'white', marginBottom: 16, fontFamily: 'Inter-24pt-Bold' },
  searchContainer: { position: 'relative' },
  searchIcon: { position: 'absolute', left: 12, top: 13, zIndex: 1 },
  searchInput: {
    backgroundColor: Colors.backgroundInputDark,
    height: 48,
    borderRadius: 24,
    paddingLeft: 40,
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-18pt-Regular',
  },
  sectionTitle: { fontSize: 18, color: 'white', marginLeft: 16, marginTop: 16, marginBottom: 8, fontFamily: 'Inter-18pt-Bold' },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 10,
  },
});

export default AlarmListScreen;