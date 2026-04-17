import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BubbleBackground from '../components/BubbleBackground';

const PARAMS = [
  { label: 'Water In',     value: 2.0,  min: 0.5,  max: 10.0, step: 0.05, unit: 'L'   },
  { label: 'C1 Mix Time',  value: 1.0,  min: 1.0,  max: 240.0,step: 30.0, unit: 'min' },
  { label: 'C1 Max Temp',  value: 60.0, min: 40.0, max: 100.0, step: 1.0, unit: '°C'  },
  { label: 'Glycerin %',   value: 1.0,  min: 0.5,  max: 10.0,  step: 0.5, unit: '%'   },
  { label: 'C3 Mix Time',  value: 1.0,  min: 1.0,  max: 120.0, step: 1.0, unit: 'min' },
  { label: 'C3 Max Temp',  value: 60.0, min: 40.0, max: 100.0, step: 1.0, unit: '°C'  },
  { label: 'Tray Volume',  value: 2.0,  min: 0.5,  max: 10.0,  step: 1.0, unit: 'L'   },
  { label: 'Clean Time',   value: 180.0,min: 30.0, max: 600.0, step: 1.0, unit: 's'   },
];

const TEAM = [
  { name: 'Angeline',  role: 'Lead Developer' },
  { name: 'Member 2',  role: 'Hardware Engineer' },
  { name: 'Member 3',  role: 'Research Lead' },
];

export default function SettingsScreen() {
  const [params, setParams] = useState(PARAMS);

  const adjust = (i, dir) => {
    setParams(prev => {
      const updated = [...prev];
      const p = { ...updated[i] };
      p.value = Math.min(p.max, Math.max(p.min, parseFloat((p.value + dir * p.step).toFixed(2))));
      updated[i] = p;
      return updated;
    });
  };

  return (
    <BubbleBackground>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSub}>Machine parameters</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Parameters */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>⚙️  PARAMETERS</Text>
          {params.map((p, i) => (
            <View key={p.label} style={styles.paramRow}>
              <Text style={styles.paramLabel}>{p.label}</Text>
              <View style={styles.paramControl}>
                <TouchableOpacity style={styles.adjBtn} onPress={() => adjust(i, -1)}>
                  <Ionicons name="remove" size={16} color="#0d8a9e" />
                </TouchableOpacity>
                <Text style={styles.paramValue}>
                  {p.step < 1 ? p.value.toFixed(2) : p.value.toFixed(0)} {p.unit}
                </Text>
                <TouchableOpacity style={styles.adjBtn} onPress={() => adjust(i, 1)}>
                  <Ionicons name="add" size={16} color="#0d8a9e" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* About Us */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ℹ️  ABOUT US</Text>

          <View style={styles.logoRow}>
            <Image source={require('../../assets/BIOFISH_LOGO_2026.png')} style={styles.aboutLogo} />
            <View>
              <Text style={styles.aboutTitle}>BIO-FISH</Text>
              <Text style={styles.aboutSubtitle}>Bioplastic Sheet Production{'\n'}from Fish Scales</Text>
            </View>
          </View>

          <Text style={styles.aboutDesc}>
            BIO-FISH is a capstone project that automates the extraction of gelatin
            from fish scales to produce bioplastic sheets — a sustainable alternative
            to conventional plastics.
          </Text>

          <Text style={styles.sectionLabel}>THE TEAM</Text>
          {TEAM.map(member => (
            <View key={member.name} style={styles.memberRow}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={16} color="#0d8a9e" />
              </View>
              <View>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
            </View>
          ))}

          <Text style={styles.sectionLabel}>SCHOOL & COURSE</Text>
          <Text style={styles.schoolText}>Your School Name Here</Text>
          <Text style={styles.schoolText}>Your Course / Program Here</Text>
          <Text style={styles.schoolText}>Academic Year 2025 – 2026</Text>

          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>BIO-FISH v2.0  •  ESP32 Firmware v2.1</Text>
          </View>
        </View>

      </ScrollView>
    </BubbleBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  headerTitle: { color: '#fff', fontWeight: 'bold', fontSize: 22 },
  headerSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 120, gap: 16 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 24, padding: 20,
    shadowColor: '#0a3d52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 10,
  },
  cardLabel: { fontSize: 11, fontWeight: '700', color: '#6b8a9a', letterSpacing: 1, marginBottom: 14 },
  paramRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  paramLabel:   { fontSize: 13, color: '#0a3d52', fontWeight: '600', flex: 1 },
  paramControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  adjBtn: {
    backgroundColor: '#e8f4f8', borderRadius: 10,
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    elevation: 3,
  },
  paramValue: { fontSize: 13, fontWeight: '700', color: '#0d8a9e', minWidth: 70, textAlign: 'center' },
  logoRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  aboutLogo: { width: 56, height: 56, borderRadius: 12 },
  aboutTitle:    { fontSize: 18, fontWeight: 'bold', color: '#0a3d52' },
  aboutSubtitle: { fontSize: 11, color: '#6b8a9a', marginTop: 2 },
  aboutDesc: { fontSize: 13, color: '#444', lineHeight: 20, marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#6b8a9a', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#e8f4f8', alignItems: 'center', justifyContent: 'center',
  },
  memberName: { fontSize: 13, fontWeight: '700', color: '#0a3d52' },
  memberRole: { fontSize: 11, color: '#6b8a9a' },
  schoolText: { fontSize: 13, color: '#444', marginBottom: 4 },
  versionBadge: {
    marginTop: 16, backgroundColor: '#e8f4f8',
    borderRadius: 10, padding: 10, alignItems: 'center',
  },
  versionText: { fontSize: 11, color: '#0d8a9e', fontWeight: '600' },
});