import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { Colors } from '../constants/Colors';

import AlarmListScreen from '../../features/alarms/screens/AlarmListScreen';
import MailAccountsScreen from '../../features/mail-accounts/screens/MailAccountsScreen';
import SettingsScreen from '../../features/settings/screens/SettingsScreen';

import AddNormalAlarmScreen from '../../features/alarms/screens/AddNormalAlarmScreen';
import AndroidAlarmScreen from '../../features/alarms/screens/AndroidAlarmScreen';
import AddMailAlarmModal from '../../features/mail-accounts/components/AddMailAlarmModal';
import AddAlarmChoiceModal from './AddAlarmChoiceModal';
import AuthStack from './AuthStack';

const Tab = createBottomTabNavigator();
const MainStack = createStackNavigator();

const HomeTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textSecondaryDark,
      tabBarStyle: { 
        backgroundColor: Colors.backgroundDark, 
        borderTopColor: '#222', 
        paddingTop: 4 
      },
      tabBarIcon: ({ color, size }) => {
        let iconName: keyof typeof MaterialIcons.glyphMap = 'settings';
        if (route.name === 'Alarmlar') iconName = 'alarm';
        else if (route.name === 'Mail Hesapları') iconName = 'mail';
        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
    })}>
    <Tab.Screen name="Alarmlar" component={AlarmListScreen} />
    <Tab.Screen name="Mail Hesapları" component={MailAccountsScreen} />
    <Tab.Screen name="Ayarlar" component={SettingsScreen} />
  </Tab.Navigator>
);

const MainStackNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Group>
      <MainStack.Screen name="HomeTabs" component={HomeTabs} />
    </MainStack.Group>
    
    <MainStack.Group screenOptions={{ presentation: 'modal' }}>
      <MainStack.Screen name="AuthStack" component={AuthStack} />
      <MainStack.Screen name="AddMailAlarm" component={AddMailAlarmModal} />
      <MainStack.Screen name="AddNormalAlarm" component={AddNormalAlarmScreen} />
    </MainStack.Group>
    
    <MainStack.Group screenOptions={{ presentation: 'transparentModal' }}>
       <MainStack.Screen name="AndroidAlarmScreen" component={AndroidAlarmScreen} />
       <MainStack.Screen name="AddAlarmChoice" component={AddAlarmChoiceModal} />
    </MainStack.Group>
  </MainStack.Navigator>
);

export default MainStackNavigator;