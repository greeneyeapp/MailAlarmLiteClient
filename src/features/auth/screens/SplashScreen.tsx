import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../core/constants/Colors';

const SplashScreenComponent = () => {
  return (
    <LinearGradient
      colors={['#0A192F', '#1E2A47']}
      style={styles.container}
    >
      <MaterialIcons name="show-chart" size={60} color={Colors.accentOrange} />
      <Text style={styles.logoText}>Mail Alarm Lite</Text>
      <Text style={styles.subtitle}>E-postanın Ritmi</Text>
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accentOrange} />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    color: 'white',
    marginTop: 12,
    fontFamily: 'Inter-28pt-Bold',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    fontFamily: 'Inter-18pt-Regular',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
  },
});

export default SplashScreenComponent;