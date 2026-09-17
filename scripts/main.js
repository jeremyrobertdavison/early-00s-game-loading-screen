const MODULE_ID = "early-00s-game-loading-screen";
const OVERLAY_ID = "e00s-loading-screen";
const GM_STATUS_ID = "e00s-loading-gm-status";

const SETTINGS = {
  BACKGROUND: "backgroundImage",
  MESSAGES: "messages",
  MESSAGE_INTERVAL: "messageInterval",
  ACTIVE: "active"
};

const DEFAULT_MESSAGES = [
  "Tip: The Game Master can replace this text with hints, lore, reminders, or anything else.",
  "Loading the next adventure...",
  "Some doors are locked for a reason. Others are locked because nobody found the key."
].join("\n");

let messageTimer = null;
let loadingTimer = null;
let currentMessageIndex = 0;
let currentLoadingIndex = 0;

Hooks.once("init", () => {
  registerSettings();
});

Hooks.once("ready", () => {
  // Make a small public API available for macros and other modules.
  const module = game.modules.get(MODULE_ID);
  if (module) {
    module.api = {
      show: () => requestShow(),
      hide: () => requestHide(),
      preview: () => showLoadingScreen({ preview: true }),
      configure: () => openConfiguration()
    };
  }

  // If the world was left with the loading screen active, newly connected
  // players should see it immediately. GMs get a non-blocking status panel
  // so they can keep navigating Foundry and preparing the next scene.
  applyActiveState(game.settings.get(MODULE_ID, SETTINGS.ACTIVE));
});

Hooks.on("getSceneControlButtons", controls => {
  if (!game.user?.isGM) return;

  const tools = {
    showLoadingScreen: {
      name: "showLoadingScreen",
      title: "Show Loading Screen to Players",
      icon: "fa-solid fa-play",
      order: 0,
      button: true,
      visible: true,
      onChange: () => runControlAction(requestShow)
    },
    hideLoadingScreen: {
      name: "hideLoadingScreen",
      title: "Hide Loading Screen from Players",
      icon: "fa-solid fa-stop",
      order: 1,
      button: true,
      visible: true,
      onChange: () => runControlAction(requestHide)
    },
    configureLoadingScreen: {
      name: "configureLoadingScreen",
      title: "Configure Loading Screen",
      icon: "fa-solid fa-gears",
      order: 2,
      button: true,
      visible: true,
      onChange: () => runControlAction(openConfiguration)
    }
  };

  const control = {
    name: "loadingScreen",
    title: "Early 00s Loading Screen",
    icon: "fa-solid fa-compact-disc",
    order: 95,
    visible: true,
    tools
  };

  // Foundry v13 requires SceneControl.activeTool. A button cannot be the
  // active tool because button tools immediately execute when selected.
  // Give v13 a real, visible, inert tool so SceneControls always resolves a
  // valid active tool. Foundry v14 makes activeTool optional, so its palette
  // can remain button-only and avoids an unnecessary extra tool.
  if (getFoundryGeneration() === 13) {
    tools.loadingScreenIdle = {
      name: "loadingScreenIdle",
      title: "Loading Screen Controls",
      icon: "fa-solid fa-compact-disc",
      order: -1,
      active: true,
      visible: true,
      onChange: () => {}
    };
    control.activeTool = "loadingScreenIdle";
  }

  controls.loadingScreen = control;
});

function runControlAction(action) {
  Promise.resolve()
    .then(() => action())
    .catch(error => {
      console.error(`${MODULE_ID} | Scene control action failed`, error);
      ui.notifications?.error("Early 00s Loading Screen encountered an error. Check the browser console (F12) for details.");
    });
}

function registerSettings() {
  game.settings.register(MODULE_ID, SETTINGS.BACKGROUND, {
    name: "Background Image",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });

  game.settings.register(MODULE_ID, SETTINGS.MESSAGES, {
    name: "Loading Messages",
    scope: "world",
    config: false,
    type: String,
    default: DEFAULT_MESSAGES
  });

  game.settings.register(MODULE_ID, SETTINGS.MESSAGE_INTERVAL, {
    name: "Message Interval",
    scope: "world",
    config: false,
    type: Number,
    default: 6
  });

  game.settings.register(MODULE_ID, SETTINGS.ACTIVE, {
    name: "Loading Screen Active",
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
    onChange: active => applyActiveState(active)
  });
}

async function requestShow() {
  if (!game.user?.isGM) return;
  await game.settings.set(MODULE_ID, SETTINGS.ACTIVE, true);
  // Apply locally as well. This also handles the case where ACTIVE was already
  // true and Foundry therefore had no setting change to broadcast.
  applyActiveState(true);
}

async function requestHide() {
  if (!game.user?.isGM) return;
  await game.settings.set(MODULE_ID, SETTINGS.ACTIVE, false);
  applyActiveState(false);
}

function applyActiveState(active) {
  if (active) {
    if (game.user?.isGM) {
      // The live loading screen is intended to hide prep from players, not
      // prevent the GM from doing that prep. Keep the GM's Foundry UI usable
      // and show a small non-blocking live-status panel instead.
      hideLoadingScreen();
      showGMStatusPanel();
    } else {
      hideGMStatusPanel();
      showLoadingScreen();
    }
    return;
  }

  hideLoadingScreen();
  hideGMStatusPanel();
}

function showGMStatusPanel() {
  if (!game.user?.isGM) return;
  if (document.getElementById(GM_STATUS_ID)) return;

  const panel = document.createElement("div");
  panel.id = GM_STATUS_ID;
  panel.className = "e00s-gm-status";
  panel.setAttribute("role", "status");
  panel.setAttribute("aria-live", "polite");

  const live = document.createElement("span");
  live.className = "e00s-gm-status-live";
  live.innerHTML = '<span class="e00s-live-dot" aria-hidden="true"></span> Loading Screen LIVE to Players';

  const previewButton = document.createElement("button");
  previewButton.type = "button";
  previewButton.className = "e00s-gm-status-button";
  previewButton.innerHTML = '<i class="fa-solid fa-eye" aria-hidden="true"></i><span>Preview</span>';
  previewButton.addEventListener("click", () => showLoadingScreen({ preview: true }));

  const endButton = document.createElement("button");
  endButton.type = "button";
  endButton.className = "e00s-gm-status-button e00s-gm-status-end";
  endButton.innerHTML = '<i class="fa-solid fa-stop" aria-hidden="true"></i><span>End</span>';
  endButton.addEventListener("click", () => runControlAction(requestHide));

  panel.append(live, previewButton, endButton);
  document.body.append(panel);
}

function hideGMStatusPanel() {
  document.getElementById(GM_STATUS_ID)?.remove();
}

function getMessages(rawOverride) {
  const raw = rawOverride ?? game.settings.get(MODULE_ID, SETTINGS.MESSAGES) ?? "";
  const messages = String(raw)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  return messages.length ? messages : ["Loading..."];
}

function getMessageIntervalMs(intervalOverride) {
  const seconds = Number(intervalOverride ?? game.settings.get(MODULE_ID, SETTINGS.MESSAGE_INTERVAL));
  return Math.max(2, Math.min(60, Number.isFinite(seconds) ? seconds : 6)) * 1000;
}

function showLoadingScreen({ preview = false, config = null } = {}) {
  // A live loading screen never blocks a GM. Preview is the deliberate
  // exception so the GM can inspect exactly what players will see.
  if (!preview && game.user?.isGM) {
    showGMStatusPanel();
    return;
  }

  if (!preview && document.getElementById(OVERLAY_ID)) return;
  if (preview) hideGMStatusPanel();
  hideLoadingScreen();

  const backgroundImage = String(config?.backgroundImage ?? game.settings.get(MODULE_ID, SETTINGS.BACKGROUND) ?? "").trim();
  const messages = getMessages(config?.messages);
  currentMessageIndex = 0;
  currentLoadingIndex = 0;

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.className = "e00s-loading-screen";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Game loading screen");

  if (backgroundImage) {
    const background = document.createElement("img");
    background.className = "e00s-loading-background-image";
    background.alt = "";
    background.setAttribute("aria-hidden", "true");
    loadBackgroundImage(background, backgroundImage);
    overlay.append(background);
  }

  const vignette = document.createElement("div");
  vignette.className = "e00s-loading-vignette";

  const tipFrame = document.createElement("div");
  tipFrame.className = "e00s-tip-frame";

  const tipLabel = document.createElement("div");
  tipLabel.className = "e00s-tip-label";
  tipLabel.textContent = "LOADING DATA";

  const tip = document.createElement("div");
  tip.className = "e00s-loading-tip";
  tip.textContent = messages[0];

  tipFrame.append(tipLabel, tip);

  const status = document.createElement("div");
  status.className = "e00s-loading-status";

  const loadingWord = document.createElement("span");
  loadingWord.className = "e00s-loading-word";
  loadingWord.textContent = "Loading";

  const loadingDots = document.createElement("span");
  loadingDots.className = "e00s-loading-dots";
  loadingDots.setAttribute("aria-hidden", "true");
  loadingDots.textContent = ".";

  status.append(loadingWord, document.createTextNode(" "), loadingDots);

  overlay.append(vignette, tipFrame, status);

  if (game.user?.isGM || preview) {
    const gmControls = document.createElement("div");
    gmControls.className = "e00s-gm-controls";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "e00s-gm-close";
    const closeLabel = preview ? "Close Preview" : "End Loading Screen";
    closeButton.innerHTML = `<i class="fa-solid fa-xmark" aria-hidden="true"></i><span>${closeLabel}</span>`;
    closeButton.addEventListener("click", () => {
      if (preview) {
        hideLoadingScreen();
        if (game.settings.get(MODULE_ID, SETTINGS.ACTIVE)) {
          window.setTimeout(() => applyActiveState(true), 250);
        }
      } else requestHide();
    });

    gmControls.append(closeButton);
    overlay.append(gmControls);
  }

  document.body.append(overlay);

  // Force one layout pass so the entrance transition is visible.
  requestAnimationFrame(() => overlay.classList.add("is-visible"));

  if (messages.length > 1) {
    messageTimer = window.setInterval(() => {
      currentMessageIndex = (currentMessageIndex + 1) % messages.length;
      cycleMessage(tip, messages[currentMessageIndex]);
    }, getMessageIntervalMs(config?.messageInterval));
  }

  const loadingStates = [".", ". o", ". o O", ". o O o"];
  loadingTimer = window.setInterval(() => {
    currentLoadingIndex = (currentLoadingIndex + 1) % loadingStates.length;
    loadingDots.textContent = loadingStates[currentLoadingIndex];
  }, 450);
}

function hideLoadingScreen() {
  if (messageTimer) {
    clearInterval(messageTimer);
    messageTimer = null;
  }

  if (loadingTimer) {
    clearInterval(loadingTimer);
    loadingTimer = null;
  }

  const overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) return;

  overlay.classList.remove("is-visible");
  window.setTimeout(() => overlay.remove(), 220);
}

function cycleMessage(element, nextMessage) {
  element.classList.add("is-changing");

  window.setTimeout(() => {
    element.textContent = nextMessage;
    element.classList.remove("is-changing");
    element.classList.add("is-entering");
    requestAnimationFrame(() => element.classList.remove("is-entering"));
  }, 240);
}

async function openConfiguration() {
  if (!game.user?.isGM) return;

  const currentBackground = String(game.settings.get(MODULE_ID, SETTINGS.BACKGROUND) ?? "");
  const currentMessages = String(game.settings.get(MODULE_ID, SETTINGS.MESSAGES) ?? "");
  const currentInterval = Number(game.settings.get(MODULE_ID, SETTINGS.MESSAGE_INTERVAL) ?? 6);

  // DialogV2 accepts an HTMLDivElement as content in Foundry v13/v14, but
  // ApplicationV2 requires the content *root* element itself to have no
  // attributes. Keep the root deliberately empty and put our class/attributes
  // on a nested element. This avoids "config.content element must have no
  // attributes" while preserving all form markup and data attributes.
  const content = document.createElement("div");
  content.innerHTML = `
    <div class="e00s-config">
      <p class="e00s-config-intro">
        Build a classic early-2000s-style transition screen for scene changes, breaks, travel, or dramatic reveals.
      </p>

      <div class="form-group">
        <label for="e00s-background">Background Image</label>
        <div class="form-fields e00s-file-field">
          <input id="e00s-background" name="backgroundImage" type="text" value="${escapeHtml(currentBackground)}" placeholder="path/to/image.webp">
          <button type="button" data-action="browse-background" class="e00s-browse-button">
            <i class="fa-solid fa-folder-open" aria-hidden="true"></i> Browse
          </button>
        </div>
        <p class="hint">Choose an image from Foundry's file browser. Leave blank for the built-in dark gradient.</p>
      </div>

      <div class="form-group stacked">
        <label for="e00s-messages">Loading Text</label>
        <textarea id="e00s-messages" name="messages" rows="9" placeholder="One hint or lore entry per line">${escapeHtml(currentMessages)}</textarea>
        <p class="hint">Enter one message per line. The module cycles through them while the loading screen is visible.</p>
      </div>

      <div class="form-group">
        <label for="e00s-interval">Seconds Between Messages</label>
        <div class="form-fields">
          <input id="e00s-interval" name="messageInterval" type="number" min="2" max="60" step="1" value="${currentInterval}">
        </div>
        <p class="hint">Allowed range: 2–60 seconds.</p>
      </div>
    </div>
  `;

  const DialogV2 = getDialogV2Class();
  if (!DialogV2?.wait) {
    throw new Error("DialogV2 is unavailable. Early 00s Game Loading Screen requires Foundry VTT 13 or newer.");
  }

  const result = await DialogV2.wait({
    window: {
      title: "Early 00s Loading Screen — Configuration",
      icon: "fa-solid fa-compact-disc"
    },
    content,
    // This dialog launches Foundry's FilePicker. It must be non-modal so the
    // picker can receive pointer/keyboard input instead of sitting behind the
    // DialogV2 modal interaction layer.
    modal: false,
    buttons: [
      {
        action: "preview",
        label: "Preview",
        icon: "fa-solid fa-eye",
        callback: (_event, button) => ({
          action: "preview",
          values: readConfigurationForm(button.form)
        })
      },
      {
        action: "save",
        label: "Save",
        icon: "fa-solid fa-floppy-disk",
        default: true,
        callback: (_event, button) => ({
          action: "save",
          values: readConfigurationForm(button.form)
        })
      },
      {
        action: "cancel",
        label: "Cancel",
        icon: "fa-solid fa-ban"
      }
    ],
    render: (_event, dialog) => {
      const root = dialog.element;
      const browse = root.querySelector('[data-action="browse-background"]');
      const input = root.querySelector('input[name="backgroundImage"]');

      browse?.addEventListener("click", () => {
        const Picker = getFilePickerClass();
        if (!Picker) {
          ui.notifications?.error("Foundry's File Picker is unavailable on this client.");
          return;
        }

        const picker = new Picker({
          type: "image",
          current: input?.value || "",
          callback: path => {
            if (input) input.value = path;
            // Return focus to the configuration window after a selection.
            dialog.bringToFront?.();
          }
        });

        // FilePicker is an ApplicationV2 in Foundry v13/v14. Rendering is
        // asynchronous, so wait until it exists in the DOM before explicitly
        // bringing it to the front of the application stack. This protects
        // against theme/module z-index differences without hard-coding CSS.
        Promise.resolve(picker.render({ force: true }))
          .then(() => picker.bringToFront?.())
          .catch(error => {
            console.error(`${MODULE_ID} | File picker failed to open`, error);
            ui.notifications?.error("Could not open Foundry's file browser. Check the browser console (F12) for details.");
          });
      });
    },
    rejectClose: false
  });

  if (!result || result === "cancel") return;

  if (result.action === "preview") {
    showLoadingScreen({ preview: true, config: result.values });
    return;
  }

  if (result.action === "save") {
    await saveConfiguration(result.values);
  }
}

function readConfigurationForm(form) {
  const backgroundImage = form?.elements?.backgroundImage?.value ?? "";
  const messages = form?.elements?.messages?.value ?? "";
  const messageInterval = Number(form?.elements?.messageInterval?.value ?? 6);

  return {
    backgroundImage: String(backgroundImage).trim(),
    messages: String(messages),
    messageInterval: Math.max(2, Math.min(60, Number.isFinite(messageInterval) ? messageInterval : 6))
  };
}

async function saveConfiguration(values) {
  await Promise.all([
    game.settings.set(MODULE_ID, SETTINGS.BACKGROUND, values.backgroundImage),
    game.settings.set(MODULE_ID, SETTINGS.MESSAGES, values.messages),
    game.settings.set(MODULE_ID, SETTINGS.MESSAGE_INTERVAL, values.messageInterval)
  ]);

  ui.notifications?.info("Early 00s Loading Screen settings saved.");
}

function getFoundryGeneration() {
  const generation = Number(game.release?.generation);
  if (Number.isFinite(generation) && generation > 0) return generation;

  // Defensive fallback for unusual/transitional builds.
  const major = Number.parseInt(String(game.version ?? "").split(".")[0], 10);
  return Number.isFinite(major) ? major : 14;
}

function getDialogV2Class() {
  // Namespaced location in Foundry V13 and V14. The global fallback makes the
  // module more tolerant of transitional builds without changing behavior.
  return globalThis.foundry?.applications?.api?.DialogV2 ?? globalThis.DialogV2 ?? null;
}

function getFilePickerClass() {
  // Namespaced location in Foundry V13 and V14, with a legacy/global fallback.
  return globalThis.foundry?.applications?.apps?.FilePicker ?? globalThis.FilePicker ?? null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadBackgroundImage(img, rawPath) {
  const candidates = getBackgroundImageCandidates(rawPath);
  let index = 0;

  const tryNext = () => {
    if (index >= candidates.length) {
      const message = `Could not load loading-screen background image: ${rawPath}`;
      console.error(`${MODULE_ID} | ${message}`, { rawPath, candidates });
      if (game.user?.isGM) {
        ui.notifications?.warn("The loading-screen background image could not be loaded. Check the browser console (F12) for the attempted URL.");
      }
      img.remove();
      return;
    }

    img.src = candidates[index++];
  };

  img.addEventListener("error", tryNext);
  tryNext();
}

function getBackgroundImageCandidates(rawPath) {
  const path = String(rawPath ?? "").trim();
  if (!path) return [];

  // Absolute/network URLs already contain everything required to fetch them.
  if (/^(?:https?:|data:|blob:|\/\/)/i.test(path)) return [path];

  const candidates = [];
  const getRoute = globalThis.foundry?.utils?.getRoute;

  // Foundry's getRoute applies the server route prefix when one is configured.
  // This is important for installations served from a sub-path or reverse proxy.
  if (typeof getRoute === "function") {
    try {
      candidates.push(getRoute(path));
    } catch (error) {
      console.warn(`${MODULE_ID} | Foundry getRoute could not resolve background path`, error);
    }
  }

  // Keep the raw FilePicker path as a compatibility fallback.
  candidates.push(path);
  return [...new Set(candidates.filter(Boolean))];
}
