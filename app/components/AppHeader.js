import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { supabase } from '../lib/supabase';

const OFFLINE_MS = 15000;

// Shared online indicator — each header subscribes with its own channel key.
function useMachineOnline(channelKey) {
  const [lastSeen, setLastSeen] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
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
  }, [channelKey]);

  return lastSeen > 0 && (now - lastSeen) < OFFLINE_MS;
}

export default function AppHeader({ title = 'BIO-FISH', subtitle, onLogout, channelKey = 'online-header' }) {
  const online = useMachineOnline(channelKey);

  return (
    <View style={styles.wrap}>
      <View style={styles.brand}>
        <Image source={require('../../assets/BIOFISH_LOGO_2026.png')} style={styles.logo} />
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.right}>
        <View style={[styles.pill, online ? styles.on : styles.off]}>
          <View style={[styles.dot, { backgroundColor: online ? '#3DBFB8' : Colors.textLight }]} />
          <Text style={styles.pillText}>{online ? 'Online' : 'Offline'}</Text>
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
  brand:      { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logo:       { width: 36, height: 36, borderRadius: 8, marginRight: 10 },
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