# BIO-FISH 🐟

**Control app for a machine that turns fish scales into bioplastic sheets.**

Fish scales are one of the most common waste products in Philippine wet markets. BIO-FISH is a machine that turns them into biodegradable plastic film across four automatic stages, run by an ESP32 microcontroller. This is the app that operates it — live status, remote control, and machine settings, on phone or in a browser.

**Live app:** [biofish-control.vercel.app](https://biofish-control.vercel.app)

![BIO-FISH dashboard](docs/screenshot.jpeg)

## What it is

Two things sit side by side here, and it is worth being clear about which is which.

**The machine** is our engineering capstone — a team of four, and a 2026 APEAR Top 8 finalist.

**This app is not part of the thesis.** Our Software Design course required a working application, so instead of building something disposable, I proposed we build the control interface our own machine actually needed. One piece of work, two purposes. I led the development.

### What the machine does

| Stage | What happens |
|---|---|
| 1 · Extraction | Heats fish scales in water to release gelatin. |
| 2 · Filtration | Pumps the gelatin liquid through filters into the next container. |
| 3 · Formulation | Adds glycerin as a plasticizer and mixes with heat so the film stays flexible. |
| 4 · Film Formation | Pours the mixture into trays to dry into thin bioplastic sheets. |

## How to try it

Open the [live link](https://biofish-control.vercel.app) and press **Try Demo**. No PIN needed.

You land in Demo Mode with the machine idle. Press **Start** and the app runs a full scripted production cycle — all four stages, temperature curves, and the operator decision points where the machine stops and asks you what to do. Nothing you press touches the real database; the demo is read-only by design (see [How it works](#how-it-works)).

The PIN field above the button is for the actual operators. It is not needed to explore the app.

### Read this before judging the demo

**Version 1 of this app was demonstrated controlling the physical machine end to end** — live temperatures, stage progress, and remote start, pause, and emergency stop.

**Version 2 — the current code — has not been re-tested against the hardware.** Both the firmware and the app interface were rewritten, and I no longer have access to the machine. The pairing works in principle and worked in v1, but I cannot claim the current build has been verified against the real thing, and I would rather say so than let someone find out during a demo.

Demo Mode is what you can see working right now. It was built so the panel could watch the interface behave during defense, and it is also how the live web link works today.

## Features

- **Dashboard** — live status, container temperatures, stage progress, process log, and controls (Start, Pause, E-Stop, Clean).
- **Operator decision points** — when the volume sensor reads outside the expected 1500–2500 mL range, the machine retries three times, then hands the decision to the operator: retry, skip, or stop. Same for heat overrun and tray dispensing. The machine never guesses on the operator's behalf.
- **Demo Mode** — a full simulated production run, with no hardware needed.
- **Guest access** — a public read-only entry so anyone can explore the app without a PIN and without changing anything.
- **Settings** — eight machine parameters (water volume, mix times, temperature ceilings, glycerin percentage, clean and drain durations), matched to the ESP32 firmware defaults and synced live to the machine.
- **Hidden admin gate** — long-press the logo in Settings and enter an admin code to reveal the Change PIN form. Knowing the shared access PIN is not enough to change it.
- **Learn and Help** — what each stage does, a how-to guide, FAQ, WiFi setup steps, and troubleshooting.
- **Cross-platform** — one codebase running on Android (EAS Build) and the web (Vercel), with a two-column layout on wide screens.

## Tech stack

| Part | What I use |
|---|---|
| App framework | React Native + Expo (SDK 54) |
| Navigation | React Navigation (bottom tabs) |
| Database + realtime | Supabase (Postgres, RLS, realtime subscriptions) |
| Web hosting | Vercel |
| Mobile build | EAS Build (Android APK) |
| Machine | ESP32 microcontroller |

## How it works

### The app and the machine talk through Supabase

Neither side connects to the other directly. Both read and write to a shared database, which means the app works from anywhere with internet, not just on the same WiFi as the machine.

```
ESP32  ──writes status──►  machine_status   ──realtime push──►  App
ESP32  ◄──reads/clears──   machine_commands ◄──writes────────   App
                            machine_settings  ◄── both ──►
```

| Table | Holds |
|---|---|
| `machine_status` | Live temps, current stage, substep, last-seen timestamp |
| `machine_commands` | Commands from the app; the machine reads then deletes them |
| `machine_settings` | The eight parameters, plus the current access PIN |

All three have Row Level Security enabled with realtime turned on.

### Three decisions worth explaining

**Commands are a queue, not a flag.** The app inserts a command row and the machine deletes it after acting. If a flag were used instead, a dropped connection could leave the machine stuck acting on a stale instruction.

**Online status comes from a timestamp, not a connection.** The app checks the machine's `last_seen` value against a 15-second window. A device on flaky WiFi can look connected while having quietly stopped reporting, so the timestamp is the more honest signal.

**Guest writes are blocked in one place.** The public demo lets anyone in without a PIN, so guests must not be able to write anything. Every screen reaches the database through `supabase.from()`, so `app/lib/supabase.js` wraps that call in a Proxy that swaps out `insert`, `update`, `upsert`, and `delete` for a no-op when the guest flag is on. One chokepoint covers all three tables at once. Reads and realtime stay untouched, so the app still looks alive. The alternative — a guest check inside every screen — is a check I would eventually forget to add.

## Project structure

```
biofish-control/
├── App.js                        # entry — splash, login, tab navigation
├── app/
│   ├── screens/                  # one file per screen
│   │   ├── SplashScreen.js
│   │   ├── LoginScreen.js        # PIN entry + guest "Try Demo" button
│   │   ├── DashboardScreen.js    # live status, controls, demo engine
│   │   ├── LearnScreen.js
│   │   ├── HelpScreen.js
│   │   └── SettingsScreen.js     # parameters, admin gate, Change PIN
│   ├── components/               # AppHeader, BubbleBackground
│   ├── constants/                # colors.js, theme.js — the design system
│   └── lib/
│       ├── supabase.js           # Supabase client + guest write guard
│       └── guest.js              # read-only flag, set once at login
├── web/index.html                # web shell and layout CSS
└── assets/
```

Design is a custom claymorphism system — soft shadows, rounded surfaces, and an underwater bubble background, in keeping with the fish-scale origin. Colors and spacing live in `app/constants/`, and every screen and component is its own file.

## Run it locally

### 1. Install what you need

- **Node.js** (version 20 or newer) — [nodejs.org](https://nodejs.org)
- **Expo Go** on your phone, if you want to run it on mobile. It must be the version matching **SDK 54**.

### 2. Get the code

```bash
git clone https://github.com/angelinetipa/biofish-control.git
cd biofish-control
npm install
```

### 3. Add your environment file

Create a file named `.env` in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_ACCESS_PIN=your_pin
EXPO_PUBLIC_ADMIN_PIN=your_admin_pin
```

The two PINs are fallbacks only. The live access PIN is read from the `machine_settings` table in Supabase; the env value is used when the database cannot be reached.

`.env` is gitignored and must stay that way.

### 4. Start it

```bash
npx expo start     # phone — scan the QR code with Expo Go
npm run web        # browser — opens on localhost
```

You should see the splash screen, then the login screen. Press **Try Demo** to get in without a PIN.

### Common problems

| Problem | Fix |
|---|---|
| Expo Go says the SDK version does not match | Install the Expo Go build for SDK 54, or upgrade the project |
| Changes to `.env` do nothing | Stop the server and run `npx expo start -c` to clear the cache |
| Everything shows dashes and "Offline" | Normal without the machine. Turn on Demo Mode in the Machine Control card |
| Blank screen on web | Delete `node_modules` and `package-lock.json`, then run `npm install` again |

## Edit or modify it

| I want to change... | Edit this file |
|---|---|
| Colors, shadows, spacing | `app/constants/colors.js`, `app/constants/theme.js` |
| The demo timeline — stages, durations, temperatures | `DEMO` array in `app/screens/DashboardScreen.js` |
| Machine parameters — min, max, step, defaults | `PARAMS` array in `app/screens/SettingsScreen.js` |
| The acceptable volume range | `GUARDIAN_OK_MIN` / `GUARDIAN_OK_MAX` in `DashboardScreen.js` |
| How long before the machine counts as offline | `OFFLINE_MS` in `DashboardScreen.js` |
| FAQ, how-to steps, WiFi setup, troubleshooting text | `HOW_TO_USE`, `FAQS`, `CONNECT_STEPS`, `TROUBLESHOOT` in `app/screens/HelpScreen.js` |
| Stage explanations and machine photos | `app/screens/LearnScreen.js` |
| Team names and roles | `TEAM` array in `app/screens/SettingsScreen.js` |
| The login screen or the guest button | `app/screens/LoginScreen.js` |
| What guests are blocked from doing | `WRITE_METHODS` in `app/lib/supabase.js` |
| Header bar or bubble background | `app/components/` |
| Tab bar icons and colors | `App.js` |
| Web page centering and background | `web/index.html` |
| When the layout switches to two columns | the `width >= 900` checks in each screen |

Commit after each change. Format: `type(scope): description`, for example `fix(dashboard): correct offline threshold`.

## Honest notes

**The auth is not real auth.** Access is a single shared PIN with no usernames — a deliberate choice for a lab machine operated by a small team standing next to it, where individual accounts would have added friction without adding safety. But `EXPO_PUBLIC_` variables are bundled into the build, so the PIN is obscurity, not security. The correct fix is server-side verification through Supabase Auth, with the PIN never reaching the client. That is the first thing I would change given more time.

**Version 2 is unverified against the hardware.** Explained above. This is the one real weakness in the project.

**There are no tests.** The demo engine and the status-parsing logic are pure functions and would be straightforward to cover with Vitest or Jest.

**What I would do differently:** move auth server-side, re-verify against the machine, add tests, and split `DashboardScreen.js` — it carries both the live view and the demo engine, and those belong in separate files.

## Credits

Martinez · Ragaas · Sanclaria · Tipa (lead developer, this app)

Polytechnic University of the Philippines — Sta. Mesa, Manila
CMPE 407, AY 2025–2026

---

Built by [Angeline Tipa](https://github.com/angelinetipa).