import adsConfig from '../../admob.config.json';

// Web stub: AdMob is native-only. Metro resolves this file instead of
// ads.ts for web builds so the native package never enters the web bundle.
// Ads simply do not appear on web; every other feature works identically.
const ACTIVE_ADS = adsConfig.sets[adsConfig.active as keyof typeof adsConfig.sets];
export const ADMOB_CONFIG = ACTIVE_ADS;

export function getBannerAdUnitId(): string {
  return '';
}

export async function initializeAds(): Promise<void> {}

export async function showInterstitialAfterFinish(): Promise<void> {}
