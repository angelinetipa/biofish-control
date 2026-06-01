import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { supabase } from '../lib/supabase';

const OFFLINE_MS = 15000;

// Online indicator. `enabled=false` skips the subscription (used when the
// parent already tracks machine state, e.g. Dashboard with Demo Mode).
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
  title = 'BIO-FISH',
  subtitle,
  onLogout,
  channelKey = 'online-header',
  online,        // optional override (boolean). If set, internal subscription is skipped.
  statusLabel,   // optional text override (e.g. 'Demo')
}) {
  const manageOwn = online === undefined;
  const internalOnline = useMachineOnline(channelKey, manageOwn);
  const isOnline = manageOwn ? internalOnline : online;
  const label = statusLabel || (isOnline ? 'Online' : 'Offline');

  return (
    <View style={styles.wrap}>
      <View style={styles.brand}>
        <Image source={require('../../assets/BIOFISH_LOGO.png')} style={styles.logo} />
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.right}>
        <View style={[styles.pill, isOnline ? styles.on : styles.off]}>
          <View style={[styles.dot, { backgroundColor: isOnline ? '#3DBFB8' : Colors.textLight }]} />
          <Text style={styles.pillText}>{label}</Text>
        </View>
        {onLogout && (
          <TouchableOpacity style={styles.logout} onPress={onLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={16} color={Colors.white} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
  },
  // Shared header-logo style (small, subtle lift) — same on every tab.
  logo: {
    width: 36, height: 36, borderRadius: 10, marginRight: 12,
    shadowColor: '#2C6B7F', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 4,
  },
  brand:      { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12 },
  titleBlock: { flex: 1 },
  title:      { color: Colors.white, fontWeight: '900', fontSize: 22, letterSpacing: 0.5 },
  subtitle:   { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  right: { flexDirection: 'row', alignItems: 'center' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, marginRight: 8,
  },
  on:  { backgroundColor: 'rgba(61,191,184,0.22)' },
  off: { backgroundColor: 'rgba(255,255,255,0.12)' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { color: Colors.white, fontSize: 11, fontWeight: '700' },

  logout: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  logoutText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
});