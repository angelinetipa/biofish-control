import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

export default function SplashScreen({ onDone }) {
  const logoScale   = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textSlide   = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const screenFade  = useRef(new Animated.Value(1)).current;
  const [fading, setFading] = useState(false);

  useEffect(() => {
    Animated.sequence([
      // 1) Logo springs in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1, friction: 7, tension: 70, useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1, duration: 400, useNativeDriver: true,
        }),
      ]),
      // 2) Text fades + slides up
      Animated.parallel([
        Animated.timing(textSlide, {
          toValue: 0, duration: 300, useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }),
      ]),
      // 3) Hold
      Animated.delay(750),
      // 4) Fade out
      Animated.timing(screenFade, {
        toValue: 0, duration: 400, useNativeDriver: true,
      }),
    ]).start(() => onDone());

    // Disable pointer events as soon as fade-out starts (after ~1.5s)
    const t = setTimeout(() => setFading(true), 1450);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View
      pointerEvents={fading ? 'none' : 'auto'}
      style={[styles.root, { opacity: screenFade }]}
    >
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.Image
        source={require('../../assets/BIOFISH_LOGO.png')}
        style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
        resizeMode="contain"
      />

      <Animated.View style={[styles.textBlock, { opacity: textOpacity, transform: [{ translateY: textSlide }] }]}>
        <Text style={styles.title}>BIO-FISH</Text>
        <Text style={styles.sub}>Bioplastic Sheet Production{'\n'}from Fish Scales</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 999,
  },
  logo: {
    width: 120, height: 120, borderRadius: 30,
    marginBottom: 28,

  },
  textBlock: { alignItems: 'center' },
  title: {
    color: '#fff', fontSize: 34, fontWeight: '900',
    letterSpacing: 2.5, textAlign: 'center', marginBottom: 10,
  },
  sub: {
    color: 'rgba(255,255,255,0.75)', fontSize: 13,
    textAlign: 'center', lineHeight: 20, letterSpacing: 0.3,
  },
});