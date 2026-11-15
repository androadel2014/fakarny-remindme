// v1.1.3+: all plugins (firebase, ads) are registered ONCE in app.json (single source of truth).
// This dynamic config must NEVER append plugins again — the v1.1.0/v1.1.1 double-registration era is over.
// (History: the dynamic config previously re-added react-native-google-mobile-ads on top of
// app.json, which silently defeated the v1.1.1 plugin removal.) Return base only.
const base = require('./app.json').expo;

module.exports = () => ({
  ...base,
  plugins: [...(base.plugins || [])],
});
