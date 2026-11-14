# فكّرني — Remind Me · Android v1.0.0

Offline-first weekly shopping reminder. **Package:** `com.andrewmetry.fakarny` · **versionName:** `1.0.0` · **versionCode:** `1`.

## What works

- Arabic-first, fully translated Arabic RTL and English LTR screens (Home, item editor, Settings, permission prompts, list alerts, confirmations).
- Add by typing or Android speech recognition (`ar-EG`, `en-US`), edit, check off and delete.
- Choose a weekday and any time with the Android system time picker.
- Recurring *local* weekly notification with chime, MAX-importance Android channel, and **all outstanding item names** in the scheduled notification body and its data payload. Foreground/tapped reminders open the full-list modal. Local snapshot refreshed whenever items/settings change.
- After **Finish shopping**, checked items disappear; unchecked items carry over automatically. If the day ends without tapping Finish, the same action happens on the next app activation / foreground check (or the app's 30-second timer when open).
- All data saved only on device with AsyncStorage; no app accounts, ads, analytics, or developer-operated backend.

## Requirements

Node.js 22.13+ (Expo SDK 58); npm; Android Studio + Android SDK/JDK 17 for local builds, or an EAS account for cloud builds.

```bash
npm install
npm test
npm run typecheck
npx expo start
```

### Expo Go (limited mode)

Open the QR code with an **SDK 58 compatible Expo Go** client. Text-based shopping, translations, settings, and local storage can run. **Voice recognition does not work in Expo Go**, because `expo-speech-recognition` is a third-party native module. The mic button explains that limitation instead of crashing. The custom notification chime, manifest permissions, and exact scheduling require a native build. Availability of SDK 58 in the public Expo Go app may lag during the SDK transition: use the development build below if Expo Go reports an SDK mismatch.

### Complete Android app / development build

```bash
npm install
npx expo prebuild --platform android
npx expo run:android
```

Use a **physical Android phone** with a Google/Android speech recognizer enabled; grant microphone and notification permissions. Voice transcription can be processed by the phone's speech service and may require internet depending on the installed recognizer. No voice recordings are saved by this app.

To produce a locally installable *debug APK*:

```bash
npx expo prebuild --platform android
cd android
./gradlew assembleDebug              # on Windows: gradlew.bat assembleDebug
# file: android/app/build/outputs/apk/debug/app-debug.apk
```

To make a signed **release APK** or **Google Play AAB** via EAS:

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview     # signed APK
# OR
eas build --platform android --profile production  # signed AAB
```

EAS may request Android signing-key setup on the first build. Native `android/` source is produced deterministically by `expo prebuild` from `app.json` and package dependencies; it is intentionally not committed. This ZIP is the complete Expo-managed source, not a precompiled APK/AAB. `npm install`, Android compilation and emulator/phone validation were **not executed** in the artifact-generation environment because npm registry access timed out.

## Where the logic lives

| Function | File |
|---|---|
| Manual finish, checked clear/unchecked carry | `src/domain/shopping.ts` → `carryOverUnchecked`, `finishShopping` |
| Day-end reconciliation, next day and countdown | `src/domain/shopping.ts` → `applyAutomaticCarryOver`, `nextShoppingAt` |
| Persisted state, validation | `src/services/storage.ts` |
| Android channel, permission checks, recurring weekly trigger, full-body snapshot, serialized rescheduling | `src/services/reminders.ts` |
| Speech recognition events and language selection | `src/screens/ItemEditor.tsx` |
| Foreground lifecycle, UI updates, reminder tap/receive modal | `App.tsx` |
| Arabic and English translations | `src/i18n/strings.ts` |
| Vector icon, Android icons and chime | `assets/` |

## Important Android/platform behavior

- Android 13+ requires user-approved notification permission. Android 12+ exact alarms need `SCHEDULE_EXACT_ALARM`; Android 14+ usually starts with this special access disabled. The Settings screen has permission actions. When exact access is not granted the app schedules a best-effort weekly notification; when granted it uses Expo's `delivery: 'alarmClock'` mode. Android can suppress sounds/heads-up alerts with Do Not Disturb, user channel settings, or aggressive OEM power optimization.
- Expo's scheduled notification is a **snapshot**, not code executed when the app is killed. Each edit/start/foreground pass replaces the scheduled reminder. Once the user stops opening the app, that snapshot remains unchanged. This is appropriate for a local-only app but doesn't provide a guaranteed live read from storage at alarm time.
- Android may visually truncate long notification *previews*, even though the full list is in the notification content body/data. Tapping opens a scrollable full-list alert in the app.
- Expo-managed notifications do **not** implement an unrestricted full-screen, lock-screen alarm activity. The implemented alarm-style behavior is a high-priority heads-up notification, short custom chime, exact scheduling when permitted, and an in-app full-list alert. Full-screen lock-screen UI requires additional native implementation and may be restricted by Android/Play policy.
- Android may kill or suspend the app after a shopping day ends. Without a native midnight receiver/background job, auto-rollover is reconciled **on next open/foreground**, not guaranteed at the exact midnight instant while the app is terminated. This keeps data correct without a server.
- The notification list includes every **unchecked** item (still needed for shopping). Checked purchases remain visible in Home until Finish shopping or the automatic rollover.

## Unit tests

Run `npm test`. Nine tests in `tests/carryover.test.mjs` cover checked clear, unchecked carry, manual completion, after-midnight rollover, idempotency, multiweek catch-up, weekday changes, next alarm boundary, and early completion. Tests run using Node 22's built-in TypeScript type-strip feature; no test framework download is needed. **Result in this environment: 9 passed, 0 failed.**

## Asset / licensing

All icon artwork and chime in `assets/` were generated specifically for this project. No external copyrighted media. No keys or credentials included.
