import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BubbleBackground from '../components/BubbleBackground';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';

// ─── Data ─────────────────────────────────────────────────────────────────────

const HOW_TO_USE = [
  { step: '1', title: 'Power On',        desc: 'Turn on the BIO-FISH machine and wait for it to initialize.' },
  { step: '2', title: 'Configure',       desc: 'Go to Settings and set your parameters (water volume, temp, glycerin %, etc.).' },
  { step: '3', title: 'Start Cycle',     desc: 'Tap Start on the Dashboard. The machine runs 4 stages automatically.' },
  { step: '4', title: 'Monitor',         desc: 'Watch live temp, timer, and LCD display on the Dashboard.' },
  { step: '5', title: 'Collect Output',  desc: 'After Stage 4 (Formation), collect the bioplastic sheet from the tray.' },
  { step: '6', title: 'Clean',           desc: 'Tap Clean after every cycle to flush all pumps.' },
];

const FAQS = [
  {
    q: 'What does each stage do?',
    a: 'Stage 1 (Extraction) heats fish scales in water to extract gelatin. Stage 2 (Filtration) transfers the liquid through filters. Stage 3 (Formulation) adds glycerin and mixes. Stage 4 (Formation) pours the mixture into the tray.',
  },
  {
    q: 'Can I pause mid-cycle?',
    a: 'Yes. Tap Pause on the Dashboard. The machine halts the current step and resumes from where it left off when you tap Resume.',
  },
  {
    q: 'What is the Clean mode?',
    a: 'Clean mode runs water through all 5 pumps sequentially to flush residue. Always run it after a completed cycle.',
  },
  {
    q: 'What does the ultrasonic sensor do?',
    a: 'It checks the liquid volume in Container 3 before the glycerin pump fires. If volume is out of range (1900–2500 mL), it retries 3 times before halting.',
  },
  {
    q: 'What if the machine stops unexpectedly?',
    a: 'Check the LCD display on the Dashboard for the last known status. Press Stop to reset, then restart the cycle.',
  },
];

const TROUBLESHOOT = [
  { problem: 'Machine not responding',   solution: 'Check WiFi connection. Make sure the ESP32 is powered and connected.' },
  { problem: 'Temperature not rising',   solution: 'Check heater relay. Ensure max temp in Settings is above room temperature.' },
  { problem: 'Volume check failing',     solution: 'Confirm liquid reached Container 3. Check ultrasonic sensor positioning.' },
  { problem: 'Pump not running',         solution: 'Verify relay wiring. Check that the correct pump pin is connected.' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function AccordionItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.accordionItem}>
      <TouchableOpacity style={styles.accordionHeader} onPress={() => setOpen(v => !v)} activeOpacity={0.8}>
        <Text style={styles.accordionQ}>{question}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMid} />
      </TouchableOpacity>
      {open && <Text style={styles.accordionA}>{answer}</Text>}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HelpScreen() {
  return (
    <BubbleBackground>
      <View style={styles.header}>
        <Text style={Theme.sectionHeader}>Help & Guide</Text>
        <Text style={Theme.sectionSub}>How to use BIO-FISH</Text>
      </View>

      <ScrollView contentContainerStyle={Theme.scrollContent} showsVerticalScrollIndicator={false}>

        {/* How to Use */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="book-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>How to Use</Text>
          </View>
          {HOW_TO_USE.map((item, i) => (
            <View key={item.step} style={[styles.stepRow, i === HOW_TO_USE.length - 1 && { marginBottom: 0 }]}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNum}>{item.step}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={styles.stepDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* FAQ */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="help-circle-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>FAQ</Text>
          </View>
          {FAQS.map((item, i) => (
            <AccordionItem key={i} question={item.q} answer={item.a} />
          ))}
        </View>

        {/* Troubleshooting */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="build-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>Troubleshooting</Text>
          </View>
          {TROUBLESHOOT.map((item, i) => (
            <View key={i} style={[styles.troubleRow, i === TROUBLESHOOT.length - 1 && { marginBottom: 0 }]}>
              <View style={styles.troubleHeader}>
                <Ionicons name="warning-outline" size={14} color={Colors.statusPaused} />
                <Text style={styles.troubleProblem}>{item.problem}</Text>
              </View>
              <Text style={styles.troubleSolution}>{item.solution}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </BubbleBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },

  stepRow: {
    flexDirection: 'row', gap: 14, marginBottom: 16, alignItems: 'flex-start',
  },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.inputBg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.teal,
  },
  stepNum:     { fontSize: 13, fontWeight: '800', color: Colors.dark },
  stepContent: { flex: 1 },
  stepTitle:   { fontSize: 14, fontWeight: '700', color: Colors.dark, marginBottom: 2 },
  stepDesc:    { fontSize: 12, color: Colors.textMid, lineHeight: 18 },

  accordionItem: {
    borderBottomWidth: 1, borderBottomColor: Colors.inputBg, paddingVertical: 12,
  },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accordionQ:      { fontSize: 13, fontWeight: '700', color: Colors.dark, flex: 1, paddingRight: 8 },
  accordionA:      { fontSize: 12, color: Colors.textMid, lineHeight: 18, marginTop: 8 },

  troubleRow: { marginBottom: 14 },
  troubleHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  troubleProblem: { fontSize: 13, fontWeight: '700', color: Colors.dark },
  troubleSolution:{ fontSize: 12, color: Colors.textMid, lineHeight: 18 },
});