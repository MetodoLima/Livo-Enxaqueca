import React from 'react';
import { View, StyleSheet, SafeAreaView, ViewProps, StatusBar, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function ScreenBackground({ children, style }: ViewProps) {
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: '#0A1E28' }, style]}>
      <StatusBar barStyle="light-content" />

      {/* ── Background Layer: Frosted Gradient + Light Orbs ── */}
      <View style={styles.bgLayer} pointerEvents="none">
        {/* Base gradient overlay */}
        <LinearGradient
          colors={['#0A1E28', '#102F40', '#0D2636']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Orbs and Blur (iOS Only) */}
        {Platform.OS === 'ios' && (
          <>
            <View style={[styles.orb, styles.orbLight]} />
            <View style={[styles.orb, styles.orbAccent]} />
            <View style={[styles.orb, styles.orbDark]} />
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />
          </>
        )}
      </View>

      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* ── Background ── */
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: '#0A1E28',
  },
  bgGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: '#0D2636',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orbLight: {
    width: 300,
    height: 300,
    top: -40,
    right: -60,
    backgroundColor: '#FFFFFF',
    opacity: 0.05,
  },
  orbAccent: {
    width: 350,
    height: 350,
    top: 300,
    left: -100,
    backgroundColor: '#25B7BB',
    opacity: 0.12,
  },
  orbDark: {
    width: 320,
    height: 320,
    bottom: 60,
    right: -80,
    backgroundColor: '#0A1E28',
    opacity: 0.20,
  },
});
