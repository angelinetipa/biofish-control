# BIO-FISH 🐟

**Bioplastic Sheet Production from Fish Scales — Control App**

BIO-FISH is a capstone project that turns fish scales (a common market waste) into biodegradable plastic sheets. A physical machine, run by an ESP32 microcontroller, does the work in 4 automatic stages. This app (mobile + web) lets you **monitor and control** that machine in real time.

- **School:** Polytechnic University of the Philippines — Sta. Mesa, Manila
- **Course:** CMPE 407 — Academic Year 2025–2026
- **Team:** Martinez, Ragaas, Sanclaria, Tipa (Lead Developer)

---

## What the machine does (4 stages)

1. **Extraction** — Heats fish scales in water to release gelatin.
2. **Filtration** — Pumps the gelatin liquid through filters into the next container.
3. **Formulation** — Adds glycerin (food-safe plasticizer) and mixes with heat so the film is flexible.
4. **Film Formation** — Pours the mixture into trays to dry into thin bioplastic sheets.

---

## Tech Stack

| Part | What we use |
|------|-------------|
| App framework | React Native + Expo (SDK 54) |
| Web build | Expo web (metro bundler) |
| Database + realtime | Supabase (Southeast Asia / Singapore region) |
| Web hosting | Vercel |
| Mobile build | EAS Build (APK for Android) |
| Machine brain | ESP32 microcontroller |
| Icons | Ionicons + MaterialCommunityIcons (`@expo/vector-icons`) |

---

## App Structure (4 tabs)

- **Dashboard** — Live machine status, temperatures, stage progress, process log, and control buttons (Start, Pause, E-Stop, Clean). Has **Demo Mode** to simulate a full run without the real machine.
- **Learn** — Explains what BIO-FISH is and how each stage works.
- **Help** — How-to guide, FAQ, and steps for connecting the machine to WiFi.
- **Settings** — Adjust 8 machine parameters, change the access PIN, and view About Us / team info.

**Login:** One shared **Access PIN** (no usernames). Default is `2026`.

---

## Folder Layout

```
biofish-control/
├── App.js                  # App entry — splash, login, tab navigation
├── app.json                # Expo config (app name, icon, version)
├── eas.json                # Build profiles for EAS
├── metro.config.js         # Bundler config
├── web/
│   └── index.html          # Web page template (background + scrollbar)
├── assets/                 # Images and logos
└── app/
    ├── screens/            # One file per screen
    │   ├── SplashScreen.js
    │   ├── LoginScreen.js
    │   ├── DashboardScreen.js
    │   ├── LearnScreen.js
    │   ├── HelpScreen.js
    │   └── SettingsScreen.js
    ├── components/         # Shared pieces
    │   ├── AppHeader.js     # Logo + title + Online/Offline + Logout
    │   └── BubbleBackground.js
    ├── constants/          # Design system
    │   ├── colors.js
    │   └── theme.js
    └── lib/
        └── supabase.js      # Supabase connection
```

**Rule we follow:** Every component, constant, and screen lives in its **own file**. No mixing things together. This keeps the code professional and easy to read.

---

## ⚙️ Setup — Run it on your own phone

You need: a computer with **Node.js** installed, and the **Expo Go** app on your phone (from Play Store / App Store). Make sure Expo Go matches **SDK 54**.

### 1. Get the code

```bash
git clone https://github.com/angelinetipa/biofish-control.git
cd biofish-control
```

### 2. Install the packages

```bash
npm install
```

### 3. Add the secret keys (.env file)

Create a file named `.env` in the main folder. Ask Angeline/Tipa for the real values.

```
EXPO_PUBLIC_SUPABASE_URL=https://gydjsaylhsyiyetkgunu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_ACCESS_PIN=2026
```

> ⚠️ **Never** commit the `.env` file to GitHub. It is already ignored on purpose.

### 4. Run it

```bash
npx expo start
```

A QR code appears. Open **Expo Go** on your phone and scan it. The app loads. Your phone and computer must be on the **same WiFi**.

### Run on web (in your browser)

```bash
npm run web
```

---

## 🗄️ Supabase (the database)

The app talks to 3 tables:

| Table | What it holds |
|-------|---------------|
| `machine_status` | Live status the machine pushes (temps, stage, online time) |
| `machine_commands` | Commands the app sends (Start, Pause, etc.) — machine reads then deletes them |
| `machine_settings` | The 8 parameters + the access PIN |

All 3 have **Row Level Security (RLS)** and **realtime** turned on. Realtime is what makes the dashboard update live.

> The anon key is safe to be public **because RLS protects the data**. The thing to keep private is the access PIN.

---

## ✏️ Making changes to the code

Work on one thing at a time. After a change:

```bash
git add <the files you changed>
git commit -m "short message about what you did"
git push
```

- Pushing to `main` makes Vercel **auto-update the website** in about 1 minute.
- The website link never changes: **https://biofish-control.vercel.app**
- To test changes instantly without pushing, use `npm run web` or `npx expo start`.

> **Tip:** When delivering code between team members, **replace the whole file** instead of using patches. Patches caused conflicts for us before.

---

## 🌐 Deploy the website (Vercel)

Already set up. It auto-deploys on every push to `main`. If you ever set it up fresh:

- **Framework Preset:** Other
- **Build Command:** `npx expo export -p web`
- **Output Directory:** `dist`
- **Environment Variables:** add the same 3 keys from the `.env` file

---

## 📱 Build the Android app (APK)

This makes an installable `.apk` file you can put on any Android phone.

```bash
npm install -g eas-cli      # one time only
eas login                   # log in to Expo account
eas build -p android --profile preview
```

- The build happens in the cloud (free tier: ~15–40 min, sometimes a queue).
- Watch progress at: **https://expo.dev/accounts/angelinetipa/builds**
- When done, click **Install** to get a QR code, scan it on your phone to download.

> Free tier allows **1 build at a time**. Cancel old builds if a new one is stuck "in queue."

> The app icon and splash only change after a **new build** — not on an already-installed app.

---

## 🎨 Design System

Keep the look consistent. Values live in `app/constants/colors.js` and `theme.js`.

| Thing | Value |
|-------|-------|
| Gradient background | `#4ECDC4` → `#3A7CA5` → `#2C6B7F` |
| Accent teal | `#5DD9D2` |
| Dark text | `#2C6B7F` / `#3E4C59` |
| Input background | `#E4EDF1` |
| Card style | Claymorphism (soft shadows, rounded) |
| Background effect | Large, slow floating bubble blobs |
| Logo file | `BIOFISH_LOGO.png` (app icon uses the square version) |

---

## 🆘 Troubleshooting (things that bit us before)

| Problem | Fix |
|---------|-----|
| `git push` rejected (non-fast-forward) | Run `git pull --rebase` then `git push` |
| Vercel shows old version | It deployed an older commit — check the commit hash on Vercel matches your latest `git log` |
| Web changes not showing | Hard refresh the browser: `Ctrl + Shift + R` |
| Logout button does nothing on web | `Alert.alert` doesn't work on web — we use `window.confirm` for web instead |
| Web layout looks stretched | Handled by the web shell in `App.js` + `web/index.html` |
| APK won't open / crashes | Usually a missing native dependency or wrong app config. Test in Expo Go first — if it works there, the problem is build-specific |
| `usesCleartextTraffic` build error | Remove it from `app.json` — not valid in SDK 54 |
| Missing `react-native-worklets` | Run `npx expo install react-native-worklets` (needed by reanimated) |
| Build "in queue" forever | Free tier = 1 build at a time; cancel stuck builds on the Expo site |

---

## 📋 Still To Do

- [ ] Add the internet/Supabase code to the ESP32 firmware (it currently has no online code — this is the main blocker for the real machine to talk to the app)
- [ ] Finish responsive 2-column web layout (postponed)
- [ ] Final APK build with all latest fixes

---

## 🔑 Quick Reference

- **GitHub:** https://github.com/angelinetipa/biofish-control
- **Website:** https://biofish-control.vercel.app
- **Supabase URL:** https://gydjsaylhsyiyetkgunu.supabase.co
- **Default Access PIN:** `2026`
- **Android package:** `com.angelinetipa.biofish`

---

*Made with care by the BIO-FISH team 💙*