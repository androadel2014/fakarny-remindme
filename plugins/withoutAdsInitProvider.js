// Removes the Google Mobile Ads SDK auto-initialization ContentProvider
// (com.google.android.gms.ads.MobileAdsInitProvider) from the merged
// Android manifest via tools:node="remove" — Google's documented pattern
// for manual-init setups. Diagnostic basis (Nov 15, 2026): v1.1.2 (no ads
// SDK) opens; v1.1.3 (SDK + JS ads active) closes at startup; v1.1.4 (SDK
// present, ALL JS ads usage inert) still closes — the only component that
// runs uninvited at startup is this provider, so it is the prime suspect.
const { withAndroidManifest } = require('expo/config-plugins');

const PROVIDER_NAME = 'com.google.android.gms.ads.MobileAdsInitProvider';

module.exports = function withoutAdsInitProvider(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    if (!manifest.manifest.$) manifest.manifest.$ = {};
    manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    const app = manifest.manifest.application[0];
    if (!Array.isArray(app.provider)) app.provider = [];
    const existing = app.provider.find(
      (p) => p && p.$ && p.$['android:name'] === PROVIDER_NAME
    );
    if (existing) {
      existing.$['tools:node'] = 'remove';
    } else {
      app.provider.push({
        $: {
          'android:name': PROVIDER_NAME,
          'tools:node': 'remove',
        },
      });
    }
    return config;
  });
};
