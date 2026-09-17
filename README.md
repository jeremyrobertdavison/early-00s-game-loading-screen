# Early 00s Game Loading Screen

A Foundry Virtual Tabletop module that adds a customizable full-screen loading screen inspired by early-2000s video games.

Use it while changing scenes, moving the party between locations, taking a short break, preparing an encounter, or whenever you want to hide the tabletop behind a little atmosphere.

The Game Master chooses the background image and supplies any number of rotating messages. Those messages can be gameplay hints, setting lore, recaps, jokes, reminders, quotations, or anything else that fits the campaign. While the screen is active, an animated classic-style indicator loops through:

```text
Loading .
Loading . o
Loading . o O
Loading . o O o
```

## Features

- Full-screen loading overlay synchronized to connected players.
- GM-controlled **Show**, **Hide**, and **Configure** tools in Foundry's scene controls.
- Custom background image selected from Foundry's file browser.
- Rotating loading text with one message per line.
- Configurable time between messages.
- Early-2000s-inspired presentation with subtle scanlines, vignette, tip panel, and animated loading indicator.
- GM-only button on the active loading screen to end it for everyone.
- Persists the active state so a player who connects or reloads while the screen is active will still see it.
- Small module API for macros and integrations.
- No game-system dependency.

## Compatibility

| Foundry VTT | Status |
| --- | --- |
| Version 14 | Verified |
| Version 13 | Minimum supported version |

The module is system agnostic and does not require any other Foundry modules.

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

- **Show Loading Screen to Everyone** — displays the configured loading screen to all connected clients.
- **Hide Loading Screen for Everyone** — removes the loading screen from all clients.
- **Configure Loading Screen** — changes the background image, loading messages, and message timing.

When the loading screen is active, the GM also sees an **End Loading Screen** button in the upper-right corner. Players do not see this control.

## Configuring the Screen

### Background Image

Choose any image available through Foundry's file browser. Wide images generally work best because the image is displayed using a cover-style layout and automatically crops as necessary to fill the screen.

If no image is selected, the module uses a built-in dark gradient background.

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
loadingScreen.show();       // GM: show the loading screen to everyone
loadingScreen.hide();       // GM: hide the loading screen for everyone
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

The module uses Foundry's standard hooks, settings, socket connection, FilePicker, and DialogV2 APIs. It does not require a JavaScript framework or third-party library.

### Creating a Release

1. Update the version in `module.json`.
2. Update the `download` URL in `module.json` to use the same version tag.
3. Commit and push your changes.
4. Create and push a matching Git tag, for example:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The included GitHub Actions workflow packages the module and creates the GitHub release automatically.

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
