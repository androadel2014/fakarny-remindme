import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import Constants from 'expo-constants';
import { ADMOB_CONFIG, getBannerAdUnitId } from '../services/ads';

let NativeAds: any = null;
if (Constants.appOwnership !== 'expo') {
  try { NativeAds = require('react-native-google-mobile-ads'); } catch { NativeAds = null; }
}

export default function AdBanner() {
  const [failed, setFailed] = useState(false);
  if (!ADMOB_CONFIG.enabled) return null;
  if (!NativeAds?.BannerAd || !NativeAds?.BannerAdSize || failed) return null;
  const Banner = NativeAds.BannerAd;
  return (
    <View style={{ minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
      <Banner
        unitId={getBannerAdUnitId()}
        size={NativeAds.BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}
