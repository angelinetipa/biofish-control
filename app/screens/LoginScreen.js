import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BubbleBackground from '../components/BubbleBackground';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';

export default function LoginScreen({ onLogin }) {
  const [username, setUsername]           = useState('');
  const [password, setPassword]           = useState('');
  const [usernameFocused, setUserFocused] = useState(false);
  const [passwordFocused, setPassFocused] = useState(false);
  const [error, setError]                 = useState('');

  const handleLogin = () => {
    if (username === 'admin' && password === 'password123') {
      onLogin({ username, role: 'admin' });
    } else if (username === 'operator1' && password === 'password123') {
      onLogin({ username, role: 'operator' });
    } else {
      setError('Invalid username or password.');
    }
  };

  const DEMO_CREDENTIALS = [
    { label: 'Admin',    value: 'admin / password123'     },
    { label: 'Operator', value: 'operator1 / password123' },
  ];

  return (
    <BubbleBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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
                <Image source={require('../../assets/BIOFISH_LOGO_2026.png')} style={styles.logo} />
              </View>
              <Text style={styles.appName}>BIO-FISH</Text>
              <Text style={styles.appDesc}>Bioplastic Sheet Production from Fish Scales</Text>
            </View>

            {/* Username */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>USERNAME</Text>
              <TextInput
                style={[styles.input, usernameFocused && styles.inputFocused]}
                placeholder="Enter your username"
                placeholderTextColor={Colors.textLight}
                value={username}
                onChangeText={t => { setUsername(t); setError(''); }}
                onFocus={() => setUserFocused(true)}
                onBlur={() => setUserFocused(false)}
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={[styles.input, passwordFocused && styles.inputFocused]}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={t => { setPassword(t); setError(''); }}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Sign In */}
            <TouchableOpacity onPress={handleLogin} activeOpacity={0.85} style={styles.btnWrap}>
              <LinearGradient
                colors={[Colors.teal, Colors.blue]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.btn}
              >
                <Text style={styles.btnText}>SIGN IN</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Demo credentials */}
            <View style={styles.demoCard}>
              <Text style={styles.demoTitle}>🔒  DEMO CREDENTIALS</Text>
              {DEMO_CREDENTIALS.map((c, i) => (
                <View key={c.label} style={[styles.credRow, i === DEMO_CREDENTIALS.length - 1 && { marginBottom: 0 }]}>
                  <Text style={styles.credLabel}>{c.label}</Text>
                  <View style={styles.credValueWrap}>
                    <Text style={styles.credValue}>{c.value}</Text>
                  </View>
                </View>
              ))}
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
    width: '100%',
    maxWidth: 360,
    paddingTop: 36,
    paddingBottom: 28,
    overflow: 'hidden',
  },

  accentLine: {
    position: 'absolute', top: 0, left: '5%', right: '5%',
    height: 3, borderRadius: 99, opacity: 0.75,
  },

  logoSection: { alignItems: 'center', marginBottom: 20, paddingHorizontal: 32 },
  logoGlow: {
    borderRadius: 20, marginBottom: 12,
    shadowColor: '#fff',
    shadowOffset: { width: -5, height: -5 },
    shadowOpacity: 0.7, shadowRadius: 14, elevation: 8,
  },
  logo:    { width: 72, height: 72, borderRadius: 16 },
  appName: { fontSize: 20, fontWeight: '900', color: Colors.dark, marginBottom: 4, letterSpacing: 0.5 },
  appDesc: { fontSize: 11, color: Colors.textMid, textAlign: 'center', letterSpacing: 0.3 },

  formGroup: { marginBottom: 14, paddingHorizontal: 32 },
  label: {
    fontSize: 11, fontWeight: '800', color: Colors.textDark,
    letterSpacing: 0.8, marginBottom: 7,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 13, color: Colors.textDark,
    borderWidth: 2, borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: Colors.inputFocusBorder,
    backgroundColor: Colors.inputFocusBg,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35, shadowRadius: 8,
  },

  error: {
    color: Colors.statusStop, fontSize: 12,
    marginBottom: 8, paddingHorizontal: 32,
  },

  btnWrap: {
    marginHorizontal: 32, marginTop: 8, borderRadius: 14,
    shadowColor: '#fff',
    shadowOffset: { width: -5, height: -5 },
    shadowOpacity: 0.55, shadowRadius: 12, elevation: 10,
  },
  btn: {
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  btnText: { color: Colors.white, fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },

  demoCard: {
    marginHorizontal: 32, marginTop: 20, padding: 14,
    backgroundColor: Colors.demoBg,
    borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)',
  },
  demoTitle: {
    fontSize: 10, fontWeight: '800', color: Colors.blue,
    marginBottom: 10, letterSpacing: 0.8, textTransform: 'uppercase',
  },
  credRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10, padding: 10, marginBottom: 8,
    shadowColor: '#fff',
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.6, shadowRadius: 6, elevation: 2,
  },
  credLabel:    { fontSize: 12, fontWeight: '600', color: Colors.textMid },
  credValueWrap: {
    backgroundColor: 'rgba(168,224,218,0.35)',
    borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10,
  },
  credValue: {
    fontSize: 11, fontWeight: '700', color: Colors.dark,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});