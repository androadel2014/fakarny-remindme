# Fakarny v1.2.0 — Changelog

- Added per-list weekly or monthly cadence; monthly day picker 1–28, same reminder hour/minute.
- Added `latestClosedMonthlyCycleDate`, `nextMonthlyReminderAt`, monthly rollover, and schedule-aware reminder planning.
- Added repeating monthly Expo notification triggers without altering weekly trigger logic.
- Added Arabic and English monthly shopping template with eight everyday staples.
- Added Arabic/English cadence strings and summaries on Home/List Detail.
- Added schema 3 and safe v2→v3 migration preserving all existing weekly lists and rollover dates (v1 import still supported).
- Set app version 1.2.0 and Android versionCode 12.
- Added 11 unit tests. Total 30/30 passed; see `TEST-RESULTS.txt`.
- AdMob/Android ProGuard keep-rule/Firebase/signing integration not modified.
