const base = require('./app.json').expo;
const ads = require('./admob.config.json');
const activeAds = ads.sets[ads.active];

module.exports = () => ({
  ...base,
  plugins: [
    ...(base.plugins || []),
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: activeAds.appIds.android,
        iosAppId: activeAds.appIds.ios,
      },
    ],
  ],
});
