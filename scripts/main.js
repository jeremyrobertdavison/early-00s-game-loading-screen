const MODULE_ID = "early-00s-game-loading-screen";
const OVERLAY_ID = "e00s-loading-screen";

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
  // users should see it immediately after Foundry is ready.
  if (game.settings.get(MODULE_ID, SETTINGS.ACTIVE)) {
    showLoadingScreen();
  }
});

Hooks.on("getSceneControlButtons", controls => {
  if (!game.user?.isGM) return;

  controls.loadingScreen = {
    name: "loadingScreen",
    title: "Early 00s Loading Screen",
    icon: "fa-solid fa-compact-disc",
    order: 95,
    visible: true,

    // Foundry V13 and V14 both define activeTool as part of SceneControl.
    // A button must never be used as activeTool because buttons immediately fire
    // instead of remaining selected. Use a hidden inert tool as the palette state.
    activeTool: "loadingScreenIdle",
    tools: {
      loadingScreenIdle: {
        name: "loadingScreenIdle",
        title: "Loading Screen Controls",
        icon: "fa-solid fa-compact-disc",
        order: -1,
        active: true,
        visible: false
      },
      showLoadingScreen: {
        name: "showLoadingScreen",
        title: "Show Loading Screen to Everyone",
        icon: "fa-solid fa-play",
        order: 0,
        button: true,
        visible: true,
        onChange: () => runControlAction(requestShow)
      },
      hideLoadingScreen: {
        name: "hideLoadingScreen",
        title: "Hide Loading Screen for Everyone",
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
    }
  };
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
    onChange: active => {
      if (active) showLoadingScreen();
      else hideLoadingScreen();
    }
  });
}

async function requestShow() {
  if (!game.user?.isGM) return;
  await game.settings.set(MODULE_ID, SETTINGS.ACTIVE, true);
  showLoadingScreen();
}

async function requestHide() {
  if (!game.user?.isGM) return;
  await game.settings.set(MODULE_ID, SETTINGS.ACTIVE, false);
  hideLoadingScreen();
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
  if (!preview && document.getElementById(OVERLAY_ID)) return;
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
    overlay.style.setProperty("--e00s-loading-background", `url("${cssUrl(backgroundImage)}")`);
    overlay.classList.add("has-background-image");
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
          window.setTimeout(() => showLoadingScreen(), 250);
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

  const content = document.createElement("div");
  content.className = "e00s-config";
  content.innerHTML = `
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
    modal: true,
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
          }
        });
        picker.render({ force: true });
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

function cssUrl(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replace(/[\n\r\f]/g, "");
}
