import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, ScrollView, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BubbleBackground from '../components/BubbleBackground';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';
import { supabase } from '../lib/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = ['Extraction', 'Filtration', 'Formulation', 'Formation'];

const OFFLINE_MS = 15000;
const GUARDIAN_OK_MIN = 1500;
const GUARDIAN_OK_MAX = 2500;

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
  status:            'IDLE',
  stage_index:       0,
  elapsed_secs:      0,
  timer_remaining_s: 0,
  timer_elapsed_s:   0,
  substep:           '',
  c1_temp:           0,
  c3_temp:           0,
  c1_heater:         false,
  c1_fan:            false,
  c3_heater:         false,
  c3_fan:            false,
  guardian_volume_ml:   null,
  guardian_distance_cm: null,
  guardian_attempt:     null,
  decision_pending:  null,
  tray_count:        0,
  tray_phase:        null,
  firmware_version:  null,
  last_seen:         null,
  process_log:       [],
};

// ── Demo timeline (used only when Demo Mode is on) ──
// dur > 0 → timed auto-advancing step. dur 0/absent → decision: waits for a button.
const DEMO = [
  { s: 'RUNNING', st: 0, sub: 'Pump1: Water → C1', dur: 6, c1: 29, c3: 28 },
  { s: 'RUNNING', st: 0, sub: 'C1 Mix + Heat',     dur: 7, c1: 58, c3: 28, heat1: true },
  { s: 'OVERRUN', st: 0, sub: 'Temp cutoff',       c1: 76, c3: 31 },
  { s: 'RUNNING', st: 0, sub: 'C1 Cooldown',       dur: 4, c1: 40, c3: 30, fan1: true },
  { s: 'RUNNING', st: 1, sub: 'Pump2: C1 → C2',    dur: 5, c1: 34, c3: 30 },
  { s: 'RUNNING', st: 1, sub: 'Pump3: C2 → C3',    dur: 5, c1: 32, c3: 30 },
  { s: 'GUARDIAN_WAIT', st: 1, sub: 'Volume check', vol: 1820, dist: 11.32, att: 2 },
  { s: 'RUNNING', st: 2, sub: 'Pump4: Glycerin + Guava', dur: 5, c3: 32 },
  { s: 'RUNNING', st: 2, sub: 'C3 Mix + Heat',     dur: 7, c3: 55, heat3: true },
  { s: 'TRAY',    st: 3 },
  { s: 'COMPLETE', st: 3 },
];

// Cleaning timeline — all timed (no decisions), flushes through every stage.
const CLEAN = [
  { st: 0, sub: 'Clean: Pump1 flush',   dur: 4, c1: 45, heat1: true },
  { st: 0, sub: 'Clean: C1 flush',      dur: 4, c1: 45, heat1: true },
  { st: 1, sub: 'Clean: Pump2 flush',   dur: 3 },
  { st: 1, sub: 'Clean: Pump3 flush',   dur: 3 },
  { st: 2, sub: 'Clean: Pump4 flush',   dur: 3 },
  { st: 2, sub: 'Clean: C3 flush',      dur: 4, c3: 45, heat3: true },
  { st: 3, sub: 'Clean: Pump5 → Tray',  dur: 4 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(secs) {
  const v = Math.max(0, Math.floor(secs || 0));
  const h = String(Math.floor(v / 3600)).padStart(2, '0');
  const m = String(Math.floor((v % 3600) / 60)).padStart(2, '0');
  const s = String(v % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusChip({ icon, lib, label, active }) {
  const Icon = lib === 'mci' ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={[styles.chip, active && styles.chipOn]}>
      <Icon name={icon} size={11} color={active ? Colors.white : Colors.textLight} />
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </View>
  );
}

function ActionButton({ label, icon, color, onPress, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[styles.actBtn, { backgroundColor: color }, disabled && styles.dimBtn]}
    >
      <Ionicons name={icon} size={16} color={Colors.white} />
      <Text style={styles.actBtnText}>{label}</Text>
    </TouchableOpacity>
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
              <Text
                style={[styles.stepLabel, active && styles.stepLabelActive, done && styles.stepLabelDone]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
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

function DecisionCard({ machine, send, loading }) {
  const { status } = machine;

  if (status === 'OVERRUN') {
    return (
      <View style={[styles.decisionCard, { borderColor: '#D9534F' }]}>
        <View style={styles.decisionHead}>
          <Ionicons name="warning" size={18} color="#D9534F" />
          <Text style={[styles.decisionTitle, { color: '#D9534F' }]}>Temperature Overrun</Text>
        </View>
        <Text style={styles.decisionBody}>
          Heater was forced off at the 75°C safety cutoff. Let it cool, then resume — or stop the cycle.
        </Text>
        <View style={styles.decisionRow}>
          <Text style={styles.decisionMetric}>C1 {(machine.c1_temp ?? 0).toFixed(1)}°C</Text>
          <Text style={styles.decisionMetric}>C3 {(machine.c3_temp ?? 0).toFixed(1)}°C</Text>
        </View>
        <View style={styles.actRow}>
          <ActionButton label="Resume" icon="play" color="#2A9E97"
            onPress={() => send('resume_overrun')} disabled={loading} />
          <ActionButton label="Stop" icon="stop-circle-outline" color="#B83230"
            onPress={() => send('estop')} disabled={loading} />
        </View>
      </View>
    );
  }

  if (status === 'GUARDIAN_WAIT') {
    const halt = machine.decision_pending === 'guardian_halt';
    const vol  = machine.guardian_volume_ml;
    const inRange = vol != null && vol >= GUARDIAN_OK_MIN && vol <= GUARDIAN_OK_MAX;
    return (
      <View style={[styles.decisionCard, { borderColor: '#F0A030' }]}>
        <View style={styles.decisionHead}>
          <Ionicons name="flask-outline" size={18} color="#F0A030" />
          <Text style={[styles.decisionTitle, { color: '#F0A030' }]}>Volume Check</Text>
        </View>
        <View style={styles.volRow}>
          <View>
            <Text style={styles.volBig}>{vol != null ? `${Math.round(vol)} mL` : '— mL'}</Text>
            <Text style={[styles.volTag, { color: inRange ? Colors.teal : '#D9534F' }]}>
              {inRange ? 'In range' : 'Out of range'}
            </Text>
          </View>
          <View style={styles.volMeta}>
            <Text style={styles.volMetaText}>OK window: {GUARDIAN_OK_MIN}–{GUARDIAN_OK_MAX} mL</Text>
            {machine.guardian_distance_cm != null && (
              <Text style={styles.volMetaText}>Distance: {machine.guardian_distance_cm.toFixed(2)} cm</Text>
            )}
            {machine.guardian_attempt != null && (
              <Text style={styles.volMetaText}>Attempt: {machine.guardian_attempt}/3</Text>
            )}
          </View>
        </View>
        {halt ? (
          <>
            <Text style={styles.decisionBody}>
              Max retries reached. Re-measure, skip the check and proceed anyway, or stop.
            </Text>
            <View style={styles.actRow}>
              <ActionButton label="Retry" icon="refresh" color="#2A9E97"
                onPress={() => send('guardian_retry')} disabled={loading} />
              <ActionButton label="Skip" icon="play-forward-outline" color="#F0A030"
                onPress={() => send('guardian_skip')} disabled={loading} />
              <ActionButton label="Stop" icon="stop-circle-outline" color="#B83230"
                onPress={() => send('estop')} disabled={loading} />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.decisionBody}>Confirm to continue, re-measure the volume, or stop.</Text>
            <View style={styles.actRow}>
              <ActionButton label="Continue" icon="checkmark" color="#2A9E97"
                onPress={() => send('guardian_continue')} disabled={loading} />
              <ActionButton label="Retry" icon="refresh" color="#4A7FD4"
                onPress={() => send('guardian_retry')} disabled={loading} />
              <ActionButton label="Stop" icon="stop-circle-outline" color="#B83230"
                onPress={() => send('estop')} disabled={loading} />
            </View>
          </>
        )}
      </View>
    );
  }

  if (status === 'TRAY_WAIT') {
    const phase = machine.tray_phase || 'waiting';
    return (
      <View style={[styles.decisionCard, { borderColor: '#4A7FD4' }]}>
        <View style={styles.decisionHead}>
          <Ionicons name="grid-outline" size={18} color="#4A7FD4" />
          <Text style={[styles.decisionTitle, { color: '#4A7FD4' }]}>Film Formation — Trays</Text>
        </View>
        <View style={styles.trayRow}>
          <View style={styles.trayStat}>
            <Text style={styles.trayStatNum}>{machine.tray_count ?? 0}</Text>
            <Text style={styles.trayStatLabel}>Trays done</Text>
          </View>
          <View style={styles.trayStat}>
            <Text style={styles.trayStatNum}>{formatTime(machine.timer_elapsed_s)}</Text>
            <Text style={styles.trayStatLabel}>{phase === 'dispensing' ? 'Dispensing' : 'Pump idle'}</Text>
          </View>
        </View>
        {phase === 'waiting' && (
          <View style={styles.actRow}>
            <ActionButton label="Start" icon="play" color="#2A9E97"
              onPress={() => send('tray_start')} disabled={loading} />
            <ActionButton label="End stage" icon="checkmark-done-outline" color="#4A7FD4"
              onPress={() => send('tray_end')} disabled={loading} />
          </View>
        )}
        {phase === 'dispensing' && (
          <View style={styles.actRow}>
            <ActionButton label="Stop pump" icon="pause" color="#D4840A"
              onPress={() => send('tray_stop')} disabled={loading} />
          </View>
        )}
        {phase === 'stopped' && (
          <View style={styles.actRow}>
            <ActionButton label="More" icon="add" color="#2A9E97"
              onPress={() => send('tray_more')} disabled={loading} />
            <ActionButton label="Next tray" icon="arrow-forward" color="#4A7FD4"
              onPress={() => send('tray_next')} disabled={loading} />
            <ActionButton label="End" icon="checkmark-done-outline" color="#2E63B8"
              onPress={() => send('tray_end')} disabled={loading} />
          </View>
        )}
      </View>
    );
  }

  return null;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen({ onLogout }) {
  const [machine, setMachine]   = useState(DEFAULT_STATE);
  const [loading, setLoading]   = useState(false);
  const [now, setNow]           = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [demo, setDemo]         = useState(false);

  const demoRef = useRef(false);
  const dmRef   = useRef({ idx: 0, rem: 0, paused: false, mode: 'idle',
                           trayPhase: 'waiting', trayCount: 0, trayElapsed: 0, cidx: 0, crem: 0 });

  const status      = machine.status || 'IDLE';
  const meta        = STATUS_META[status] ?? STATUS_META.IDLE;
  const isActive    = ACTIVE_STATES.includes(status);
  const isRunning   = status === 'RUNNING';
  const isPaused    = status === 'PAUSED';
  const hasDecision = ['OVERRUN', 'GUARDIAN_WAIT', 'TRAY_WAIT'].includes(status);
  const stageIdx    = status === 'COMPLETE' ? STAGES.length : (machine.stage_index ?? 0);

  const lastSeenMs = machine.last_seen ? new Date(machine.last_seen).getTime() : 0;
  const online     = lastSeenMs > 0 && (now - lastSeenMs) < OFFLINE_MS;

  // ── Live data (skipped while Demo Mode is on) ──
  const fetchStatus = useCallback(async () => {
    if (demoRef.current) return;
    const { data } = await supabase.from('machine_status').select('*').eq('id', 1).single();
    if (data && !demoRef.current) setMachine((prev) => ({ ...DEFAULT_STATE, ...prev, ...data }));
  }, []);

  useEffect(() => {
    fetchStatus();
    const channel = supabase
      .channel('machine_status')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'machine_status' },
        (payload) => { if (!demoRef.current) setMachine((prev) => ({ ...DEFAULT_STATE, ...prev, ...payload.new })); }
      )
      .subscribe();
    const tick = setInterval(() => setNow(Date.now()), 5000);
    return () => { supabase.removeChannel(channel); clearInterval(tick); };
  }, [fetchStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (demoRef.current) demoTick(); else await fetchStatus();
    setNow(Date.now());
    setRefreshing(false);
  }, [fetchStatus]);

  // ── Demo engine ──
  const demoSnap = (over) => ({
    ...DEFAULT_STATE,
    c1_temp: 30, c3_temp: 30,
    firmware_version: 'DEMO',
    last_seen: new Date().toISOString(),
    process_log: ['Demo mode active'],
    ...over,
  });

  const demoTick = useCallback(() => {
    const dm = dmRef.current;
    if (dm.mode === 'estop')  { setMachine(demoSnap({ status: 'ESTOP' })); return; }
    if (dm.mode === 'clean') {
      dm.crem -= 1;
      if (dm.crem < 0) {
        dm.cidx += 1;
        const ns = CLEAN[dm.cidx];
        if (ns) dm.crem = ns.dur; else dm.mode = 'cleandone';
      }
      const cur = CLEAN[dm.cidx];
      if (dm.mode === 'clean' && cur) {
        setMachine(demoSnap({
          status: 'CLEANING', stage_index: cur.st, substep: cur.sub,
          timer_remaining_s: Math.max(0, dm.crem),
          c1_temp: cur.c1 ?? 40, c3_temp: cur.c3 ?? 40,
          c1_heater: !!cur.heat1, c3_heater: !!cur.heat3,
        }));
        return;
      }
    }
    if (dm.mode === 'cleandone') {
      setMachine(demoSnap({ status: 'COMPLETE', stage_index: 3, substep: 'Cleaning complete' }));
      return;
    }
    if (dm.mode === 'idle')   { setMachine(demoSnap({ status: 'IDLE' })); return; }

    let step = DEMO[dm.idx];
    if (step.s === 'TRAY') {
      if (dm.trayPhase === 'dispensing') dm.trayElapsed += 1;
      setMachine(demoSnap({
        status: 'TRAY_WAIT', stage_index: step.st, substep: 'Film formation — trays',
        tray_phase: dm.trayPhase, tray_count: dm.trayCount, timer_elapsed_s: dm.trayElapsed,
      }));
      return;
    }
    if (step.s === 'COMPLETE') { setMachine(demoSnap({ status: 'COMPLETE', stage_index: step.st })); return; }

    if ((step.dur || 0) > 0) {
      if (!dm.paused) {
        dm.rem -= 1;
        if (dm.rem < 0) { dm.idx += 1; const ns = DEMO[dm.idx]; dm.rem = (ns && ns.dur) ? ns.dur : 0; }
      }
      const cur = DEMO[dm.idx];
      setMachine(demoSnap({
        status: dm.paused ? 'PAUSED' : 'RUNNING', stage_index: cur.st, substep: cur.sub,
        timer_remaining_s: Math.max(0, dm.rem),
        c1_temp: cur.c1 ?? 30, c3_temp: cur.c3 ?? 30,
        c1_heater: !!cur.heat1, c3_heater: !!cur.heat3, c1_fan: !!cur.fan1, c3_fan: !!cur.fan3,
      }));
      return;
    }

    // decision step (OVERRUN / GUARDIAN_WAIT)
    setMachine(demoSnap({
      status: step.s, stage_index: step.st, substep: step.sub,
      c1_temp: step.c1 ?? 30, c3_temp: step.c3 ?? 30,
      decision_pending: step.s === 'OVERRUN' ? 'overrun' : 'guardian',
      guardian_volume_ml: step.vol ?? null,
      guardian_distance_cm: step.dist ?? null,
      guardian_attempt: step.att ?? null,
    }));
  }, []);

  const demoCommand = (cmd) => {
    const dm = dmRef.current;
    switch (cmd) {
      case 'start':
        dm.mode = 'run'; dm.idx = 0; dm.rem = DEMO[0].dur; dm.paused = false;
        dm.trayPhase = 'waiting'; dm.trayCount = 0; dm.trayElapsed = 0; break;
      case 'pause':  dm.paused = true; break;
      case 'resume': dm.paused = false; break;
      case 'estop':  dm.mode = 'estop'; break;
      case 'clean':  dm.mode = 'clean'; dm.cidx = 0; dm.crem = CLEAN[0].dur; break;
      case 'resume_overrun':
      case 'guardian_continue':
      case 'guardian_skip':
        dm.idx += 1; dm.rem = DEMO[dm.idx].dur || 0; break;
      case 'guardian_retry': break;
      case 'tray_start': dm.trayPhase = 'dispensing'; dm.trayElapsed = 0; break;
      case 'tray_stop':  dm.trayPhase = 'stopped'; break;
      case 'tray_more':  dm.trayPhase = 'dispensing'; break;
      case 'tray_next':  dm.trayCount += 1; dm.trayPhase = 'waiting'; dm.trayElapsed = 0; break;
      case 'tray_end':   dm.idx = DEMO.findIndex((s) => s.s === 'COMPLETE'); break;
      default: break;
    }
    demoTick();
  };

  useEffect(() => {
    if (!demo) return;
    const id = setInterval(demoTick, 1000);
    return () => clearInterval(id);
  }, [demo, demoTick]);

  const toggleDemo = () => {
    const on = !demo;
    demoRef.current = on;
    setDemo(on);
    if (on) {
      dmRef.current = { idx: 0, rem: 0, paused: false, mode: 'idle',
                        trayPhase: 'waiting', trayCount: 0, trayElapsed: 0, cidx: 0, crem: 0 };
      demoTick();
    } else {
      fetchStatus();
    }
  };

  // ── Command router ──
  const sendCommand = async (command) => {
    if (demoRef.current) { demoCommand(command); return; }
    setLoading(true);
    await supabase.from('machine_commands').insert({ command });
    setLoading(false);
  };

  const BUTTONS = [
    { label: 'Start', icon: 'play', colors: ['#3DBFB8', '#2A9E97'],
      onPress: () => sendCommand('start'), disabled: isActive || loading },
    { label: isPaused ? 'Resume' : 'Pause', icon: isPaused ? 'play-circle-outline' : 'pause',
      colors: ['#F0A030', '#D4840A'], onPress: () => sendCommand(isPaused ? 'resume' : 'pause'),
      disabled: !(isRunning || isPaused) || loading },
    { label: 'E-Stop', icon: 'stop-circle-outline', colors: ['#D9534F', '#B83230'],
      onPress: () => sendCommand('estop'), disabled: !isActive || loading },
    { label: 'Clean', icon: 'water-outline', colors: ['#4A7FD4', '#2E63B8'],
      onPress: () => sendCommand('clean'), disabled: isActive || loading },
  ];

  const showSubstep   = isActive && !!machine.substep;
  const logEntries    = Array.isArray(machine.process_log) ? machine.process_log : [];

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
            <Text style={styles.onlineText}>{online ? (demo ? 'Demo' : 'Online') : 'Offline'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={16} color={Colors.white} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} colors={[Colors.teal]} />
        }
      >

        {hasDecision && <DecisionCard machine={machine} send={sendCommand} loading={loading} />}

        {/* ── Status + Stage + Temps + Log ── */}
        <View style={Theme.card}>
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
              <Text style={styles.timerText}>{formatTime(isActive && (machine.timer_remaining_s ?? 0) > 0 ? machine.timer_remaining_s : machine.elapsed_secs)}</Text>
            </View>
          </View>

          {showSubstep && (
            <View style={styles.substepRow}>
              <View style={styles.substepLeft}>
                <Ionicons name="ellipse" size={7} color={meta.color} />
                <Text style={styles.substepText} numberOfLines={1}>{machine.substep}</Text>
              </View>
            </View>
          )}

          <View style={styles.stepperWrap}>
            <StageStepper stageIdx={stageIdx} isActive={isActive} />
          </View>

          <View style={styles.divider} />

          <View style={Theme.row}>
            <View style={styles.tempBlock}>
              <View style={styles.tempLabelRow}>
                <Ionicons name="thermometer-outline" size={13} color={Colors.textMid} />
                <Text style={Theme.cardLabel}>C1 Temp</Text>
              </View>
              <Text style={styles.tempText}>{(machine.c1_temp ?? 0).toFixed(1)}°C</Text>
              <View style={styles.chipRow}>
                <StatusChip icon="flame" label="Heat" active={machine.c1_heater} />
                <StatusChip icon="fan" lib="mci" label="Fan" active={machine.c1_fan} />
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
                <StatusChip icon="fan" lib="mci" label="Fan" active={machine.c3_fan} />
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={Theme.cardLabelRow}>
            <Ionicons name="document-text-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>Process Log</Text>
          </View>
          {!online && !demo && (
            <Text style={styles.logStale}>Machine offline — showing last received data.</Text>
          )}
          <View style={styles.logList}>
            {logEntries.length === 0 ? (
              <Text style={styles.logEmpty}>No activity yet.</Text>
            ) : (
              logEntries.map((entry, i) => (
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
          <View style={styles.cardHeadRow}>
            <View style={Theme.cardLabelRow}>
              <Ionicons name="flash-outline" size={13} color={Colors.textMid} />
              <Text style={Theme.cardLabel}>Machine Control</Text>
            </View>
            <TouchableOpacity
              onPress={toggleDemo}
              activeOpacity={0.8}
              style={[styles.demoPill, demo ? styles.demoOn : styles.demoOff]}
            >
              <Ionicons name={demo ? 'flask' : 'flask-outline'} size={12}
                color={demo ? Colors.white : Colors.textMid} />
              <Text style={[styles.demoText, demo && { color: Colors.white }]}>Demo</Text>
            </TouchableOpacity>
          </View>

          {demo && (
            <Text style={styles.demoHint}>
              Demo Mode on — simulating the machine. Tap Start, then use the cards to step through the run.
            </Text>
          )}

          <View style={styles.buttonGrid}>
            {BUTTONS.map((btn) => (
              <TouchableOpacity
                key={btn.label}
                onPress={btn.onPress}
                disabled={btn.disabled}
                activeOpacity={0.8}
                style={[styles.btnWrap, btn.disabled && styles.dimBtn]}
              >
                <LinearGradient colors={btn.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
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

  cardHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  demoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  demoOff: { backgroundColor: Colors.inputBg },
  demoOn:  { backgroundColor: Colors.blue },
  demoText: { fontSize: 11, fontWeight: '700', color: Colors.textMid },
  demoHint: { fontSize: 11, color: Colors.textMid, lineHeight: 16, marginTop: 8, marginBottom: 2 },

  decisionCard: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 16,
    borderLeftWidth: 5, elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  decisionHead:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  decisionTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  decisionBody:  { fontSize: 12, color: Colors.textMid, lineHeight: 18, marginBottom: 12 },
  decisionRow:   { flexDirection: 'row', gap: 16, marginBottom: 12 },
  decisionMetric:{ fontSize: 13, fontWeight: '700', color: Colors.dark },

  volRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  volBig:      { fontSize: 26, fontWeight: '900', color: Colors.dark },
  volTag:      { fontSize: 12, fontWeight: '800', marginTop: 2 },
  volMeta:     { alignItems: 'flex-end', gap: 3 },
  volMetaText: { fontSize: 11, color: Colors.textMid, fontWeight: '600' },

  trayRow:       { flexDirection: 'row', gap: 12, marginBottom: 14 },
  trayStat:      { flex: 1, backgroundColor: Colors.inputBg, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  trayStatNum:   { fontSize: 22, fontWeight: '900', color: Colors.blue, letterSpacing: 1 },
  trayStatLabel: { fontSize: 11, color: Colors.textMid, fontWeight: '600', marginTop: 2 },

  actRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    flexGrow: 1, flexBasis: 0, minWidth: 90, paddingVertical: 11, borderRadius: 12,
  },
  actBtnText: { color: Colors.white, fontWeight: '700', fontSize: 12 },

  statusRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  statusLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  statusDot:      { width: 10, height: 10, borderRadius: 5 },
  statusText:     { fontSize: 30, fontWeight: '900', letterSpacing: 0.5 },
  statusDesc:     { fontSize: 12, color: Colors.textMid, marginLeft: 18 },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.inputBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
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
  stepItem:        { alignItems: 'center', flex: 1, paddingHorizontal: 1 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.inputBg,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  stepDone:        { backgroundColor: Colors.teal },
  stepActive:      { backgroundColor: Colors.blue },
  stepNum:         { fontSize: 11, fontWeight: '700', color: Colors.textMid },
  stepLine:        { width: 14, height: 2, backgroundColor: Colors.inputBg, marginBottom: 18, marginHorizontal: 1 },
  stepLineDone:    { backgroundColor: Colors.teal },
  stepLabel:       { fontSize: 10, color: Colors.textLight, fontWeight: '600', textAlign: 'center', width: '100%' },
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
    backgroundColor: Colors.inputBg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  chipOn:      { backgroundColor: Colors.statusRunning },
  chipText:    { fontSize: 10, color: Colors.textLight, fontWeight: '600' },
  chipTextOn:  { color: Colors.white },

  logStale:      { fontSize: 11, color: Colors.textLight, fontStyle: 'italic', marginBottom: 8 },
  logList:       { gap: 8 },
  logEmpty:      { fontSize: 12, color: Colors.textLight, fontStyle: 'italic' },
  logRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  logDot:        { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.inputBg, marginTop: 5, flexShrink: 0 },
  logDotActive:  { backgroundColor: Colors.teal },
  logText:       { fontSize: 12, color: Colors.textMid, lineHeight: 18, flex: 1 },
  logTextActive: { color: Colors.dark, fontWeight: '600' },

  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  btnWrap:    { width: '47%', borderRadius: 18, overflow: 'hidden', elevation: 8 },
  btn:        { paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText:    { color: Colors.white, fontWeight: '700', fontSize: 12 },
  dimBtn:     { opacity: 0.35 },
  fwText:     { fontSize: 10, color: Colors.textLight, textAlign: 'center', marginTop: 12 },
});