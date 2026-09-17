# Early 00s Game Loading Screen

A Foundry Virtual Tabletop module that adds a customizable full-screen loading screen inspired by early-2000s video games.

Use it while changing scenes, moving the party between locations, taking a short break, preparing an encounter, or whenever you want to hide the tabletop behind a little atmosphere. While players remain on the loading screen, the GM can continue navigating Foundry and preparing scenes normally.

The Game Master chooses the background image and supplies any number of rotating messages. Those messages can be gameplay hints, setting lore, recaps, jokes, reminders, quotations, or anything else that fits the campaign. While the screen is active, an animated classic-style indicator loops through:

```text
Loading .
Loading . o
Loading . o O
Loading . o O o
```

## Features

- Full-screen loading overlay synchronized to connected players.
- **GM Prep Mode:** the live loading screen blocks players but leaves the GM free to navigate scenes, open sheets, configure encounters, and continue preparing.
- Compact GM-only **LIVE** panel with **Preview** and **End** controls while the loading screen is active.
- GM-controlled **Show**, **Hide**, and **Configure** tools in Foundry's scene controls.
- Custom background image selected from Foundry's file browser.
- Rotating loading text with one message per line.
- Configurable time between messages.
- Early-2000s-inspired presentation with subtle scanlines, vignette, tip panel, and animated loading indicator.
- Full-screen local Preview mode so the GM can inspect exactly what players will see.
- Persists the active state so a player who connects or reloads while the screen is active will still see it.
- Small module API for macros and integrations.
- No game-system dependency.

## Compatibility

| Foundry VTT | Status |
| --- | --- |
| Version 14 | Supported / verified target |
| Version 13 | Supported |

The module uses APIs documented in both Foundry VTT v13 and v14, including `getSceneControlButtons`, `DialogV2`, and `FilePicker`. The scene-control implementation adapts to the v13 requirement for an active tool while using a button-only palette on v14. It is system agnostic and does not require any other Foundry modules. The configuration dialog is intentionally non-modal so Foundry's native FilePicker can open above it and remain fully interactive.

## Installation

### Install from a Manifest URL

In Foundry VTT:

1. Open **Add-on Modules** from the Setup screen.
2. Choose **Install Module**.
3. Paste the following Manifest URL into the **Manifest URL** field:

```text
https://raw.githubusercontent.com/jeremyrobertdavison/early-00s-game-loading-screen/main/module.json
```

4. Click **Install**.
5. Enable **Early 00s Game Loading Screen** in your world's **Manage Modules** window.

### Manual Installation

1. Download `early-00s-game-loading-screen.zip` from the latest GitHub release.
2. Extract it into your Foundry user-data module directory so the final path is:

```text
Data/modules/early-00s-game-loading-screen/
```

3. Restart Foundry VTT if it is already running.
4. Enable the module in **Manage Modules** for the desired world.

## Usage

After enabling the module, a **Loading Screen** control appears in the scene controls for Game Masters.

It contains three tools:

- **Show Loading Screen to Players** — displays the configured full-screen loading screen to connected non-GM clients. The GM remains in the normal Foundry interface.
- **Hide Loading Screen from Players** — removes the loading screen from connected players.
- **Configure Loading Screen** — changes the background image, loading messages, and message timing.

When the live loading screen is active, the GM does **not** get covered by the overlay. Instead, a compact **Loading Screen LIVE to Players** panel appears at the top of the GM interface with **Preview** and **End** buttons. **Preview** temporarily shows the full loading screen only to the GM; closing the preview returns the GM to prep mode while players remain on the loading screen.

### GM Prep Mode

This is designed for exactly the situation where the GM needs a few minutes behind the curtain. Start the loading screen, then continue using Foundry normally: browse scenes, open journals and actors, place tokens, adjust walls or lighting, and prepare the next encounter. The players remain covered until the GM clicks **End** or **Hide Loading Screen from Players**.

The regular **Preview** command is intentionally different: Preview covers the GM's own screen so the GM can verify the artwork and messages without changing what players are currently seeing.

## Configuring the Screen

### Background Image

Choose any image available through Foundry's file browser. Wide images generally work best because the image is displayed using a cover-style layout and automatically crops as necessary to fill the screen.

The module renders the selected background as a real image layer rather than a CSS URL. For Foundry-hosted files it resolves the path through Foundry's route helper, which also supports servers running behind a route prefix or reverse proxy. Absolute HTTP(S), data, and blob URLs are preserved as-is.

If no image is selected, or if the selected image cannot be loaded, the module falls back to its built-in dark gradient background. Game Masters also receive a warning and a console entry if the selected image fails to load.

### Loading Text

Enter one message per line. For example:

```text
The old subway tunnels predate the modern city by decades.
Some enemies can hear you before they can see you.
Rumor says the observatory has been abandoned since 1987.
Remember: you can spend Inspiration after seeing the roll.
```

The module cycles through the non-empty lines for as long as the loading screen remains visible.

### Message Timing

The time between loading messages can be set from **2 to 60 seconds**.

## Macro / Module API

After Foundry's `ready` hook, the module exposes a small API:

```js
const loadingScreen = game.modules.get("early-00s-game-loading-screen").api;
```

Available methods:

```js
loadingScreen.show();       // GM: show the loading screen to players
loadingScreen.hide();       // GM: hide the loading screen from players
loadingScreen.preview();    // preview locally
loadingScreen.configure();  // GM: open configuration
```

This makes it possible to integrate the loading screen with macros, other modules, or campaign-specific automation.

## Suggested Uses

The loading messages are intentionally free-form. Some ideas:

- Rules reminders and gameplay hints
- World lore and historical facts
- Session recap fragments
- NPC rumors
- Travel descriptions
- Mission briefings
- Fake developer tips
- In-world advertisements
- Campaign jokes and running gags
- Ominous foreshadowing

## For Developers

The project intentionally keeps its implementation lightweight:

```text
early-00s-game-loading-screen/
├── .github/
│   └── workflows/
│       └── release.yml
├── scripts/
│   └── main.js
├── styles/
│   └── loading-screen.css
├── CHANGELOG.md
├── LICENSE
├── README.md
└── module.json
```

The module uses Foundry's standard hooks, world settings, scene controls, FilePicker, and DialogV2 APIs. It does not require a JavaScript framework or third-party library.

### Creating a Release

1. Update the version in `module.json`.
2. Update the `download` URL in `module.json` to use the same version tag.
3. Commit and push your changes.
4. Create and push a matching Git tag, for example:

```bash
git tag v1.0.6
git push origin v1.0.6
```

The included GitHub Actions workflow packages the module when a version tag is pushed. It creates the GitHub release if one does not exist, or uploads/replaces the release assets if you created the release in GitHub first.

## Contributing

Bug reports, ideas, and pull requests are welcome. Please use the repository's GitHub Issues page for reproducible bugs and feature requests.

When reporting a bug, include:

- Foundry VTT version
- Game system and version
- Browser, if relevant
- Steps to reproduce the issue
- Any errors from the browser developer console

## License

Released under the [MIT License](LICENSE).

## Disclaimer

This is an independent community project for Foundry Virtual Tabletop. It is not affiliated with or endorsed by Foundry Gaming LLC.

Foundry Virtual Tabletop is a trademark of Foundry Gaming LLC.
