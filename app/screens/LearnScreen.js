import React, { useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BubbleBackground from '../components/BubbleBackground';
import AppHeader from '../components/AppHeader';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';

// Photos — files must exist in assets/ with these exact names.
const MACHINE_IMG = require('../../assets/BIOFISH_MACHINE.jpg');
const SHEET_IMG   = require('../../assets/BIOFISH_SHEET.jpg');

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

function Photo({ source, caption, icon }) {
  return (
    <View style={styles.photoWrap}>
      {source ? (
        <Image source={source} style={styles.photo} resizeMode="cover" />
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
  return (
    <BubbleBackground>
      <AppHeader title="Learn" onLogout={onLogout} channelKey="online-learn" />

      <ScrollView contentContainerStyle={Theme.scrollContent} showsVerticalScrollIndicator={false}>

        {/* What is BIO-FISH */}
        <View style={Theme.card}>
          <Photo source={MACHINE_IMG} caption="The BIO-FISH machine" icon="hardware-chip-outline" />
          <Text style={styles.lead}>
            BIO-FISH turns fish scales — a common market waste — into biodegradable plastic sheets.
            An ESP32 microcontroller runs the whole process automatically across four stages, using
            sensors and timed logic to control temperature, pumps, and duration with little manual work.
          </Text>
        </View>

        {/* How it works */}
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
            The bioplastic film produced by BIO-FISH is a thin, flexible sheet that can serve
            as a sustainable substitute for conventional single-use plastic in several everyday applications.
          </Text>
          {[
            { icon: 'bag-outline',       title: 'Food Packaging',      desc: 'Can be formed into wrappers, flat sachets, or small bags for dry goods — tested to hold contents without tearing or deforming.' },
            { icon: 'leaf-outline',      title: 'Compostable Film',    desc: 'Degrades 71–84% in 3 weeks when buried in soil, and completely disintegrates within 2 days under conditions studied in recent research.' },
            { icon: 'shield-checkmark-outline', title: 'Antibacterial Layer', desc: 'The formulation includes guava leaf extract as a natural antibacterial additive, making it suitable for protective wrapping of food items.' },
            { icon: 'refresh-outline',   title: 'Waste Valorization',  desc: 'Made entirely from fish scale waste — a byproduct discarded daily at public markets — turning a sanitation problem into a reusable resource.' },
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

        {/* Why it matters */}
        <View style={Theme.card}>
          <View style={Theme.cardLabelRow}>
            <Ionicons name="leaf-outline" size={13} color={Colors.textMid} />
            <Text style={Theme.cardLabel}>Why It Matters</Text>
          </View>
          <Text style={styles.bodyText}>
            The world makes around 460 million metric tons of fossil-fuel plastic every year. Most of
            it resists breaking down and pollutes land and sea for decades.
          </Text>
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>460M</Text>
              <Text style={styles.statLabel}>tons of plastic made yearly</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>100%</Text>
              <Text style={styles.statLabel}>bio-based, biodegradable film</Text>
            </View>
          </View>
          <Text style={styles.bodyText}>
            BIO-FISH shows a small-scale, sustainable alternative: reuse a waste material, automate the
            process so it's repeatable, and produce plastic that returns to nature.
          </Text>
        </View>

      </ScrollView>
    </BubbleBackground>
  );
}

const styles = StyleSheet.create({
  photoWrap: { marginBottom: 14 },
  photo: { width: '100%', height: 180, borderRadius: 16, backgroundColor: Colors.inputBg },
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
  useRow:   { flexDirection: 'row', gap: 14, marginBottom: 14, alignItems: 'flex-start' },
  useIcon:  { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.inputBg, alignItems: 'center', justifyContent: 'center' },
  useBody:  { flex: 1 },
  useTitle: { fontSize: 13, fontWeight: '700', color: Colors.dark, marginBottom: 2 },
  useDesc:  { fontSize: 12, color: Colors.textMid, lineHeight: 18 },
});