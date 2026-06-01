import React, { useState, useEffect, useRef } from 'react';
import {
  Alert, View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, TextInput, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BubbleBackground from '../components/BubbleBackground';
import AppHeader from '../components/AppHeader';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';
import { supabase } from '../lib/supabase';

// ─── Machine parameters (match ESP32 firmware v2.6 exactly) ───────────────────
const PARAMS = [
  { key: 'water_in_l',   label: 'Water In',    min: 0.5,  max: 10.0,  step: 0.05, unit: 'L',   def: 2.5   },
  { key: 'c1_mix_min',   label: 'C1 Mix Time', min: 1.0,  max: 240.0, step: 1.0,  unit: 'min', def: 240.0 },
  { key: 'c1_max_temp',  label: 'C1 Max Temp', min: 40.0, max: 100.0, step: 1.0,  unit: '°C',  def: 60.0  },
  { key: 'glycerin_pct', label: 'Glycerin %',  min: 0.5,  max: 10.0,  step: 0.5,  unit: '%',   def: 2.0   },
  { key: 'c3_mix_min',   label: 'C3 Mix Time', min: 1.0,  max: 120.0, step: 1.0,  unit: 'min', def: 5.0   },
  { key: 'c3_max_temp',  label: 'C3 Max Temp', min: 40.0, max: 100.0, step: 1.0,  unit: '°C',  def: 60.0  },
  { key: 'clean_s',      label: 'Clean Time',  min: 10.0, max: 600.0, step: 10.0, unit: 's',   def: 180.0 },
  { key: 'drain_s',      label: 'Drain Time',  min: 10.0, max: 120.0, step: 10.0, unit: 's',   def: 30.0  },
];

const TEAM = [
  { name: 'Martinez',  role: 'Team Member' },
  { name: 'Ragaas',    role: 'Team Member' },
  { name: 'Sanclaria', role: 'Team Member' },
  { name: 'Tipa',      role: 'Lead Developer' },
];

const defaultValues = () => PARAMS.reduce((acc, p) => ({ ...acc, [p.key]: p.def }), {});
const fmt = (p, v) => (p.step < 1 ? Number(v).toFixed(2) : Number(v).toFixed(0));

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen({ onLogout }) {
  const [values, setValues]   = useState(defaultValues);
  const [dirty, setDirty]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [loaded, setLoaded]   = useState(false);

  // PIN change state
  const [currentPin, setCurrentPin]   = useState('');
  const [newPin, setNewPin]           = useState('');
  const [confirmPin, setConfirmPin]   = useState('');
  const [pinSaving, setPinSaving]     = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [livePin, setLivePin]         = useState('');  // current PIN from DB

  const dirtyRef = useRef(false);
  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);

  const applyRow = (row) => {
    setValues((prev) => {
      const next = { ...prev };
      PARAMS.forEach((p) => { if (row[p.key] != null) next[p.key] = Number(row[p.key]); });
      return next;
    });
    if (row.access_pin) setLivePin(row.access_pin);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from('machine_settings').select('*').eq('id', 1).single();
      if (active && data) applyRow(data);
      if (active) setLoaded(true);
    })();

    const channel = supabase
      .channel('machine_settings')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'machine_settings' },
        (payload) => {
          const row = payload.new;
          if (dirtyRef.current) return;
          if (row.updated_by === 'app') return;
          applyRow(row);
        }
      )
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, []);

  const adjust = (key, dir) => {
    setValues((prev) => {
      const p = PARAMS.find((x) => x.key === key);
      let v = Number(prev[key]) + dir * p.step;
      v = Math.min(p.max, Math.max(p.min, v));
      v = Math.round(v / p.step) * p.step;
      v = parseFloat(v.toFixed(2));
      return { ...prev, [key]: v };
    });
    setDirty(true);
  };

  const saveAll = async () => {
    setSaving(true);
    const payload = PARAMS.reduce((acc, p) => ({ ...acc, [p.key]: values[p.key] }), {});
    payload.updated_by = 'app';
    payload.updated_at = new Date().toISOString();
    const { error } = await supabase.from('machine_settings').update(payload).eq('id', 1);
    setSaving(false);
    if (!error) {
      setDirty(false);
    } else {
      Alert.alert('Save Failed', 'Could not save settings. Check your connection and try again.');
    }
  };

  const savePin = async () => {
    if (!currentPin || !newPin || !confirmPin) {
      Alert.alert('Missing Fields', 'Please fill in all PIN fields.'); return;
    }
    if (currentPin !== livePin) {
      Alert.alert('Wrong PIN', 'Current PIN is incorrect.'); return;
    }
    if (newPin.length < 4) {
      Alert.alert('Too Short', 'New PIN must be at least 4 digits.'); return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Mismatch', 'New PIN and confirmation do not match.'); return;
    }
    setPinSaving(true);
    const { error } = await supabase
      .from('machine_settings')
      .update({ access_pin: newPin, updated_by: 'app', updated_at: new Date().toISOString() })
      .eq('id', 1);
    setPinSaving(false);
    if (!error) {
      setLivePin(newPin);
      setCurrentPin(''); setNewPin(''); setConfirmPin('');
      Alert.alert('PIN Updated', 'Access PIN has been changed successfully.');
    } else {
      Alert.alert('Save Failed', 'Could not update PIN. Check your connection and try again.');
    }
  };

  return (
    <BubbleBackground>
      <AppHeader title="Settings"
        subtitle="Parameters & team" onLogout={onLogout} channelKey="online-settings" />

      <ScrollView contentContainerStyle={Theme.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Machine Parameters */}
        <View style={Theme.card}>
          <View style={styles.cardHeadRow}>
            <View style={Theme.cardLabelRow}>
              <Ionicons name="settings-outline" size={13} color={Colors.textMid} />
              <Text style={Theme.cardLabel}>Machine Parameters</Text>
            </View>
            <View style={[styles.syncPill, dirty ? styles.syncDirty : styles.syncOk]}>
              <Ionicons name={dirty ? 'ellipse' : 'checkmark-circle'} size={11}
                color={dirty ? '#D4840A' : Colors.teal} />
              <Text style={[styles.syncText, { color: dirty ? '#D4840A' : Colors.teal }]}>
                {dirty ? 'Unsaved' : 'Synced'}
              </Text>
            </View>
          </View>

          {PARAMS.map((p) => (
            <View key={p.key} style={styles.paramRow}>
              <Text style={styles.paramLabel}>{p.label}</Text>
              <View style={styles.paramControl}>
                <TouchableOpacity style={styles.adjBtn} onPress={() => adjust(p.key, -1)}
                  disabled={!loaded || values[p.key] <= p.min}>
                  <Ionicons name="remove" size={16}
                    color={values[p.key] <= p.min ? Colors.textLight : Colors.statusRunning} />
                </TouchableOpacity>
                <Text style={styles.paramValue}>{fmt(p, values[p.key])} {p.unit}</Text>
                <TouchableOpacity style={styles.adjBtn} onPress={() => adjust(p.key, 1)}
                  disabled={!loaded || values[p.key] >= p.max}>
                  <Ionicons name="add" size={16}
                    color={values[p.key] >= p.max ? Colors.textLight : Colors.statusRunning} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.saveBtn, (!dirty || saving) && styles.saveBtnOff]}
            onPress={saveAll}
            disabled={!dirty || saving}
            activeOpacity={0.85}
          >
            <Ionicons name={saving ? 'sync' : 'cloud-upload-outline'} size={16} color={Colors.white} />
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save All'}</Text>
          </TouchableOpacity>
        </View>

        {/* Change PIN */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="key-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>Change Access PIN</Text>
          </View>

          <Text style={styles.pinHint}>Changes take effect for all users on next login.</Text>

          {[
            { label: 'Current PIN', value: currentPin, setter: setCurrentPin, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
            { label: 'New PIN',     value: newPin,     setter: setNewPin,     show: showNew,     toggle: () => setShowNew(v => !v) },
            { label: 'Confirm PIN', value: confirmPin, setter: setConfirmPin, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
          ].map(({ label, value, setter, show, toggle }) => (
            <View key={label} style={styles.pinGroup}>
              <Text style={styles.pinLabel}>{label}</Text>
              <View style={styles.pinWrap}>
                <TextInput
                  style={styles.pinInput}
                  value={value}
                  onChangeText={setter}
                  secureTextEntry={!show}
                  keyboardType="number-pad"
                  maxLength={12}
                  placeholderTextColor={Colors.textLight}
                  placeholder="••••"
                />
                <TouchableOpacity onPress={toggle} style={styles.pinEye}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={17} color={Colors.textMid} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.saveBtn, pinSaving && styles.saveBtnOff]}
            onPress={savePin}
            disabled={pinSaving}
            activeOpacity={0.85}
          >
            <Ionicons name={pinSaving ? 'sync' : 'shield-checkmark-outline'} size={16} color={Colors.white} />
            <Text style={styles.saveText}>{pinSaving ? 'Saving…' : 'Update PIN'}</Text>
          </TouchableOpacity>
        </View>

        {/* About Us */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="information-circle-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>About Us</Text>
          </View>

          <View style={styles.logoRow}>
            <Image source={require('../../assets/BIOFISH_LOGO.png')} style={styles.aboutLogo} />
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
          {TEAM.map((member) => (
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
        </View>

      </ScrollView>
    </BubbleBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  cardHeadRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  syncPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
  },
  syncOk:    { backgroundColor: 'rgba(93,217,210,0.18)' },
  syncDirty: { backgroundColor: 'rgba(212,132,10,0.15)' },
  syncText:  { fontSize: 11, fontWeight: '700' },

  paramRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  paramLabel:   { fontSize: 13, color: Colors.dark, fontWeight: '600', flex: 1 },
  paramControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  adjBtn: {
    backgroundColor: Colors.inputBg, borderRadius: 10,
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center', elevation: 3,
  },
  paramValue: {
    fontSize: 13, fontWeight: '700', color: Colors.statusRunning,
    minWidth: 70, textAlign: 'center',
  },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.teal, borderRadius: 14,
    paddingVertical: 13, marginTop: 6, elevation: 6,
  },
  saveBtnOff: { opacity: 0.4 },
  saveText:   { color: Colors.white, fontWeight: '800', fontSize: 13, letterSpacing: 0.3 },

  // PIN
  pinHint:  { fontSize: 12, color: Colors.textMid, marginBottom: 14, lineHeight: 18 },
  pinGroup: { marginBottom: 12 },
  pinLabel: { fontSize: 11, fontWeight: '800', color: Colors.textDark, letterSpacing: 0.8, marginBottom: 6 },
  pinWrap:  { position: 'relative', justifyContent: 'center' },
  pinInput: {
    backgroundColor: Colors.inputBg, borderRadius: 12,
    paddingHorizontal: 14, paddingRight: 44,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 13, color: Colors.textDark, letterSpacing: 3,
    borderWidth: 2, borderColor: 'transparent',
  },
  pinEye: {
    position: 'absolute', right: 10, top: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },

  // About
  logoRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  aboutLogo:     { width: 56, height: 56, borderRadius: 12 },
  aboutTitle:    { fontSize: 18, fontWeight: '900', color: Colors.dark },
  aboutSubtitle: { fontSize: 11, color: Colors.textMid, marginTop: 2 },
  aboutDesc:     { fontSize: 13, color: Colors.textDark, lineHeight: 20, marginBottom: 16 },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: Colors.textMid,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 4,
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.inputBg, alignItems: 'center', justifyContent: 'center',
  },
  memberName: { fontSize: 13, fontWeight: '700', color: Colors.dark },
  memberRole: { fontSize: 11, color: Colors.textMid },

  schoolText: { fontSize: 13, color: Colors.textDark, marginBottom: 4 },
});