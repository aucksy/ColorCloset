/**
 * Config plugin: build native libraries for arm64-v8a only.
 *
 * A universal APK ships .so files for arm64-v8a, armeabi-v7a, x86 and x86_64 —
 * roughly 4x the native payload. Limiting to arm64-v8a (every phone from ~2017 on)
 * roughly halves the APK. Trade-off: it won't install on 32-bit-only devices or
 * x86/x86_64 emulators. For a Play Store release use an .aab (per-device delivery)
 * instead, which makes this unnecessary.
 */
const { withGradleProperties } = require('@expo/config-plugins');

module.exports = function withAndroidAbiFilter(config) {
  return withGradleProperties(config, (cfg) => {
    const key = 'reactNativeArchitectures';
    const value = 'arm64-v8a';
    const existing = cfg.modResults.find((p) => p.type === 'property' && p.key === key);
    if (existing) {
      existing.value = value;
    } else {
      cfg.modResults.push({ type: 'property', key, value });
    }
    return cfg;
  });
};
