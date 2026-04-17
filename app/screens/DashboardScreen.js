import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, ScrollView, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BubbleBackground from '../components/BubbleBackground';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';
import { Platform } from 'react-native';

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = ['EXTRACTION', 'FILTRATION', 'FORMULATION', 'FORMATION'];

const STATUS_META = {
  IDLE:     { color: Colors.statusIdle,    label: 'IDLE'     },
  RUNNING:  { color: Colors.statusRunning, label: 'RUNNING'  },
  PAUSED:   { color: Colors.statusPaused,  label: 'PAUSED'   },
  CLEANING: { color: Colors.statusClean,   label: 'CLEANING' },
};

const MONITOR_PLACEHOLDER = {
  stage:    'S1: EXTRACTION [1/4]',
  pump:     'Pump1: ON — Water → C1',
  timer:    '00:08:54',
  c1Temp:   58.3,
  c3Temp:   27.1,
  c1Heater: true,
  c1Fan:    false,
  c3Heater: false,
  c3Fan:    false,
  volume:   2200,
  volMin:   1900,
  volMax:   2500,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ControlButton({ label, icon, onPress, disabled, colors: btnColors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.ctrlBtnWrap, disabled && styles.dimBtn]}
    >
      <LinearGradient colors={btnColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctrlBtn}>
        <Ionicons name={icon} size={24} color={Colors.white} />
        <Text style={styles.ctrlBtnText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function TempCard({ title, icon, temp, heaterOn, fanOn }) {
  return (
    <View style={[Theme.card, Theme.halfCard]}>
      <View style={Theme.cardLabelRow}>
        <Ionicons name={icon} size={13} color={Colors.textMid} />
        <Text style={Theme.cardLabel}>{title}</Text>
      </View>
      <Text style={styles.tempText}>{temp}°C</Text>
      <View style={Theme.row}>
        <StatusChip icon="flame" label="Heat" active={heaterOn} />
        <StatusChip icon="partly-sunny-outline" label="Fan" active={fanOn} />
      </View>
    </View>
  );
}

function StatusChip({ icon, label, active }) {
  return (
    <View style={[styles.chip, active && styles.chipOn]}>
      <Ionicons name={icon} size={12} color={active ? Colors.white : '#aaa'} />
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen({ onLogout }) {
  const [status, setStatus]         = useState('IDLE');
  const [stageIdx, setStageIdx]     = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const isRunning  = status === 'RUNNING' || status === 'PAUSED';
  const isCleaning = status === 'CLEANING';
  const meta       = STATUS_META[status] ?? STATUS_META.IDLE;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleStart = () => { setStatus('RUNNING'); setStageIdx(0); };
  const handlePause = () => setStatus(status === 'PAUSED' ? 'RUNNING' : 'PAUSED');
  const handleStop  = () => { setStatus('IDLE');    setStageIdx(0); };
  const handleClean = () => setStatus('CLEANING');

  const volPct = Math.min(100, Math.max(0,
    ((MONITOR_PLACEHOLDER.volume - MONITOR_PLACEHOLDER.volMin) /
     (MONITOR_PLACEHOLDER.volMax  - MONITOR_PLACEHOLDER.volMin)) * 100
  ));

  return (
    <BubbleBackground>
      {/* Header */}
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

      <ScrollView
        contentContainerStyle={Theme.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Machine Control ── */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="flash-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>Machine Control</Text>
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>

          {isRunning && (
            <View style={styles.stageBadge}>
              <Text style={styles.stageBadgeText}>S{stageIdx + 1}: {STAGES[stageIdx]}</Text>
            </View>
          )}

          <View style={styles.buttonGrid}>
            <ControlButton
              label="Start" icon="play"
              colors={[Colors.gradientStart, Colors.statusClean]}
              onPress={handleStart}
              disabled={isRunning || isCleaning}
            />
            <ControlButton
              label={status === 'PAUSED' ? 'Resume' : 'Pause'}
              icon={status === 'PAUSED' ? 'play' : 'pause'}
              colors={['#f0a500', '#c47d00']}
              onPress={handlePause}
              disabled={!isRunning}
            />
            <ControlButton
              label="Stop" icon="stop"
              colors={['#8a9eaa', '#5a7080']}
              onPress={handleStop}
              disabled={!isRunning}
            />
            <ControlButton
              label="Clean" icon="water"
              colors={['#3b7dd8', '#1a5ab8']}
              onPress={handleClean}
              disabled={isRunning || isCleaning}
            />
          </View>
        </View>

        {/* ── LCD Mirror ── */}
        <View style={styles.lcdCard}>
          <View style={styles.lcdLabelRow}>
            <Ionicons name="terminal-outline" size={13} color={Colors.teal} />
            <Text style={styles.lcdLabel}>LCD DISPLAY</Text>
          </View>
          <View style={styles.lcd}>
            {[
              MONITOR_PLACEHOLDER.stage,
              'B1=Pause  B2=Stop',
              MONITOR_PLACEHOLDER.pump,
              `Time: ${MONITOR_PLACEHOLDER.timer}`,
            ].map((row, i) => (
              <Text key={i} style={styles.lcdRow}>{row}</Text>
            ))}
          </View>
        </View>

        {/* ── Timer ── */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="timer-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>Elapsed Time</Text>
          </View>
          <Text style={styles.timerText}>{MONITOR_PLACEHOLDER.timer}</Text>
        </View>

        {/* ── Temperatures ── */}
        <View style={Theme.row}>
          <TempCard
            title="C1 Temp"
            icon="thermometer-outline"
            temp={MONITOR_PLACEHOLDER.c1Temp}
            heaterOn={MONITOR_PLACEHOLDER.c1Heater}
            fanOn={MONITOR_PLACEHOLDER.c1Fan}
          />
          <TempCard
            title="C3 Temp"
            icon="thermometer-outline"
            temp={MONITOR_PLACEHOLDER.c3Temp}
            heaterOn={MONITOR_PLACEHOLDER.c3Heater}
            fanOn={MONITOR_PLACEHOLDER.c3Fan}
          />
        </View>

        {/* ── Volume ── */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="water-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>C3 Volume (Ultrasonic)</Text>
          </View>
          <View style={styles.volRow}>
            <Text style={styles.volText}>{MONITOR_PLACEHOLDER.volume} mL</Text>
            <Text style={styles.volRange}>
              {MONITOR_PLACEHOLDER.volMin} – {MONITOR_PLACEHOLDER.volMax} mL
            </Text>
          </View>
          <View style={styles.volBarBg}>
            <LinearGradient
              colors={[Colors.teal, Colors.blue]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.volBarFill, { width: `${volPct}%` }]}
            />
          </View>
        </View>

        {/* ── Stage Progress ── */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="list-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>Stage Progress</Text>
          </View>
          {STAGES.map((stage, i) => {
            const done   = i < stageIdx;
            const active = i === stageIdx && isRunning;
            return (
              <View key={stage} style={styles.stageRow}>
                <View style={[styles.stageCircle, done && styles.stageDone, active && styles.stageActive]}>
                  {done
                    ? <Ionicons name="checkmark" size={14} color={Colors.white} />
                    : <Text style={[styles.stageNum, active && { color: Colors.white }]}>{i + 1}</Text>
                  }
                </View>
                <Text style={[styles.stageName, active && styles.stageNameActive]}>{stage}</Text>
              </View>
            );
          })}
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
  logoutText:  { color: Colors.white, fontSize: 13, fontWeight: '600' },
  statusRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  statusDot:   { width: 12, height: 12, borderRadius: 6 },
  statusText:  { fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  stageBadge:  {
    alignSelf: 'flex-start', marginBottom: 14,
    backgroundColor: Colors.inputBg, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  stageBadgeText: { color: Colors.dark, fontWeight: '700', fontSize: 12 },
  buttonGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  ctrlBtnWrap: { width: '47%', borderRadius: 18, overflow: 'hidden', elevation: 8 },
  ctrlBtn:     { padding: 20, alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctrlBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  dimBtn:      { opacity: 0.4 },
  lcdCard: {
    backgroundColor: '#0a1f2e', borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 12,
  },
  lcdLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  lcdLabel: { color: Colors.teal, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  lcd:      { backgroundColor: '#0d2b3e', borderRadius: 12, padding: 14, gap: 6 },
  lcdRow:   { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#7efff5', fontSize: 13, letterSpacing: 0.8 },
  timerText: { fontSize: 36, fontWeight: '900', color: Colors.dark, letterSpacing: 2 },
  tempText:  { fontSize: 32, fontWeight: '900', color: Colors.blue, marginBottom: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.inputBg, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  chipOn:      { backgroundColor: Colors.statusRunning },
  chipText:    { fontSize: 11, color: '#aaa', fontWeight: '600' },
  chipTextOn:  { color: Colors.white },
  volRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  volText:   { fontSize: 28, fontWeight: '900', color: Colors.dark },
  volRange:  { fontSize: 11, color: Colors.textMid },
  volBarBg:  { height: 10, backgroundColor: Colors.inputBg, borderRadius: 10, overflow: 'hidden' },
  volBarFill:{ height: '100%', borderRadius: 10 },
  stageRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  stageCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.inputBg, alignItems: 'center', justifyContent: 'center',
  },
  stageDone:      { backgroundColor: Colors.teal },
  stageActive:    { backgroundColor: Colors.blue },
  stageNum:       { fontSize: 12, fontWeight: '700', color: Colors.textMid },
  stageName:      { fontSize: 14, color: Colors.textMid },
  stageNameActive:{ color: Colors.dark, fontWeight: '700' },
});