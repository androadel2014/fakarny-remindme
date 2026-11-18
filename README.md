# فكّرني — Fakarny · v1.3.0

Complete Expo / React Native / TypeScript source based on the **Fakarny v1.2.0 source ZIP** and the beta-tester repair round.

- **Android application ID:** `com.andrewmetry.fakarny` (unchanged)
- **App version:** `1.3.0`, Android `versionCode: 13` in `app.json`
- **App stack:** Expo `~58.0.25`, React Native `0.88.0`, React `19.3.0`
- **Storage:** AsyncStorage only; no account or backend for shopping lists
- **Ads:** AdMob configuration and native integration retained; no ad IDs or placement behavior changed

## New in v1.3.0 — beta tester fixes

- **Share footer:** Shared list text ends with `List created by Fakarny` / `تم إنشاء القائمة باستخدام فكّرني` and the Google Play package link: `https://play.google.com/store/apps/details?id=com.andrewmetry.fakarny`.
- **Android Back:** Hardware Back returns from item editor → list, list editor → previous list or home, list → home, and settings → home. Home keeps the normal Android exit behavior. Native modal Back behavior remains handled by each modal's `onRequestClose`.
- **Appearance:** `System default`, `Light`, and `Dark` modes. System mode follows the phone's appearance setting; manual mode is saved in local preferences. Expo `userInterfaceStyle` is set to `automatic`.
- **Localized list names:** Built-in templates store Arabic and English labels, including the monthly template. Older known template names are localized at display time. Custom store names are preserved as the user entered them; their text direction follows the actual script rather than blindly following the app language.
- **Backward-compatible preferences/data:** Existing schema 3 remains in use. `themeMode` and `localizedNames` are optional fields; old saved records continue to parse without a reset or destructive migration.

## Existing weekly and monthly list behavior (verified)

Each list has its own frequency and reminder:

- **Weekly (أسبوعي):** Existing selected weekdays, reminder time, independent notification, and weekly rollover behavior remain unchanged.
- **Monthly (شهري):** Choose one day from 1 through 28 and the reminder hour/minute. The reminder repeats every month on that day, including February. The month's cycle closes at the next local midnight after the selected day. Checked items are dropped; unchecked items carry over in place, preserving IDs and order.
- **Year transitions:** Monthly calculations use local calendar dates and correctly cross December/January and leap years. The feature is recurring monthly, so users choose a day of month rather than a one-time month/year.
- **Monthly template:** `مشتريات الشهر` / `Monthly shopping`, with eight matching starter items in both languages.

Reminder muting does **not** disable cycle rollover. Monthly lists use Expo Notifications' `MONTHLY` trigger; weekly lists retain the `WEEKLY` trigger. Each list owns its own notification requests.

## Optional camera / barcode / OCR feature — deferred

Barcode scanning, product-photo attachment, and OCR are **not included** in v1.3.0. The current source has no camera or ML Kit dependencies, and the npm registry could not be reached during this round (`EAI_AGAIN`). Adding unverified native modules without checking compatibility against Expo SDK 58 / React Native 0.88 could break the existing release. Recommended separate implementation:

1. Expo Camera barcode scanning (ML Kit-backed on Android) for UPC/EAN product codes.
2. Camera permission requested only when the user opens the scanner; graceful manual entry if denied.
3. Product photo capture/attachment, with image URIs stored locally and cleanup when a list item is deleted.
4. Google ML Kit text recognition for OCR from a captured image. OCR text should be shown for confirmation before it becomes an item; barcode values alone do not identify product names without a product catalog lookup.

## Stored state and safe migration

- State schema remains **3**, saved to `@fakarny/shopping-state/v3`.
- If no v3 state exists, the app reads the v2 key `@fakarny/shopping-state/v2`, defaults old lists to **weekly**, preserves items, checked flags, time, weekdays, handled-date boundary, language, and intro state, then writes v3.
- The original v1 single-list migration continues to work if a v2 key does not exist.
- **Old storage keys are not removed or overwritten.** A corrupt stored state is not replaced with empty data.
- Changing cadence or its cycle day resets the handled boundary to the latest already-closed cycle date; changing time or notification on/off does not alter that boundary.

## Build / tests

From the extracted project root:

```bash
npm ci
npm test
npm run typecheck
npx expo prebuild --platform android
npx expo run:android
```

`npm test` requires Node 22.16.0 or later for Node's built-in TypeScript stripping. Use a Node version supported by the resolved dependencies for native builds.

The existing `.github/workflows/build-aab.yml`, `eas.json`, `.github/scripts/inject-signing.py`, app package identifiers, Firebase file, AdMob setup, and ProGuard keep rules are retained. Release signing remains controlled by the original CI secrets and workflow. The ZIP includes managed project source and assets; it does not include the generated native `android/` directory, signing secrets, or an APK/AAB.

## Verification carried out for v1.3.0

- **`npm test`: 34 passed, 0 failed.** Includes original weekly behavior, monthly boundary and year/leap-year cases, migration, translation parity, theme/localized-name persistence, and Android Back navigation logic.
- **Strict TypeScript check:** core domain, migration, navigation, sharing, localization, and theme modules passed. **Full `npm run typecheck`: not completed.** Project dependencies and Expo type declarations are absent in the working environment. The npm registry was unavailable (`EAI_AGAIN`), so dependencies could not be restored. No successful full typecheck is claimed.
- **Android Gradle build / APK / AAB / physical-device test: not completed.** No native build or device test is claimed for this delivery.
- Protected AdMob, Android keep-rules, Firebase, signing, and package identifier configuration were left unchanged.
