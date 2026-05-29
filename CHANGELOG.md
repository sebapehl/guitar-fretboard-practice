# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-05-29

### Added
- **XP & Leveling System:** Gamified progression where users earn XP for speed and complexity.
- **PWA Support:** App is now installable on home screens with offline caching capabilities.
- **Haptic Feedback:** Physical vibrations on mobile for HIT/MISS feedback.
- **Victory Celebration:** Confetti animations for perfect rounds and level-ups.

## [1.1.0.0] - 2026-05-20

### Added
- **Positional Practice Mode:** Introducing "Position Lock" to focus on specific 5-fret neighborhoods.
- **Smooth Viewport Scrolling:** The fretboard now glides smoothly between positions, preserving spatial consistency.
- **Advanced Metadata Tracking:** Cloud-saved scores now include positional data and anchor points for richer analysis.

### Changed
- **Full Neck Rendering:** Optimized the UI to render frets 0-22 for a more immersive and native mobile feel.
- **Note Name Unification:** Standardized note identifying logic across the application for better maintainability.

### Fixed
- **Modulo Bug:** Resolved an edge case where negative fret math would cause out-of-bounds errors.
- **Mid-game Toggle:** Fixed a race condition where toggling Position Lock during a round could corrupt answer validation.
- **Touch Targets:** Increased the size of mobile settings controls to meet ergonomic standards.
