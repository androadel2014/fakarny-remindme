import { Platform } from 'react-native';
import Constants from 'expo-constants';
import adsConfig from '../../admob.config.json';

const ACTIVE_ADS = adsConfig.sets[adsConfig.active as keyof typeof adsConfig.sets];
export const ADMOB_CONFIG = ACTIVE_ADS;

type AdsRuntime = {
  default?: () => { initialize: () => Promise<unknown> };
  AdsConsent?: { gatherConsent?: () => Promise<unknown> };
  AdEventType: { LOADED: string; CLOSED: string; ERROR: string };
  InterstitialAd: { createForAdRequest: (id: string, options?: object) => any };
};

let runtime: AdsRuntime | null | undefined;
let interstitial: any = null;
let interstitialLoaded = false;
let interstitialShownThisSession = false;
let showRequested = false;
let initialization: Promise<void> | null = null;

function getRuntime(): AdsRuntime | null {
  if (runtime !== undefined) return runtime;
  if (Constants.appOwnership === 'expo') {
    runtime = null;
    return runtime;
  }
  try {
    runtime = require('react-native-google-mobile-ads') as AdsRuntime;
  } catch {
    runtime = null;
  }
  return runtime;
}

function unitId(kind: 'banner' | 'interstitial'): string {
  const values = ACTIVE_ADS[kind];
  return Platform.OS === 'ios' ? values.ios : values.android;
}

export function getBannerAdUnitId(): string {
  return unitId('banner');
}

export async function initializeAds(): Promise<void> {
  if (!ACTIVE_ADS.enabled || initialization) return initialization ?? Promise.resolve();
  initialization = (async () => {
    const ads = getRuntime();
    if (!ads) return;
    try {
      // UMP checks whether a consent form is required in the user's region.
      // If the optional consent API is unavailable/fails, ads still use the
      // non-personalized request configuration below and the app stays usable.
      try { await ads.AdsConsent?.gatherConsent?.(); } catch { /* Ads remain optional. */ }
      const mobileAdsFactory = ads.default ?? (ads as unknown as () => { initialize: () => Promise<unknown> });
      await mobileAdsFactory().initialize();
      interstitial = ads.InterstitialAd.createForAdRequest(unitId('interstitial'), {
        requestNonPersonalizedAdsOnly: true,
      });
      interstitial.addAdEventListener(ads.AdEventType.LOADED, () => {
        interstitialLoaded = true;
      });
      interstitial.addAdEventListener(ads.AdEventType.CLOSED, () => {
        interstitialLoaded = false;
        if (!interstitialShownThisSession) {
          try { interstitial?.load(); } catch { /* Ads are optional. */ }
        }
      });
      interstitial.addAdEventListener(ads.AdEventType.ERROR, () => {
        interstitialLoaded = false;
      });
      interstitial.load();
    } catch {
      // Ads are an optional enhancement; never block local app features.
      interstitial = null;
      interstitialLoaded = false;
    }
  })();
  return initialization;
}

/** Called only after the user confirms finishing a shopping trip. */
export async function showInterstitialAfterFinish(): Promise<void> {
  if (interstitialShownThisSession || showRequested || !interstitialLoaded || !interstitial) return;
  showRequested = true;
  try {
    await interstitial.show();
    interstitialShownThisSession = true;
  } catch {
    // If an ad cannot be shown, a later natural break may try again.
  } finally {
    showRequested = false;
  }
}
