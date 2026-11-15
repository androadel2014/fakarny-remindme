// v1.1.2 DIAGNOSTIC: ads plugin intentionally NOT appended.
// The dynamic config previously re-added react-native-google-mobile-ads on top of
// app.json, which silently defeated the v1.1.1 plugin removal. Return base only.
const base = require('./app.json').expo;

module.exports = () => ({
  ...base,
  plugins: [...(base.plugins || [])],
});
