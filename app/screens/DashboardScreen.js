import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BubbleBackground from '../components/BubbleBackground';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';
import { supabase } from '../lib/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = ['Extraction', 'Filtration', 'Formulation', 'Formation'];

const OFFLINE_MS = 15000; // no status push for 15s → machine considered offline

// Status colors are screen-local config (same pattern as button gradients below).
const STATUS_META = {
  IDLE:          { color: Colors.statusIdle,    label: 'Idle',     desc: 'Machine is ready'        },
  RUNNING:       { color: Colors.statusRunning, label: 'Running',  desc: 'Process in progress'     },
  PAUSED:        { color: Colors.statusPaused,  label: 'Paused',   desc: 'Process paused'          },
  CLEANING:      { color: Colors.statusClean,   label: 'Cleaning', desc: 'Cleaning cycle active'   },
  OVERRUN:       { color: '#D9534F',            label: 'Overrun',  desc: 'Temperature cutoff — waiting' },
  GUARDIAN_WAIT: { color: '#F0A030',            label: 'Volume Check', desc: 'Waiting for confirmation' },
  TRAY_WAIT:     { color: '#4A7FD4',            label: 'Dispensing',   desc: 'Film formation — trays'   },
  COMPLETE:      { color: Colors.teal,          label: 'Complete', desc: 'Cycle finished'          },
  ESTOP:         { color: '#B83230',            label: 'Stopped',  desc: 'Emergency stop triggered' },
};

const ACTIVE_STATES = ['RUNNING', 'PAUSED', 'CLEANING', 'OVERRUN', 'GUARDIAN_WAIT', 'TRAY_WAIT'];

const DEFAULT_STATE = {
  status:           'IDLE',
  stage_index:      0,
  elapsed_secs:     0,
  timer_remaining_s: 0,
  substep:          '',
  c1_temp:          0,
  c3_temp:          0,
  c1_heater:        false,
  c1_fan:           false,
  c3_heater:        false,
  c3_fan:           false,
  tray_count:       0,
  decision_pending: null,
  firmware_version: null,
  last_seen:        null,
  process_log:      [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(secs) {
  const v = Math.max(0, Math.floor(secs || 0));
  const h = String(Math.floor(v / 3600)).padStart(2, '0');
  const m = String(Math.floor((v % 3600) / 60)).padStart(2, '0');
  const s = String(v % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusChip({ icon, label, active }) {
  return (
    <View style={[styles.chip, active && styles.chipOn]}>
      <Ionicons name={icon} size={11} color={active ? Colors.white : Colors.textLight} />
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </View>
  );
}

function StageStepper({ stageIdx, isActive }) {
  return (
    <View style={styles.stepperRow}>
      {STAGES.map((stage, i) => {
        const done   = i < stageIdx;
        const active = i === stageIdx && isActive;
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
  const [machine, setMachine] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [now, setNow]         = useState(Date.now());

  const status     = machine.status || 'IDLE';
  const meta       = STATUS_META[status] ?? STATUS_META.IDLE;
  const isActive   = ACTIVE_STATES.includes(status);
  const isRunning  = status === 'RUNNING';
  const isPaused   = status === 'PAUSED';

  // COMPLETE → mark every stage as done
  const stageIdx = status === 'COMPLETE' ? STAGES.length : (machine.stage_index ?? 0);

  // Online = a recent status push exists
  const lastSeenMs = machine.last_seen ? new Date(machine.last_seen).getTime() : 0;
  const online     = lastSeenMs > 0 && (now - lastSeenMs) < OFFLINE_MS;

  // ── Fetch + subscribe ──
  useEffect(() => {
    fetchStatus();

    const channel = supabase
      .channel('machine_status')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'machine_status' },
        (payload) => setMachine((prev) => ({ ...DEFAULT_STATE, ...prev, ...payload.new }))
      )
      .subscribe();

    // tick so the online/offline pill re-evaluates without a new push
    const tick = setInterval(() => setNow(Date.now()), 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(tick);
    };
  }, []);

  const fetchStatus = async () => {
    const { data } = await supabase
      .from('machine_status')
      .select('*')
      .eq('id', 1)
      .single();
    if (data) setMachine((prev) => ({ ...DEFAULT_STATE, ...prev, ...data }));
  };

  // ── Send command ──
  const sendCommand = async (command) => {
    setLoading(true);
    await supabase.from('machine_commands').insert({ command });
    setLoading(false);
  };

  const BUTTONS = [
    {
      label:    'Start',
      icon:     'play',
      colors:   ['#3DBFB8', '#2A9E97'],
      onPress:  () => sendCommand('start'),
      disabled: isActive || loading,
    },
    {
      label:    isPaused ? 'Resume' : 'Pause',
      icon:     isPaused ? 'play-circle-outline' : 'pause',
      colors:   ['#F0A030', '#D4840A'],
      onPress:  () => sendCommand(isPaused ? 'resume' : 'pause'),
      disabled: !(isRunning || isPaused) || loading,
    },
    {
      label:    'E-Stop',
      icon:     'stop-circle-outline',
      colors:   ['#D9534F', '#B83230'],
      onPress:  () => sendCommand('estop'),
      disabled: !isActive || loading,
    },
    {
      label:    'Clean',
      icon:     'water-outline',
      colors:   ['#4A7FD4', '#2E63B8'],
      onPress:  () => sendCommand('clean'),
      disabled: isActive || loading,
    },
  ];

  const showSubstep   = isActive && !!machine.substep;
  const showRemaining = isActive && (machine.timer_remaining_s ?? 0) > 0;

  return (
    <BubbleBackground>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={Theme.row}>
          <Image source={require('../../assets/BIOFISH_LOGO_2026.png')} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>BIO-FISH</Text>
        </View>
        <View style={Theme.row}>
          <View style={[styles.onlinePill, online ? styles.onlineOn : styles.onlineOff]}>
            <View style={[styles.onlineDot, { backgroundColor: online ? '#3DBFB8' : Colors.textLight }]} />
            <Text style={styles.onlineText}>{online ? 'Online' : 'Offline'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={16} color={Colors.white} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Status + Stage + Temps + Log ── */}
        <View style={Theme.card}>

          {/* Status row */}
          <View style={styles.statusRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.statusLabelRow}>
                <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
                <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
              </View>
              <Text style={styles.statusDesc}>{meta.desc}</Text>
            </View>
            <View style={styles.timerBadge}>
              <Ionicons name="timer-outline" size={12} color={Colors.textMid} />
              <Text style={styles.timerText}>{formatTime(machine.elapsed_secs)}</Text>
            </View>
          </View>

          {/* Sub-step + per-step countdown */}
          {(showSubstep || showRemaining) && (
            <View style={styles.substepRow}>
              {showSubstep && (
                <View style={styles.substepLeft}>
                  <Ionicons name="ellipse" size={7} color={meta.color} />
                  <Text style={styles.substepText} numberOfLines={1}>{machine.substep}</Text>
                </View>
              )}
              {showRemaining && (
                <View style={styles.remainBadge}>
                  <Ionicons name="hourglass-outline" size={11} color={Colors.textMid} />
                  <Text style={styles.remainText}>{formatTime(machine.timer_remaining_s)}</Text>
                </View>
              )}
            </View>
          )}

          {/* Stage stepper */}
          <View style={styles.stepperWrap}>
            <StageStepper stageIdx={stageIdx} isActive={isActive} />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Temperatures */}
          <View style={Theme.row}>
            <View style={styles.tempBlock}>
              <View style={styles.tempLabelRow}>
                <Ionicons name="thermometer-outline" size={13} color={Colors.textMid} />
                <Text style={Theme.cardLabel}>C1 Temp</Text>
              </View>
              <Text style={styles.tempText}>{(machine.c1_temp ?? 0).toFixed(1)}°C</Text>
              <View style={styles.chipRow}>
                <StatusChip icon="flame" label="Heat" active={machine.c1_heater} />
                <StatusChip icon="partly-sunny-outline" label="Fan" active={machine.c1_fan} />
              </View>
            </View>

            <View style={styles.tempDivider} />

            <View style={styles.tempBlock}>
              <View style={styles.tempLabelRow}>
                <Ionicons name="thermometer-outline" size={13} color={Colors.textMid} />
                <Text style={Theme.cardLabel}>C3 Temp</Text>
              </View>
              <Text style={styles.tempText}>{(machine.c3_temp ?? 0).toFixed(1)}°C</Text>
              <View style={styles.chipRow}>
                <StatusChip icon="flame" label="Heat" active={machine.c3_heater} />
                <StatusChip icon="partly-sunny-outline" label="Fan" active={machine.c3_fan} />
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Process Log */}
          <View style={Theme.cardLabelRow}>
            <Ionicons name="document-text-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>Process Log</Text>
          </View>
          <View style={styles.logList}>
            {(!machine.process_log || machine.process_log.length === 0) ? (
              <Text style={styles.logEmpty}>No activity yet.</Text>
            ) : (
              machine.process_log.map((entry, i) => (
                <View key={i} style={styles.logRow}>
                  <View style={[styles.logDot, i === 0 && styles.logDotActive]} />
                  <Text style={[styles.logText, i === 0 && styles.logTextActive]}>{entry}</Text>
                </View>
              ))
            )}
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
                  <Ionicons name={btn.icon} size={22} color={Colors.white} />
                  <Text style={styles.btnText}>{btn.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
          {machine.firmware_version ? (
            <Text style={styles.fwText}>Firmware {machine.firmware_version}</Text>
          ) : null}
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

  onlinePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, marginRight: 8,
  },
  onlineOn:   { backgroundColor: 'rgba(61,191,184,0.22)' },
  onlineOff:  { backgroundColor: 'rgba(255,255,255,0.12)' },
  onlineDot:  { width: 7, height: 7, borderRadius: 4 },
  onlineText: { color: Colors.white, fontSize: 11, fontWeight: '700' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  logoutText: { color: Colors.white, fontSize: 13, fontWeight: '600' },

  scroll: { padding: 16, paddingBottom: 120, gap: 14 },

  statusRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  statusLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  statusDot:      { width: 10, height: 10, borderRadius: 5 },
  statusText:     { fontSize: 30, fontWeight: '900', letterSpacing: 0.5 },
  statusDesc:     { fontSize: 12, color: Colors.textMid, marginLeft: 18 },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.inputBg, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  timerText: { fontSize: 13, fontWeight: '700', color: Colors.dark, letterSpacing: 1 },

  substepRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.inputBg, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8, marginBottom: 14, gap: 8,
  },
  substepLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  substepText: { fontSize: 12, fontWeight: '600', color: Colors.dark, flex: 1 },
  remainBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  remainText:  { fontSize: 12, fontWeight: '700', color: Colors.textMid, letterSpacing: 1 },

  stepperWrap:     { marginTop: 2 },
  stepperRow:      { flexDirection: 'row', alignItems: 'center' },
  stepItem:        { alignItems: 'center', flex: 1 },
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

  divider:     { height: 1, backgroundColor: Colors.inputBg, marginVertical: 14 },
  tempDivider: { width: 1, backgroundColor: Colors.inputBg, marginHorizontal: 8, alignSelf: 'stretch' },
  tempBlock:    { flex: 1 },
  tempLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  tempText:     { fontSize: 20, fontWeight: '900', color: Colors.blue, marginBottom: 8 },
  chipRow:      { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.inputBg, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  chipOn:      { backgroundColor: Colors.statusRunning },
  chipText:    { fontSize: 10, color: Colors.textLight, fontWeight: '600' },
  chipTextOn:  { color: Colors.white },

  logList:       { gap: 8 },
  logEmpty:      { fontSize: 12, color: Colors.textLight, fontStyle: 'italic' },
  logRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  logDot:        { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.inputBg, marginTop: 5, flexShrink: 0 },
  logDotActive:  { backgroundColor: Colors.teal },
  logText:       { fontSize: 12, color: Colors.textMid, lineHeight: 18, flex: 1 },
  logTextActive: { color: Colors.dark, fontWeight: '600' },

  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  btnWrap:    { width: '47%', borderRadius: 18, overflow: 'hidden', elevation: 8 },
  btn:        { paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText:    { color: Colors.white, fontWeight: '700', fontSize: 12 },
  dimBtn:     { opacity: 0.35 },
  fwText:     { fontSize: 10, color: Colors.textLight, textAlign: 'center', marginTop: 12 },
});
