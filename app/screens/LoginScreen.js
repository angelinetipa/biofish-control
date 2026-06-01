import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BubbleBackground from '../components/BubbleBackground';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';

// Single shared access PIN. Set EXPO_PUBLIC_ACCESS_PIN in your env (.env / Vercel).
// Falls back to '2026' if the env var is missing.
const ACCESS_PIN = process.env.EXPO_PUBLIC_ACCESS_PIN || '2026';

export default function LoginScreen({ onLogin }) {
  const [pin, setPin]           = useState('');
  const [focused, setFocused]   = useState(false);
  const [showPin, setShowPin]   = useState(false);
  const [error, setError]       = useState('');

  const handleUnlock = () => {
    if (pin === ACCESS_PIN) {
      onLogin({ ok: true });
    } else {
      setError('Incorrect PIN. Try again.');
      setPin('');
    }
  };

  return (
    <BubbleBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="always">
          <View style={styles.card}>

            {/* Accent line */}
            <LinearGradient
              colors={['transparent', Colors.teal, Colors.blue, Colors.teal, 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.accentLine}
            />

            {/* Logo */}
            <View style={styles.logoSection}>
              <View style={styles.logoGlow}>
                <Image source={require('../../assets/BIOFISH_LOGO.png')} style={styles.logo} />
              </View>
              <Text style={styles.appName}>BIO-FISH</Text>
              <Text style={styles.appDesc}>Bioplastic Sheet Production from Fish Scales</Text>
            </View>

            {/* Access PIN */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>ACCESS PIN</Text>
              <View style={styles.passWrap}>
                <TextInput
                  style={[styles.input, styles.inputPass, focused && styles.inputFocused]}
                  placeholder="Enter access PIN"
                  placeholderTextColor={Colors.textLight}
                  value={pin}
                  onChangeText={t => { setPin(t); setError(''); }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  secureTextEntry={!showPin}
                  keyboardType="number-pad"
                  returnKeyType="go"
                  onSubmitEditing={handleUnlock}
                  maxLength={12}
                />
                <TouchableOpacity
                  onPress={() => setShowPin(v => !v)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.eyeBtn}
                >
                  <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMid} />
                </TouchableOpacity>
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Unlock */}
            <TouchableOpacity onPress={handleUnlock} activeOpacity={0.85} style={styles.btnWrap}>
              <LinearGradient
                colors={[Colors.teal, Colors.blue]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.btn}
              >
                <Ionicons name="lock-open-outline" size={16} color={Colors.white} />
                <Text style={styles.btnText}>UNLOCK</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Note */}
            <View style={styles.noteCard}>
              <Ionicons name="information-circle-outline" size={13} color={Colors.blue} />
              <Text style={styles.noteText}>
                The PIN limits machine control to authorized operators.
              </Text>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BubbleBackground>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16, paddingVertical: 48 },

  card: {
    ...Theme.card,
    width: '100%', maxWidth: 360,
    paddingTop: 36, paddingBottom: 28, overflow: 'hidden',
  },

  accentLine: {
    position: 'absolute', top: 0, left: '5%', right: '5%',
    height: 3, borderRadius: 99, opacity: 0.75,
  },

  logoSection: { alignItems: 'center', marginBottom: 20, paddingHorizontal: 32 },
  logoGlow: {
    borderRadius: 36, marginBottom: 12,
    shadowColor: '#2C6B7F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45, shadowRadius: 18, elevation: 8,
  },
  logo:    { width: 72, height: 72, borderRadius: 36 },
  appName: { fontSize: 20, fontWeight: '900', color: Colors.dark, marginBottom: 4, letterSpacing: 0.5 },
  appDesc: { fontSize: 11, color: Colors.textMid, textAlign: 'center', letterSpacing: 0.3 },

  formGroup: { marginBottom: 14, paddingHorizontal: 32 },
  label: { fontSize: 11, fontWeight: '800', color: Colors.textDark, letterSpacing: 0.8, marginBottom: 7 },
  input: {
    backgroundColor: Colors.inputBg, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 13, color: Colors.textDark,
    borderWidth: 2, borderColor: 'transparent',
  },
  passWrap: { position: 'relative', justifyContent: 'center' },
  inputPass: { paddingRight: 44, letterSpacing: 3 },
  eyeBtn: {
    position: 'absolute', right: 8, top: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
  },
  inputFocused: {
    borderColor: Colors.inputFocusBorder, backgroundColor: Colors.inputFocusBg,
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35, shadowRadius: 8,
  },

  error: { color: Colors.statusStop, fontSize: 12, marginBottom: 8, paddingHorizontal: 32 },

  btnWrap: {
    marginHorizontal: 32, marginTop: 8, borderRadius: 14,
    shadowColor: '#fff', shadowOffset: { width: -5, height: -5 },
    shadowOpacity: 0.55, shadowRadius: 12, elevation: 10,
  },
  btn: {
    flexDirection: 'row', gap: 8, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  btnText: { color: Colors.white, fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },

  noteCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 32, marginTop: 20, padding: 12,
    backgroundColor: Colors.demoBg, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)',
  },
  noteText: { flex: 1, fontSize: 11, color: Colors.textMid, lineHeight: 16 },
});