import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

const BUBBLE_DEFS = [
  { w: 420, h: 420, r: 210, top: -160,     right: -60   },
  { w: 320, h: 320, r: 160, bottom: -120,  left: -70    },
  { w: 180, h: 180, r: 90,  top: '40%',    right: -50   },
  { w: 130, h: 130, r: 65,  top: '12%',    left: -30    },
  { w: 80,  h: 80,  r: 40,  top: '25%',    right: 20    },
  { w: 100, h: 100, r: 50,  bottom: '15%', left: '40%'  },
];

const DRIFT_CONFIGS = [
  { toX: 40,  toY: -35, delay: 0,     dur: 25000 },
  { toX: -30, toY: 25,  delay: 7000,  dur: 25000 },
  { toX: 20,  toY: 30,  delay: 3000,  dur: 20000 },
  { toX: -25, toY: -20, delay: 11000, dur: 22000 },
  { toX: 15,  toY: -28, delay: 5000,  dur: 18000 },
  { toX: -18, toY: 22,  delay: 9000,  dur: 23000 },
];

export default function BubbleBackground({ children }) {
  const bx = DRIFT_CONFIGS.map(() => useRef(new Animated.Value(0)).current);
  const by = DRIFT_CONFIGS.map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    DRIFT_CONFIGS.forEach(({ toX, toY, delay, dur }, i) => {
      const seg = dur / 3;
      const anim = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(bx[i], { toValue: toX,          duration: seg, useNativeDriver: true }),
            Animated.timing(by[i], { toValue: toY,          duration: seg, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(bx[i], { toValue: -toX * 0.75, duration: seg, useNativeDriver: true }),
            Animated.timing(by[i], { toValue: toY * 0.6,   duration: seg, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(bx[i], { toValue: 0, duration: seg, useNativeDriver: true }),
            Animated.timing(by[i], { toValue: 0, duration: seg, useNativeDriver: true }),
          ]),
        ])
      );
      const timer = setTimeout(() => anim.start(), delay);
      return () => clearTimeout(timer);
    });
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {BUBBLE_DEFS.map((b, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bubble,
            {
              width: b.w, height: b.h, borderRadius: b.r,
              top: b.top, bottom: b.bottom,
              left: b.left, right: b.right,
              transform: [{ translateX: bx[i] }, { translateY: by[i] }],
            },
          ]}
        />
      ))}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bubble: {
    position: 'absolute',
    backgroundColor: Colors.bubbleFill,
    borderWidth: 1.5,
    borderColor: Colors.bubbleBorder,
    shadowColor: '#fff',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
  },
});