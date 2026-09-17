# Changelog

All notable changes to **Early 00s Game Loading Screen** will be documented in this file.

The project follows [Semantic Versioning](https://semver.org/).

## [1.0.2] - 2026-09-17

### Changed

- Added explicit Foundry VTT v13 and v14 scene-control compatibility.
- Added a hidden inert scene-control tool so the custom control palette has a valid `activeTool` without accidentally firing Show, Hide, or Configure.
- Added resilient DialogV2 and FilePicker lookups for v13/v14 namespaced APIs.
- Kept the minimum Foundry version at v13 and verified compatibility metadata through v14.

### Fixed

- Prevents button tools from ever being treated as the active scene-control tool on Foundry v13 or v14.

## [1.0.1] - 2026-09-17

### Fixed

- Fixed the loading screen starting automatically when its scene-control palette was opened or closed.
- Fixed the Configure tool appearing unresponsive because the loading overlay could open over the configuration dialog.
- Removed the invalid default `activeTool` assignment from the button-only Foundry VTT v14 scene-control group.
- Added console logging and a visible notification if a scene-control action fails.

## [1.0.0] - 2026-09-17

### Added

- Initial public release.
- GM scene-control tools for showing, hiding, and configuring the loading screen.
- Synchronized loading-screen display for connected players.
- Custom background image support through Foundry's file browser.
- Rotating hints, lore, or other GM-supplied loading messages.
- Configurable message rotation interval.
- Animated `Loading . o O o` indicator.
- GM-only emergency/end control on the full-screen overlay.
- Active-state persistence for reconnecting or reloading users.
- Public API for macros and integrations.
- Automated GitHub release workflow.
