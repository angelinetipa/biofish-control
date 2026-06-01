import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { supabase } from '../lib/supabase';

const OFFLINE_MS = 15000;

function useMachineOnline(channelKey, enabled) {
  const [lastSeen, setLastSeen] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('machine_status').select('last_seen').eq('id', 1).single();
      if (active && data?.last_seen) setLastSeen(new Date(data.last_seen).getTime());
    })();
    const channel = supabase
      .channel(channelKey)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'machine_status' },
        (p) => { if (p.new?.last_seen) setLastSeen(new Date(p.new.last_seen).getTime()); }
      )
      .subscribe();
    const tick = setInterval(() => setNow(Date.now()), 5000);
    return () => { active = false; supabase.removeChannel(channel); clearInterval(tick); };
  }, [channelKey, enabled]);

  return lastSeen > 0 && (now - lastSeen) < OFFLINE_MS;
}

export default function AppHeader({
  title = 'BIO-FISH', subtitle, onLogout,
  channelKey = 'online-header', online, statusLabel,
}) {
  const manageOwn = online === undefined;

  const confirmLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: onLogout },
      ]
    );
  };
  const internalOnline = useMachineOnline(channelKey, manageOwn);
  const isOnline = manageOwn ? internalOnline : online;
  const label = statusLabel || (isOnline ? 'Online' : 'Offline');

  return (
    <View style={styles.container}>

      <View style={styles.row}>

        {/* Logo spans title + subtitle */}
        <View style={styles.brand}>
          <Image source={require('../../assets/BIOFISH_LOGO.png')} style={styles.logo} />
          <View style={styles.textBlock}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
          </View>
        </View>

        {/* Pill + logout */}
        <View style={styles.right}>
          <View style={[styles.pill, isOnline ? styles.pillOn : styles.pillOff]}>
            <View style={[styles.dot, { backgroundColor: isOnline ? '#3DBFB8' : 'rgba(255,255,255,0.5)' }]} />
            <Text style={styles.pillText}>{label}</Text>
          </View>
          {onLogout && (
            <TouchableOpacity style={styles.logout} onPress={confirmLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={16} color={Colors.white} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 10 },

  // Row 1
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand:     { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 },
  logo:      { width: 42, height: 42, borderRadius: 10 },
  textBlock: { flex: 1 },
  title:     { color: Colors.white, fontWeight: '900', fontSize: 22, letterSpacing: 0.5 },
  subtitle:  { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 1 },
  right:     { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Pill — dark bg so it's always visible against the gradient
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1,
  },
  pillOn:  { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: '#3DBFB8' },
  pillOff: { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.35)' },
  dot:      { width: 7, height: 7, borderRadius: 4 },
  pillText: { color: Colors.white, fontSize: 11, fontWeight: '700' },

  logout: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  logoutText: { color: Colors.white, fontSize: 13, fontWeight: '600' },


});