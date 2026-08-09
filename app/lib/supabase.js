import { createClient } from '@supabase/supabase-js';
import { isGuest } from './guest';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Guest read-only guard ────────────────────────────────────────────────
// The public "Try Demo" entry lets anyone in without a PIN, so guests must
// not be able to write. Every screen reaches the database through .from(),
// so blocking the write methods there is a single chokepoint — it covers
// machine_commands, machine_settings, and the PIN row at once, with no
// per-screen checks to forget later. Reads and realtime stay untouched.

const WRITE_METHODS = ['insert', 'update', 'upsert', 'delete'];

const blocked = async () => ({
  data: null,
  error: { message: 'Read-only demo — writes are disabled.' },
});

function fromTable(table) {
  const builder = client.from(table);
  if (!isGuest()) return builder;

  return new Proxy(builder, {
    get(target, prop) {
      if (WRITE_METHODS.includes(prop)) return blocked;
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

export const supabase = {
  from:          fromTable,
  channel:       (...args) => client.channel(...args),
  removeChannel: (...args) => client.removeChannel(...args),
  auth:          client.auth,
  raw:           client,
};