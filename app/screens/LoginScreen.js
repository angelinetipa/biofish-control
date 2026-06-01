import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BubbleBackground from '../components/BubbleBackground';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';
import { supabase } from '../lib/supabase';

const FALLBACK_PIN = process.env.EXPO_PUBLIC_ACCESS_PIN || '2026';

export default function LoginScreen({ onLogin }) {
  const [pin, setPin]         = useState('');
  const [focused, setFocused] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError]     = useState('');
  const [accessPin, setAccessPin] = useState(null); // null = still loading

  // Fetch PIN from Supabase on mount; fall back to env var if unavailable
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('machine_settings').select('access_pin').eq('id', 1).single();
        if (active) setAccessPin(data?.access_pin || FALLBACK_PIN);
      } catch {
        if (active) setAccessPin(FALLBACK_PIN);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleUnlock = () => {
    if (!accessPin) return;
    if (pin === accessPin) {
      onLogin({ ok: true });
    } else {
      setError('Incorrect PIN. Try again.');
      setPin('');
    }
  };

  const loading = accessPin === null;

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
                  placeholder={loading ? 'Loading…' : 'Enter access PIN'}
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
                  editable={!loading}
                />
                {loading
                  ? <ActivityIndicator size="small" color={Colors.textMid} style={styles.eyeBtn} />
                  : (
                    <TouchableOpacity
                      onPress={() => setShowPin(v => !v)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={styles.eyeBtn}
                    >
                      <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMid} />
                    </TouchableOpacity>
                  )
                }
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Unlock */}
            <TouchableOpacity onPress={handleUnlock} activeOpacity={0.85} style={styles.btnWrap} disabled={loading}>
              <LinearGradient
                colors={[Colors.teal, Colors.blue]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.btn, loading && { opacity: 0.5 }]}
              >
                <Ionicons name="lock-open-outline" size={16} color={Colors.white} />
                <Text style={styles.btnText}>UNLOCK</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.noteInline}>PIN required to access machine controls.</Text>

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

  logoSection: { alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 },
  logoGlow: {
    borderRadius: 20, marginBottom: 12,
    shadowColor: '#5DD9D2', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 18, elevation: 10,
  },
  logo:    { width: 72, height: 72, borderRadius: 16 },
  appName: { fontSize: 28, fontWeight: '900', color: Colors.dark, marginBottom: 4, letterSpacing: 1 },
  appDesc: { fontSize: 12, color: Colors.textMid, textAlign: 'center', letterSpacing: 0.3 },

  formGroup: { marginBottom: 14, paddingHorizontal: 20 },
  label: { fontSize: 11, fontWeight: '800', color: Colors.textDark, letterSpacing: 0.8, marginBottom: 7 },
  input: {
    backgroundColor: Colors.inputBg, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 13, color: Colors.textDark,
    borderWidth: 2, borderColor: 'transparent',
  },
  passWrap:     { position: 'relative', justifyContent: 'center' },
  inputPass:    { paddingRight: 44, letterSpacing: 3 },
  eyeBtn: {
    position: 'absolute', right: 8, top: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
  },
  inputFocused: {
    borderColor: Colors.inputFocusBorder, backgroundColor: Colors.inputFocusBg,
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35, shadowRadius: 8,
  },

  error: { color: Colors.statusStop, fontSize: 12, marginBottom: 8, paddingHorizontal: 20 },

  btnWrap: {
    marginHorizontal: 20, marginTop: 8, borderRadius: 14,
    shadowColor: '#fff', shadowOffset: { width: -5, height: -5 },
    shadowOpacity: 0.55, shadowRadius: 12, elevation: 10,
  },
  btn: {
    flexDirection: 'row', gap: 8, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  btnText: { color: Colors.white, fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },

  noteInline: { textAlign: 'center', fontSize: 10, color: Colors.textLight, marginTop: 14, marginHorizontal: 20 },
});