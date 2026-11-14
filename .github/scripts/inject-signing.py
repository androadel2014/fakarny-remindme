#!/usr/bin/env python3
"""Inject a release signing config into the Expo-prebuilt android/app/build.gradle.

Runs only inside the CI runner against the generated file; the repo source is
never permanently modified. Fails loudly if the expected template patterns are
not found so the CI log shows exactly what drifted.
"""
import re
import sys

PATH = "android/app/build.gradle"

with open(PATH, "r", encoding="utf-8") as fh:
    src = fh.read()

# 1) Add a `release` signing config right after `signingConfigs {`.
m = re.search(r"signingConfigs\s*\{", src)
if not m:
    print("ERROR: 'signingConfigs {' not found in build.gradle", file=sys.stderr)
    sys.exit(1)

release_cfg = """
        release {
            storeFile file('fakarny-upload.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias 'fakarny-upload'
            keyPassword System.getenv("KEY_PASSWORD")
        }"""
src = src[: m.end()] + release_cfg + src[m.end():]

# 2) Point the release buildType at signingConfigs.release.
bt = src.find("buildTypes")
if bt == -1:
    print("ERROR: 'buildTypes' not found in build.gradle", file=sys.stderr)
    sys.exit(1)
rel = src.find("release {", bt)
if rel == -1:
    print("ERROR: release buildType not found in build.gradle", file=sys.stderr)
    sys.exit(1)
needle = "signingConfig signingConfigs.debug"
idx = src.find(needle, rel)
if idx == -1:
    print("ERROR: release signingConfig line not found", file=sys.stderr)
    sys.exit(1)
src = src[:idx] + "signingConfig signingConfigs.release" + src[idx + len(needle):]

with open(PATH, "w", encoding="utf-8") as fh:
    fh.write(src)

print("Signing config injected OK")
