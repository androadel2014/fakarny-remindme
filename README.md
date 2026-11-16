# فكّرني — Fakarny · v1.2.0

Complete Expo / React Native / TypeScript source based on the provided **live v1.1.9 source ZIP**.

- **Android application ID:** `com.andrewmetry.fakarny` (unchanged)
- **App version:** `1.2.0`, Android `versionCode: 12` in `app.json`
- **App stack:** Retained from v1.1.9 (`expo ~58.0.25`, React Native `0.88.0`, React `19.3.0` as declared in `package.json`)
- **Storage:** AsyncStorage only; no account or backend for shopping lists
- **Ads:** All AdMob files, setup, plugin registration, and ProGuard keep rules remain unchanged from v1.1.9

## New in v1.2.0

A list now has a frequency, chosen separately for each list:

- **Weekly (أسبوعي):** The existing weekday selection, time, and automatic weekly carry-over behavior are preserved.
- **Monthly (شهري):** Choose one day from 1 through 28 and the usual reminder hour/minute. The reminder repeats every month on the selected day, and the month's cycle closes at the **next local midnight**. Checked items are dropped; unchecked items carry over in place, maintaining their IDs and order.
- **Monthly template:** `مشتريات الشهر` / `Monthly shopping`: rice, oil, sugar, tea, coffee, pasta, detergent, tissues in both languages.
- **Bilingual UI:** The editor shows Weekly/Monthly frequency controls and, for monthly lists, a 1–28 picker in place of weekday chips. Home cards and list detail display frequency and time.

Reminder muting does **not** disable list cycle rollover for either frequency. The existing reminder service schedules monthly lists with the `MONTHLY` trigger provided by `expo-notifications`; weekly lists continue to use the original `WEEKLY` trigger. Each list owns its own notifications.

## Stored state and safe migration

- New state schema: **3**, saved to `@fakarny/shopping-state/v3`.
- On first launch, if no v3 state exists, the app reads the published v2 key `@fakarny/shopping-state/v2`, defaults each old list to **weekly**, keeps its items, checked flags, time, weekdays, handled-date boundary, language, and intro state, then writes v3.
- The original v1 single-list migration continues to work if a v2 key does not exist. It is upgraded into v3 after the legacy conversion.
- **Old storage keys are not removed or overwritten.** A corrupt stored state is not replaced with empty data.
- When a user changes a list's cadence or cycle date, its handled boundary is reset to the latest *already closed* cycle date; edits to time or notification on/off do not alter that boundary.

## Build / tests

From the extracted project root:

```bash
npm ci
npm test
npm run typecheck
npx expo prebuild --platform android
npx expo run:android
```

`npm test` requires a Node version supporting `--experimental-strip-types` (the tests were run with Node 22.16.0). Use a Node version supported by the resolved dependencies for native builds.

The existing `.github/workflows/build-aab.yml`, `eas.json`, `.github/scripts/inject-signing.py`, app package identifiers, Firebase file, and app/plugin configuration are **unchanged**. Release signing remains controlled by the original CI secrets and workflow. The ZIP includes managed project source and assets; it does not include the generated native `android/` directory, signing secrets, or an APK/AAB.

## Verification carried out for this delivery

- **`npm test`: 30 passed, 0 failed** (19 original tests + 11 new monthly tests).
- Standalone strict TypeScript check for `src/domain/*` and `src/i18n/strings.ts`: **passed**.
- Full `npm run typecheck` / native Android build: **not completed** because the npm package registry was inaccessible (DNS `EAI_AGAIN`), leaving required Expo/React Native dependencies unavailable in this environment. No claim of a device build or AdMob runtime verification is made.
- Protected AdMob, Android keep-rules, Firebase, signing, and package identifier files were checked for changes against the input ZIP; see delivery summary.
