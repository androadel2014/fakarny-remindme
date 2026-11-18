# Fakarny v1.3.0 — Beta Tester Fix Round

- Added a bilingual Fakarny attribution footer and Google Play package link to shared list text.
- Added Android hardware Back navigation for nested app screens; the home screen retains normal Android exit behavior.
- Added system-following, Light, and Dark appearance modes, persisted in the existing local preferences object.
- Enabled automatic system appearance in Expo config and applied a shared dark palette across app screens and reusable components.
- Added bilingual names for built-in list templates, including the monthly template; existing known template names are localized on display without rewriting stored list names.
- Applied script-aware RTL/LTR alignment to list titles and the list-name editor. User-authored custom names are preserved as entered.
- Preserved schema version 3 and added optional, backward-compatible `themeMode` and `localizedNames` fields. Existing v1/v2/v3 data migration paths remain in place.
- Verified the existing monthly implementation: day 1–28, independent monthly notification, local-midnight rollover, checked-item clearing, unchecked-item carry-over, February/leap-year handling, and December/January year rollover.
- Added regression tests for localization, theme preference persistence, and hardware Back navigation.
- Kept package ID, Firebase, AdMob, signing workflow, notification scheduling, and weekly cadence logic unchanged.

## Deferred optional feature

Barcode scanning, product photo attachment, and OCR are not included in this build. The source has no camera or ML Kit packages, and the npm registry was unavailable during this round (`EAI_AGAIN`). Adding unverified native dependencies without resolving their Expo SDK 58 / React Native 0.88 compatibility would risk breaking the current production app. Recommended next step: add Expo Camera barcode scanning (Google ML Kit-backed on Android), image attachment saved locally, and ML Kit text recognition as a separate tested native-feature round.
