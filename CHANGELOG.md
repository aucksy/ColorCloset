# Changelog

All notable changes to ColorCloset are documented here. This project follows
[Semantic Versioning](https://semver.org/); releases are cut by pushing a `vX.Y.Z` git tag,
which builds and publishes the signed APK to GitHub Releases.

## [1.0.0] — first GitHub release

The first build shipped through the self‑contained GitHub Actions pipeline.

### Added
- **First‑launch welcome carousel** showcasing the key features (style deck, four wardrobes,
  skin‑tone tuning, colour science) before onboarding.
- **GitHub Actions release pipeline** — tag‑driven, builds a signed arm64 release APK with
  Gradle and publishes it as a GitHub Release.
- Production `README`, `LICENSE`, and this changelog.

### Engine & app (carried into this release)
- Research‑backed colour engine: 17 base colours with a light→dark shade ramp, a curated
  45‑combination spine, and a generative principle scorer with the avoid‑list suppressed.
- Gender × Mode model — four wardrobes (Men/Women × Formal/Casual), Formal/Casual on the top bar,
  "Colours to buy" and "Colour science" in the side menu.
- 10‑point Monk Skin Tone picker; named shades + multi‑select shade picker.
- Style chips act as a filter with exhaust‑then‑advance; global "X of N" counter and a themed
  "worn them all" dialog; deterministic deck diversity.
- Google Drive + plain‑text backup/restore of the full multi‑wardrobe state.
- 94 unit/golden tests (engine + store).
