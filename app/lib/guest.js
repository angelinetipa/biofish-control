// Guest (demo) mode flag.
// Set once at login; read anywhere without prop-drilling.
// Guests get a read-only app: Demo Mode on, no writes to Supabase.

let guest = false;

export const setGuest = (v) => { guest = !!v; };
export const isGuest  = () => guest;