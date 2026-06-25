import React, { useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BubbleBackground from '../components/BubbleBackground';
import AppHeader from '../components/AppHeader';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';

// Photos — files must exist in assets/ with these exact names.
const MACHINE_IMG = require('../../assets/BIOFISH_MACHINE.jpg');
const SHEET_IMG    = require('../../assets/BIOFISH_SHEET.jpg');
const COMPOST_IMG  = require('../../assets/BIOFISH_COMPOST.jpg');

const STAGES = [
  {
    n: '1', name: 'Extraction', icon: 'flame-outline',
    text: 'Cleaned fish scales are heated in water inside Container 1. Controlled heat releases gelatin — a protein — from the scales into the liquid.',
  },
  {
    n: '2', name: 'Filtration', icon: 'funnel-outline',
    text: 'The gelatin liquid is pumped through filters into the next container, separating it from leftover scale solids.',
  },
  {
    n: '3', name: 'Formulation', icon: 'flask-outline',
    text: 'Glycerin (a food-safe plasticizer, E422) is added and mixed with heat. It bonds with the gelatin so the final film is flexible instead of brittle.',
  },
  {
    n: '4', name: 'Film Formation', icon: 'grid-outline',
    text: 'The mixture is dispensed into trays and left to set. As it dries, it forms thin bioplastic sheets ready to peel.',
  },
];

function Photo({ source, caption, icon, height = 220 }) {
  return (
    <View style={styles.photoWrap}>
      {source ? (
        <Image source={source} style={[styles.photo, { height }]} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Ionicons name={icon} size={34} color={Colors.textLight} />
          <Text style={styles.placeholderText}>Photo coming soon</Text>
        </View>
      )}
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

export default function LearnScreen({ onLogout }) {
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 900;
  return (
    <BubbleBackground>
      <AppHeader title="Learn"
      subtitle="About BIO-FISH" onLogout={onLogout} channelKey="online-learn" />

      <ScrollView contentContainerStyle={Theme.scrollContent} showsVerticalScrollIndicator={Platform.OS === 'web'}>

        <View style={styles.pageWrap}>
        <View style={[styles.colsWrap, isWide && styles.colsRow]}>

        <View style={isWide ? styles.col : styles.colFull}>

        {/* What is BIO-FISH */}
        <View style={Theme.card}>
          <Photo source={MACHINE_IMG} caption="The BIO-FISH machine" icon="hardware-chip-outline" />
          <Text style={styles.lead}>
            BIO-FISH turns fish scales — a common market waste — into biodegradable plastic sheets.
            An ESP32 microcontroller runs the whole process automatically across four stages, using
            sensors and timed logic to control temperature, pumps, and duration with little manual work.
          </Text>
        </View>

        {/* What the app does for the machine */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="hardware-chip-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>What This App Does for the Machine</Text>
          </View>
          <Text style={styles.bodyText}>
            The BIO-FISH machine can run on its own — it has an LCD screen and two physical buttons
            for basic operation. The app extends that by giving you remote visibility and control
            from anywhere, without needing to be physically next to the machine.
          </Text>
          {[
            {
              icon: 'send-outline',
              title: 'Remote commands',
              desc: 'Start, Pause, Emergency Stop, and Clean can be triggered from your phone through the internet — no need to press the physical buttons on the machine.',
            },
            {
              icon: 'settings-outline',
              title: 'Settings sync',
              desc: 'Parameters like water volume, temperature targets, mix time, and glycerin percentage can be adjusted from the app and synced to the machine — no manual reconfiguration on the device needed.',
            },
            {
              icon: 'wifi-outline',
              title: 'Live status over WiFi',
              desc: 'When connected, the machine pushes its temperatures, stage, and actuator states to the cloud every few seconds — giving the app a live view of what the LCD shows locally.',
            },
          ].map((item, i) => (
            <View key={i} style={styles.useRow}>
              <View style={styles.useIcon}>
                <Ionicons name={item.icon} size={18} color={Colors.blue} />
              </View>
              <View style={styles.useBody}>
                <Text style={styles.useTitle}>{item.title}</Text>
                <Text style={styles.useDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* What the app does for users */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="person-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>What This App Does for You</Text>
          </View>
          <Text style={styles.bodyText}>
            You do not need to stand next to the machine while it runs. The app lets you monitor
            and control the entire production cycle from your phone or any web browser.
          </Text>
          {[
            {
              icon: 'pulse-outline',
              title: 'Live monitoring',
              desc: 'Watch temperatures, the active stage, heater and fan state, and a running process log — all updating in real time while the machine works.',
            },
            {
              icon: 'play-circle-outline',
              title: 'Full remote control',
              desc: 'Start a production cycle, pause it mid-run, trigger an emergency stop, or run a cleaning flush — all without touching the machine.',
            },
            {
              icon: 'flask-outline',
              title: 'Demo Mode',
              desc: 'No machine available? Demo Mode simulates a full production run inside the app so you can learn how the process works or demonstrate the system to others.',
            },
            {
              icon: 'options-outline',
              title: 'Adjustable parameters',
              desc: 'Change water volume, max temperature, mix time, glycerin percentage, and more from the Settings tab. Changes sync to the machine automatically.',
            },
            {
              icon: 'lock-closed-outline',
              title: 'Shared PIN access',
              desc: 'One PIN protects the controls. The whole team shares it — no accounts needed. The PIN can be changed from Settings and takes effect for everyone immediately.',
            },
          ].map((item, i) => (
            <View key={i} style={styles.useRow}>
              <View style={styles.useIcon}>
                <Ionicons name={item.icon} size={18} color={Colors.blue} />
              </View>
              <View style={styles.useBody}>
                <Text style={styles.useTitle}>{item.title}</Text>
                <Text style={styles.useDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>


        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="git-branch-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>How It Works</Text>
          </View>
          {STAGES.map((s, i) => (
            <View key={s.n} style={[styles.stageRow, i === STAGES.length - 1 && { marginBottom: 0 }]}>
              <View style={styles.stageIconCol}>
                <View style={styles.stageCircle}>
                  <Text style={styles.stageNum}>{s.n}</Text>
                </View>
                {i < STAGES.length - 1 && <View style={styles.stageConnector} />}
              </View>
              <View style={styles.stageBody}>
                <View style={styles.stageTitleRow}>
                  <Ionicons name={s.icon} size={15} color={Colors.blue} />
                  <Text style={styles.stageName}>{s.name}</Text>
                </View>
                <Text style={styles.stageText}>{s.text}</Text>
              </View>
            </View>
          ))}
        </View>

        </View>

        {/* ── right column ── */}
        <View style={isWide ? styles.col : styles.colFull}>

        {/* The output */}
        <View style={Theme.card}>
          <Photo source={SHEET_IMG} caption="A finished bioplastic sheet" icon="documents-outline" />
          <Text style={styles.bodyText}>
            The result is a thin, flexible film made entirely from gelatin and glycerin — no
            fossil-fuel plastic. It breaks down naturally, unlike conventional plastic.
          </Text>
        </View>

        {/* Uses of bioplastic film */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="cube-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>What It Can Be Used For</Text>
          </View>
          <Text style={styles.bodyText}>
            The bioplastic film produced by BIO-FISH is a thin, flexible sheet that can replace
            conventional single-use plastic in real-world packaging applications.
          </Text>

          <Photo source={COMPOST_IMG} caption="Compost bag packaged using BIO-FISH bioplastic film — produced in collaboration with CEMO, City Government of Marikina" icon="bag-outline" height={350} />

          {[
            {
              icon: 'bag-outline', title: 'Packaging',
              desc: 'The BIO-FISH film was used to package compost bags produced by CEMO — the City Environment and Management Office of the City Government of Marikina. The label reads: "Packaged using Fish Scale-Based Bioplastic Film by BIO-FISH, BIO-FISH Research Team, Polytechnic University of the Philippines, AY 2025–2026."',
            },
            {
              icon: 'refresh-outline', title: 'Waste Valorization',
              desc: 'Made entirely from fish scale waste — a byproduct discarded daily at public markets — turning a sanitation problem into a recoverable community resource.',
            },
          ].map((item, i) => (
            <View key={i} style={styles.useRow}>
              <View style={styles.useIcon}>
                <Ionicons name={item.icon} size={18} color={Colors.blue} />
              </View>
              <View style={styles.useBody}>
                <Text style={styles.useTitle}>{item.title}</Text>
                <Text style={styles.useDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* DOST-ITDI Test Results */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="flask-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>Official Test Results</Text>
          </View>
          <Text style={styles.bodyText}>
            BIO-FISH bioplastic films were submitted to the DOST Industrial Technology Development
            Institute (ITDI), Standards and Testing Division, and tested under official ASTM methods
            in May 2026 (TSR No. ITDI-042026-PPT-0249).
          </Text>

          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>15.6</Text>
              <Text style={styles.statLabel}>{`MPa
Tensile Strength`}</Text>
              <Text style={styles.statCite}>ASTM D882</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>30.1%</Text>
              <Text style={styles.statLabel}>{`Elongation
at Break`}</Text>
              <Text style={styles.statCite}>ASTM D882</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>~220</Text>
              <Text style={styles.statLabel}>{`MPa
Secant Modulus`}</Text>
              <Text style={styles.statCite}>ASTM D882</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>406.7%</Text>
              <Text style={styles.statLabel}>{`Water Absorption
(24h immersion)`}</Text>
              <Text style={styles.statCite}>ASTM D570</Text>
            </View>
          </View>

          <View style={styles.explainBox}>
            <Text style={styles.explainRow}><Text style={styles.explainKey}>15.6 MPa tensile strength</Text> — how much force the film can handle before tearing. Higher = stronger.</Text>
            <Text style={styles.explainRow}><Text style={styles.explainKey}>30.1% elongation</Text> — how far the film stretches before it breaks. Higher = more flexible.</Text>
            <Text style={styles.explainRow}><Text style={styles.explainKey}>~220 MPa secant modulus</Text> — how stiff the film is under load. Higher = less stretchy at rest.</Text>
            <Text style={styles.explainRow}><Text style={styles.explainKey}>406.7% water absorption</Text> — the film absorbs a lot of water (expected for gelatin). Limit use in wet conditions.</Text>
          </View>
          <Text style={styles.bodyText}>
            The films appeared thin, smooth, flexible, and translucent — light blue to transparent.
            Swelling and discoloration after 24h immersion are expected for gelatin-based films.
          </Text>
          <Text style={styles.cite}>
            (DOST-ITDI Standards and Testing Division, Taguig City, May 13, 2026)
          </Text>
        </View>

        {/* Why it matters */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="leaf-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>Why It Matters</Text>
          </View>
          <Text style={styles.bodyText}>
            The world generates an estimated 460 million metric tons of fossil-fuel-derived plastic
            every year. These materials resist natural degradation and pollute land and sea for decades.
          </Text>
          <Text style={styles.cite}>(IUCN, 2024)</Text>

          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>460M</Text>
              <Text style={styles.statLabel}>metric tons of plastic produced yearly</Text>
              <Text style={styles.statCite}>(IUCN, 2024)</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>71–84%</Text>
              <Text style={styles.statLabel}>degradation after 3 weeks in soil</Text>
              <Text style={styles.statCite}>(Mottalib et al., 2024)</Text>
            </View>
          </View>

          <Text style={styles.bodyText}>
            Fish gelatin-based films degrade 71–84% within three weeks when buried in soil at 10 cm
            depth. Under other conditions, complete disintegration was observed within just two days.
          </Text>
          <Text style={styles.cite}>(Mottalib et al., 2024; Jehan et al., 2025)</Text>

          <Text style={styles.bodyText}>
            BIO-FISH offers a locally adaptable, community-deployable alternative: convert a waste
            material into a biodegradable film, automate the process for consistency, and support a
            circular economy at the community level.
          </Text>
          <Text style={styles.cite}>(BIO-FISH Research Team, PUP Sta. Mesa, AY 2025–2026)</Text>
        </View>

        </View>
        </View>
        </View>

      </ScrollView>
    </BubbleBackground>
  );
}

const styles = StyleSheet.create({
  pageWrap:  { width: '100%', maxWidth: 1100, alignSelf: 'center' },
  colsWrap:  { width: '100%', gap: 14 },
  colsRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  col:       { flex: 1, gap: 14 },
  colFull:   { width: '100%', gap: 14 },
  photoWrap: { marginBottom: 14 },
  photo: { width: '100%', height: 220, borderRadius: 16, backgroundColor: Colors.inputBg },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  placeholderText: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },
  caption: { fontSize: 11, color: Colors.textMid, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },

  lead: { fontSize: 13, color: Colors.textDark, lineHeight: 21 },
  bodyText: { fontSize: 13, color: Colors.textDark, lineHeight: 21, marginBottom: 12 },

  stageRow: { flexDirection: 'row', gap: 14, marginBottom: 4 },
  stageIconCol: { alignItems: 'center' },
  stageCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.inputBg, borderWidth: 2, borderColor: Colors.teal,
    alignItems: 'center', justifyContent: 'center',
  },
  stageNum: { fontSize: 13, fontWeight: '800', color: Colors.dark },
  stageConnector: { width: 2, flex: 1, backgroundColor: Colors.inputBg, marginVertical: 4 },
  stageBody: { flex: 1, paddingBottom: 16 },
  stageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  stageName: { fontSize: 14, fontWeight: '700', color: Colors.dark },
  stageText: { fontSize: 12, color: Colors.textMid, lineHeight: 18 },

  statRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statBox: { flex: 1, backgroundColor: Colors.inputBg, borderRadius: 14, padding: 14, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '900', color: Colors.blue },
  statLabel: { fontSize: 10, color: Colors.textMid, fontWeight: '600', textAlign: 'center', marginTop: 4, lineHeight: 14 },
  cite:     { fontSize: 10, color: Colors.textLight, fontStyle: 'italic', marginTop: -8, marginBottom: 12 },
  statCite: { fontSize: 9, color: Colors.textLight, fontStyle: 'italic', marginTop: 4, textAlign: 'center' },
  useRow:   { flexDirection: 'row', gap: 14, marginBottom: 14, alignItems: 'flex-start' },
  useIcon:  { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.inputBg, alignItems: 'center', justifyContent: 'center' },
  useBody:  { flex: 1 },
  useTitle: { fontSize: 13, fontWeight: '700', color: Colors.dark, marginBottom: 2 },
  useDesc:  { fontSize: 12, color: Colors.textMid, lineHeight: 18 },
  explainBox: { backgroundColor: Colors.inputBg, borderRadius: 12, padding: 12, marginBottom: 12, gap: 8 },
  explainRow: { fontSize: 12, color: Colors.textMid, lineHeight: 18 },
  explainKey: { fontWeight: '700', color: Colors.dark },
});