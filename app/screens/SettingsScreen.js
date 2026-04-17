import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BubbleBackground from '../components/BubbleBackground';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';

// ─── Data ─────────────────────────────────────────────────────────────────────

const PARAMS = [
  { label: 'Water In',    value: 2.0,   min: 0.5,  max: 10.0,  step: 0.05, unit: 'L'   },
  { label: 'C1 Mix Time', value: 1.0,   min: 1.0,  max: 240.0, step: 30.0, unit: 'min' },
  { label: 'C1 Max Temp', value: 60.0,  min: 40.0, max: 100.0, step: 1.0,  unit: '°C'  },
  { label: 'Glycerin %',  value: 1.0,   min: 0.5,  max: 10.0,  step: 0.5,  unit: '%'   },
  { label: 'C3 Mix Time', value: 1.0,   min: 1.0,  max: 120.0, step: 1.0,  unit: 'min' },
  { label: 'C3 Max Temp', value: 60.0,  min: 40.0, max: 100.0, step: 1.0,  unit: '°C'  },
  { label: 'Tray Volume', value: 2.0,   min: 0.5,  max: 10.0,  step: 1.0,  unit: 'L'   },
  { label: 'Clean Time',  value: 180.0, min: 30.0, max: 600.0, step: 1.0,  unit: 's'   },
];

const TEAM = [
  { name: 'Martinez',  role: 'Team Member' },
  { name: 'Ragaas',    role: 'Team Member' },
  { name: 'Sanclaria', role: 'Team Member' },
  { name: 'Tipa',      role: 'Lead Developer' },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

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
        <Text style={Theme.sectionHeader}>Settings</Text>
        <Text style={Theme.sectionSub}>Machine parameters</Text>
      </View>

      <ScrollView contentContainerStyle={Theme.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Parameters */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="settings-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>Parameters</Text>
          </View>
          {params.map((p, i) => (
            <View key={p.label} style={styles.paramRow}>
              <Text style={styles.paramLabel}>{p.label}</Text>
              <View style={styles.paramControl}>
                <TouchableOpacity style={styles.adjBtn} onPress={() => adjust(i, -1)}>
                  <Ionicons name="remove" size={16} color={Colors.statusRunning} />
                </TouchableOpacity>
                <Text style={styles.paramValue}>
                  {p.step < 1 ? p.value.toFixed(2) : p.value.toFixed(0)} {p.unit}
                </Text>
                <TouchableOpacity style={styles.adjBtn} onPress={() => adjust(i, 1)}>
                  <Ionicons name="add" size={16} color={Colors.statusRunning} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* About Us */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="information-circle-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>About Us</Text>
          </View>

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
                <Ionicons name="person" size={16} color={Colors.statusRunning} />
              </View>
              <View>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
            </View>
          ))}

          <Text style={styles.sectionLabel}>SCHOOL & COURSE</Text>
          <Text style={styles.schoolText}>Polytechnic University of the Philippines</Text>
          <Text style={styles.schoolText}>Sta. Mesa, Manila</Text>
          <Text style={styles.schoolText}>CMPE 407 — Academic Year 2025–2026</Text>

          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>BIO-FISH v2.0  •  ESP32 Firmware v2.1</Text>
          </View>
        </View>

      </ScrollView>
    </BubbleBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },

  paramRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  paramLabel:   { fontSize: 13, color: Colors.dark, fontWeight: '600', flex: 1 },
  paramControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  adjBtn: {
    backgroundColor: Colors.inputBg, borderRadius: 10,
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    elevation: 3,
  },
  paramValue: {
    fontSize: 13, fontWeight: '700', color: Colors.statusRunning,
    minWidth: 70, textAlign: 'center',
  },

  logoRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  aboutLogo:     { width: 56, height: 56, borderRadius: 12 },
  aboutTitle:    { fontSize: 18, fontWeight: '900', color: Colors.dark },
  aboutSubtitle: { fontSize: 11, color: Colors.textMid, marginTop: 2 },
  aboutDesc:     { fontSize: 13, color: Colors.textDark, lineHeight: 20, marginBottom: 16 },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: Colors.textMid,
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 10, marginTop: 4,
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.inputBg, alignItems: 'center', justifyContent: 'center',
  },
  memberName: { fontSize: 13, fontWeight: '700', color: Colors.dark },
  memberRole: { fontSize: 11, color: Colors.textMid },

  schoolText: { fontSize: 13, color: Colors.textDark, marginBottom: 4 },

  versionBadge: {
    marginTop: 16, backgroundColor: Colors.inputBg,
    borderRadius: 10, padding: 10, alignItems: 'center',
  },
  versionText: { fontSize: 11, color: Colors.statusRunning, fontWeight: '600' },
});
