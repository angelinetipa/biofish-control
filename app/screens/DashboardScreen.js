import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BubbleBackground from '../components/BubbleBackground';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = ['Extraction', 'Filtration', 'Formulation', 'Formation'];

const STATUS_META = {
  IDLE:     { color: Colors.statusIdle,    label: 'Idle',     desc: 'Machine is ready'       },
  RUNNING:  { color: Colors.statusRunning, label: 'Running',  desc: 'Process in progress'    },
  PAUSED:   { color: Colors.statusPaused,  label: 'Paused',   desc: 'Process paused'         },
  CLEANING: { color: Colors.statusClean,   label: 'Cleaning', desc: 'Cleaning cycle active'  },
};

const MONITOR = {
  timer:    '00:08:54',
  c1Temp:   58.3,
  c3Temp:   27.1,
  c1Heater: true,
  c1Fan:    false,
  c3Heater: false,
  c3Fan:    false,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusChip({ icon, label, active }) {
  return (
    <View style={[styles.chip, active && styles.chipOn]}>
      <Ionicons name={icon} size={11} color={active ? Colors.white : Colors.textLight} />
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </View>
  );
}

function StageStepper({ stageIdx, isRunning }) {
  return (
    <View style={styles.stepperRow}>
      {STAGES.map((stage, i) => {
        const done   = i < stageIdx;
        const active = i === stageIdx && isRunning;
        const last   = i === STAGES.length - 1;
        return (
          <React.Fragment key={stage}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, done && styles.stepDone, active && styles.stepActive]}>
                {done
                  ? <Ionicons name="checkmark" size={12} color={Colors.white} />
                  : <Text style={[styles.stepNum, active && { color: Colors.white }]}>{i + 1}</Text>
                }
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive, done && styles.stepLabelDone]}
                numberOfLines={1}>
                {stage}
              </Text>
            </View>
            {!last && <View style={[styles.stepLine, (done || active) && styles.stepLineDone]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen({ onLogout }) {
  const [status, setStatus]     = useState('IDLE');
  const [stageIdx, setStageIdx] = useState(0);

  const isRunning  = status === 'RUNNING' || status === 'PAUSED';
  const isCleaning = status === 'CLEANING';
  const meta       = STATUS_META[status] ?? STATUS_META.IDLE;

  const handleStart = () => { setStatus('RUNNING'); setStageIdx(0); };
  const handlePause = () => setStatus(status === 'PAUSED' ? 'RUNNING' : 'PAUSED');
  const handleStop  = () => { setStatus('IDLE'); setStageIdx(0); };
  const handleClean = () => setStatus('CLEANING');

  const BUTTONS = [
    {
      label:    'Start',
      icon:     'play',
      colors:   ['#3DBFB8', '#2A9E97'],
      onPress:  handleStart,
      disabled: isRunning || isCleaning,
    },
    {
      label:    status === 'PAUSED' ? 'Resume' : 'Pause',
      icon:     status === 'PAUSED' ? 'play-circle-outline' : 'pause',
      colors:   ['#F0A030', '#D4840A'],
      onPress:  handlePause,
      disabled: !isRunning,
    },
    {
      label:    'Stop',
      icon:     'stop-circle-outline',
      colors:   ['#D9534F', '#B83230'],
      onPress:  handleStop,
      disabled: !isRunning,
    },
    {
      label:    'Clean',
      icon:     'water-outline',
      colors:   ['#4A7FD4', '#2E63B8'],
      onPress:  handleClean,
      disabled: isRunning || isCleaning,
    },
  ];

  return (
    <BubbleBackground>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={Theme.row}>
          <Image source={require('../../assets/BIOFISH_LOGO_2026.png')} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>BIO-FISH</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={16} color={Colors.white} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Status + Stage + Temps ── */}
        <View style={Theme.card}>

          {/* Status row */}
          <View style={styles.statusRow}>
            <View>
              <View style={styles.statusLabelRow}>
                <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
                <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
              </View>
              <Text style={styles.statusDesc}>{meta.desc}</Text>
            </View>
            <View style={styles.timerBadge}>
              <Ionicons name="timer-outline" size={12} color={Colors.textMid} />
              <Text style={styles.timerText}>{MONITOR.timer}</Text>
            </View>
          </View>

          {/* Stage stepper */}
          <StageStepper stageIdx={stageIdx} isRunning={isRunning} />

          {/* Divider */}
          <View style={styles.divider} />

          {/* Temperatures */}
          <View style={Theme.row}>
            <View style={styles.tempBlock}>
              <View style={styles.tempLabelRow}>
                <Ionicons name="thermometer-outline" size={13} color={Colors.textMid} />
                <Text style={Theme.cardLabel}>C1 Temp</Text>
              </View>
              <Text style={styles.tempText}>{MONITOR.c1Temp}°C</Text>
              <View style={styles.chipRow}>
                <StatusChip icon="flame" label="Heat" active={MONITOR.c1Heater} />
                <StatusChip icon="partly-sunny-outline" label="Fan" active={MONITOR.c1Fan} />
              </View>
            </View>

            <View style={styles.tempDivider} />

            <View style={styles.tempBlock}>
              <View style={styles.tempLabelRow}>
                <Ionicons name="thermometer-outline" size={13} color={Colors.textMid} />
                <Text style={Theme.cardLabel}>C3 Temp</Text>
              </View>
              <Text style={styles.tempText}>{MONITOR.c3Temp}°C</Text>
              <View style={styles.chipRow}>
                <StatusChip icon="flame" label="Heat" active={MONITOR.c3Heater} />
                <StatusChip icon="partly-sunny-outline" label="Fan" active={MONITOR.c3Fan} />
              </View>
            </View>
          </View>

        </View>

        {/* ── Control Buttons 2×2 ── */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="flash-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>Machine Control</Text>
          </View>
          <View style={styles.buttonGrid}>
            {BUTTONS.map((btn) => (
              <TouchableOpacity
                key={btn.label}
                onPress={btn.onPress}
                disabled={btn.disabled}
                activeOpacity={0.8}
                style={[styles.btnWrap, btn.disabled && styles.dimBtn]}
              >
                <LinearGradient
                  colors={btn.colors}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.btn}
                >
                  <Ionicons name={btn.icon} size={26} color={Colors.white} />
                  <Text style={styles.btnText}>{btn.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </BubbleBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
  },
  headerLogo:  { width: 36, height: 36, borderRadius: 8, marginRight: 10 },
  headerTitle: { color: Colors.white, fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  logoutText: { color: Colors.white, fontSize: 13, fontWeight: '600' },

  scroll: { padding: 16, paddingBottom: 120, gap: 14 },

  // Status
  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  statusLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  statusDot:      { width: 10, height: 10, borderRadius: 5 },
  statusText:     { fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  statusDesc:     { fontSize: 12, color: Colors.textMid, marginLeft: 18 },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.inputBg, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  timerText: { fontSize: 13, fontWeight: '700', color: Colors.dark, letterSpacing: 1 },

  // Stepper
  stepperRow: { flexDirection: 'row', alignItems: 'center' },
  stepItem:   { alignItems: 'center', flex: 1 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.inputBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  stepDone:        { backgroundColor: Colors.teal },
  stepActive:      { backgroundColor: Colors.blue },
  stepNum:         { fontSize: 11, fontWeight: '700', color: Colors.textMid },
  stepLine:        { flex: 1, height: 2, backgroundColor: Colors.inputBg, marginBottom: 18, marginHorizontal: 2 },
  stepLineDone:    { backgroundColor: Colors.teal },
  stepLabel:       { fontSize: 9, color: Colors.textLight, fontWeight: '600', textAlign: 'center' },
  stepLabelActive: { color: Colors.blue, fontWeight: '800' },
  stepLabelDone:   { color: Colors.teal },

  // Divider
  divider:     { height: 1, backgroundColor: Colors.inputBg, marginVertical: 16 },
  tempDivider: { width: 1, backgroundColor: Colors.inputBg, marginHorizontal: 8, alignSelf: 'stretch' },

  // Temps
  tempBlock:    { flex: 1 },
  tempLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  tempText:     { fontSize: 26, fontWeight: '900', color: Colors.blue, marginBottom: 8 },
  chipRow:      { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.inputBg, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  chipOn:      { backgroundColor: Colors.statusRunning },
  chipText:    { fontSize: 10, color: Colors.textLight, fontWeight: '600' },
  chipTextOn:  { color: Colors.white },

  // Buttons
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  btnWrap:    { width: '47%', borderRadius: 18, overflow: 'hidden', elevation: 8 },
  btn: {
    paddingVertical: 22, alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  dimBtn:  { opacity: 0.35 },
});
