import React from 'react';
import { View, StyleSheet, SafeAreaView, ViewProps, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ScreenBackground({ children, style }: ViewProps) {
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: '#0A1E28' }, style]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.bgLayer} pointerEvents="none">
        <LinearGradient
          colors={['#0A1E28', '#102F40', '#0D2636']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
