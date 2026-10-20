(() => {
  "use strict";

  const STORAGE_KEY = "polytrack.gameController";
  const ACTIONS = [
    { id: "accelerate", label: "Vehicle accelerate", code: "ArrowUp", initial: ["b7", ""] },
    { id: "brake", label: "Vehicle brake", code: "ArrowDown", initial: ["b6", ""] },
    { id: "left", label: "Vehicle turn left", code: "ArrowLeft", initial: ["a0-", ""] },
    { id: "right", label: "Vehicle turn right", code: "ArrowRight", initial: ["a0+", ""] },
    { id: "reset", label: "Vehicle reset", code: "KeyR", initial: ["b8", ""] },
    { id: "pause", label: "Pause", code: "Escape", initial: ["b9", ""] },
    { id: "camera", label: "Vehicle cockpit camera", code: "KeyC", initial: ["b3", ""] },
    { id: "menuSelect", label: "Menu select (A / Cross)", code: "Enter", initial: ["b0", ""] },
    { id: "menuBack", label: "Menu back (B / Circle)", code: "Escape", initial: ["b1", ""] }
  ];
  const BUTTON_NAMES = [
    "A / Cross", "B / Circle", "X / Square", "Y / Triangle",
    "LB / L1", "RB / R1", "LT / L2", "RT / R2",
    "View / Share", "Menu / Options", "L3", "R3",
    "D-pad Up", "D-pad Down", "D-pad Left", "D-pad Right"
  ];
  const TESTS = [
    { id: "axis0", label: "Left stick · horizontal", axis: 0 },
    { id: "axis1", label: "Left stick · vertical", axis: 1 },
    { id: "axis2", label: "Right stick · horizontal", axis: 2 },
    { id: "axis3", label: "Right stick · vertical", axis: 3 },
    { id: "button6", label: "LT / L2 trigger", button: 6 },
    { id: "button7", label: "RT / R2 trigger", button: 7 }
  ];

  let preferences = {};
  let activePad = null;
  let wasDown = Object.create(null);
  let testNodes = Object.create(null);
  let statusNode = null;
  let capture = null;
  let capturedInput = "";
  try { preferences = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (_) {}
  if (!preferences.bindings) preferences.bindings = {};
  ACTIONS.forEach(action => {
    const saved = preferences.bindings[action.id];
    if (typeof saved === "string") preferences.bindings[action.id] = [saved, ""];
    else if (!Array.isArray(saved)) preferences.bindings[action.id] = action.initial.slice();
    else preferences.bindings[action.id] = [saved[0] || "", saved[1] || ""];
  });
  preferences.vibration = preferences.vibration === true;

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch (_) {}
  }
  save();

  const focusStyle = document.createElement("style");
  focusStyle.textContent = "#ui .gamepad-focus-outline{outline:3px solid #fff!important;outline-offset:3px!important;position:relative;z-index:20}";
  (document.head || document.documentElement).appendChild(focusStyle);
  let focusedMenuTarget = null;

  function menuTargets() {
    return Array.from(document.querySelectorAll("#ui button, #ui [role=button], #ui a[href], #ui input, #ui select, #ui [tabindex]"))
      .filter(element => {
        if (element.disabled || element.getAttribute("aria-disabled") === "true") return false;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0;
      });
  }

  function focusMenuTarget(target) {
    if (focusedMenuTarget) focusedMenuTarget.classList.remove("gamepad-focus-outline");
    focusedMenuTarget = target || null;
    if (focusedMenuTarget) {
      focusedMenuTarget.classList.add("gamepad-focus-outline");
      try { focusedMenuTarget.focus({ preventScroll: true }); } catch (_) { focusedMenuTarget.focus(); }
    }
  }

  function moveMenuFocus(direction) {
    const targets = menuTargets();
    if (!targets.length) return false;
    let current = targets.indexOf(focusedMenuTarget);
    if (current < 0) current = targets.indexOf(document.activeElement);
    if (current < 0) current = direction === "up" || direction === "left" ? 0 : -1;
    const origin = current >= 0 ? targets[current].getBoundingClientRect() : null;
    const cx = origin ? origin.left + origin.width / 2 : 0;
    const cy = origin ? origin.top + origin.height / 2 : 0;
    let best = null, bestScore = Infinity;
    if (origin) targets.forEach((target, index) => {
      if (index === current) return;
      const rect = target.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - cx;
      const dy = rect.top + rect.height / 2 - cy;
      const forward = direction === "right" ? dx : direction === "left" ? -dx : direction === "down" ? dy : -dy;
      if (forward <= 2) return;
      const sideways = direction === "left" || direction === "right" ? Math.abs(dy) : Math.abs(dx);
      const score = forward * forward + sideways * sideways * 2.5;
      if (score < bestScore) { best = target; bestScore = score; }
    });
    if (!best) {
      const ordered = targets.slice().sort((a, b) => {
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return direction === "up" ? rb.top - ra.top : direction === "down" ? ra.top - rb.top : direction === "left" ? rb.left - ra.left : ra.left - rb.left;
      });
      best = direction === "up" || direction === "left" ? ordered[0] : ordered[ordered.length - 1];
    }
    focusMenuTarget(best);
    return true;
  }

  function activateMenuTarget() {
    const targets = menuTargets();
    if (!targets.length) return false;
    if (!focusedMenuTarget || !targets.includes(focusedMenuTarget)) focusMenuTarget(targets[0]);
    const target = focusedMenuTarget;
    if (target.matches("button, a[href], [role=button], input[type=checkbox], input[type=radio], select")) target.click();
    else {
      try { target.focus(); target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true })); target.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", code: "Enter", bubbles: true })); } catch (_) {}
    }
    return true;
  }

  function row(labelText) {
    const el = document.createElement("div");
    el.className = "setting";
    const label = document.createElement("p");
    label.textContent = labelText;
    el.appendChild(label);
    return el;
  }

  function bindingLabel(binding) {
    if (!binding) return "—";
    const match = /^([ab])(\d+)([+-]?)$/.exec(binding);
    if (!match) return binding;
    const index = Number(match[2]);
    if (match[1] === "b") return BUTTON_NAMES[index] || ("Button " + index);
    const stick = index < 2 ? "L Stick" : "R Stick";
    const axis = index % 2 ? "Y" : "X";
    return stick + " " + axis + (match[3] === "-" ? "−" : "+");
  }

  function refreshBindingButtons(action) {
    const pair = action.bindingButtons;
    if (!pair) return;
    pair.forEach((button, slot) => {
      button.textContent = capture && capture.actionId === action.id && capture.slot === slot
        ? "Press gamepad input…"
        : bindingLabel(preferences.bindings[action.id][slot]);
      button.classList.toggle("selected", !!(capture && capture.actionId === action.id && capture.slot === slot));
    });
  }

  function makeBindingButtons(action) {
    const wrapper = document.createElement("div");
    wrapper.className = "button-wrapper";
    action.bindingButtons = [0, 1].map(slot => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button key-binding";
      button.setAttribute("aria-label", action.label + " gamepad binding " + (slot + 1));
      button.addEventListener("click", () => {
        capture = {
          actionId: action.id,
          slot,
          buttons: activePad ? activePad.buttons.map(item => item.value) : [],
          axes: activePad ? activePad.axes.slice() : []
        };
        ACTIONS.forEach(refreshBindingButtons);
      });
      wrapper.appendChild(button);
      return button;
    });
    refreshBindingButtons(action);
    return wrapper;
  }

  function captureInput(pad) {
    if (!capture) return false;
    for (let index = 0; index < pad.buttons.length; index++) {
      const value = pad.buttons[index].value;
      if (value >= 0.55 && (capture.buttons[index] || 0) < 0.45) {
        capturedInput = "b" + index;
        preferences.bindings[capture.actionId][capture.slot] = capturedInput;
        capture = null;
        save();
        ACTIONS.forEach(refreshBindingButtons);
        return true;
      }
    }
    for (let index = 0; index < pad.axes.length; index++) {
      const value = pad.axes[index] || 0;
      if (Math.abs(value) >= 0.6) {
        capturedInput = "a" + index + (value < 0 ? "-" : "+");
        preferences.bindings[capture.actionId][capture.slot] = capturedInput;
        capture = null;
        save();
        ACTIONS.forEach(refreshBindingButtons);
        return true;
      }
    }
    return true;
  }

  function makeUI() {
    const headings = Array.from(document.querySelectorAll("#ui h2"));
    const controlsHeading = headings.find(h => h.textContent.trim().toLowerCase() === "controls");
    if (!controlsHeading || document.getElementById("game-controller-settings")) return;

    const content = document.createDocumentFragment();
    const heading = controlsHeading.cloneNode(false);
    heading.textContent = "Game Controller";
    heading.id = "game-controller-settings";
    content.appendChild(heading);

    const vibrationRow = row("Vibration");
    const vibrationWrapper = document.createElement("div");
    vibrationWrapper.className = "button-wrapper";
    const vibrationButtons = [];
    [["Off", false], ["On", true]].forEach(([title, value]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button" + (preferences.vibration === value ? " selected" : "");
      button.textContent = title;
      button.setAttribute("aria-pressed", String(preferences.vibration === value));
      button.addEventListener("click", () => {
        preferences.vibration = value;
        save();
        vibrationButtons.forEach((item, index) => {
          const selected = index === Number(value);
          item.classList.toggle("selected", selected);
          item.setAttribute("aria-pressed", String(selected));
        });
      });
      vibrationButtons.push(button);
      vibrationWrapper.appendChild(button);
    });
    vibrationRow.appendChild(vibrationWrapper);
    content.appendChild(vibrationRow);

    ACTIONS.forEach(action => {
      const actionRow = row(action.label);
      actionRow.appendChild(makeBindingButtons(action));
      content.appendChild(actionRow);
    });

    const statusRow = row("Controller");
    const statusWrapper = document.createElement("div");
    statusWrapper.className = "button-wrapper";
    statusNode = document.createElement("button");
    statusNode.type = "button";
    statusNode.className = "button key-binding";
    statusNode.disabled = true;
    statusNode.textContent = "Connect a controller";
    statusWrapper.appendChild(statusNode);
    statusRow.appendChild(statusWrapper);
    content.appendChild(statusRow);

    content.appendChild(row("Analog test"));
    testNodes = Object.create(null);
    TESTS.forEach(test => {
      const testRow = row(test.label);
      const testWrap = document.createElement("div");
      testWrap.className = "button-wrapper";
      testWrap.style.cssText = "display:flex;align-items:center;gap:10px;min-width:190px;max-width:420px";
      const track = document.createElement("div");
      track.style.cssText = "height:12px;flex:1;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.4);position:relative;overflow:hidden";
      const fill = document.createElement("div");
      fill.style.cssText = "height:100%;width:0;background:#fff;position:absolute;left:50%;transition:none";
      track.appendChild(fill);
      const number = document.createElement("span");
      number.textContent = "0.00";
      number.style.cssText = "width:48px;text-align:right;font-variant-numeric:tabular-nums;color:var(--text-color)";
      testWrap.append(track, number);
      testRow.appendChild(testWrap);
      content.appendChild(testRow);
      testNodes[test.id] = { fill, number, axis: test.axis !== undefined };
    });

    controlsHeading.parentNode.insertBefore(content, controlsHeading);
  }

  function signal(code, type) {
    window.dispatchEvent(new KeyboardEvent(type, {
      code,
      key: code.startsWith("Arrow") ? code : code.replace(/^Key/, "").toLowerCase(),
      bubbles: true,
      cancelable: true
    }));
  }

  function getInput(pad, binding) {
    if (!binding) return 0;
    const match = /^([ab])(\d+)([+-]?)$/.exec(binding);
    if (!match) return 0;
    const index = Number(match[2]);
    if (match[1] === "b") return pad.buttons[index] ? pad.buttons[index].value : 0;
    const value = pad.axes[index] || 0;
    return match[3] === "-" ? Math.max(0, -value) : Math.max(0, value);
  }

  function paintTest(pad) {
    TESTS.forEach(test => {
      const node = testNodes[test.id];
      if (!node) return;
      const value = test.axis ? (pad.axes[test.axis] || 0) : (pad.buttons[test.button] ? pad.buttons[test.button].value : 0);
      const bounded = Math.max(-1, Math.min(1, value));
      node.number.textContent = bounded.toFixed(2);
      if (test.axis && Math.abs(bounded) > 0.025) {
        node.fill.style.left = bounded < 0 ? (50 + bounded * 50) + "%" : "50%";
        node.fill.style.width = Math.abs(bounded) * 50 + "%";
      } else {
        node.fill.style.left = "0";
        node.fill.style.width = Math.max(0, bounded) * 100 + "%";
      }
    });
  }

  function vibrate(pad) {
    if (!preferences.vibration) return;
    try {
      if (pad.vibrationActuator && pad.vibrationActuator.playEffect) {
        const effect = pad.vibrationActuator.playEffect("dual-rumble", { duration: 35, strongMagnitude: 0.18, weakMagnitude: 0.25 });
        if (effect && effect.catch) effect.catch(() => {});
      } else if (pad.hapticActuators && pad.hapticActuators[0] && pad.hapticActuators[0].pulse) {
        pad.hapticActuators[0].pulse(0.25, 35);
      }
    } catch (_) {}
  }

  function actionValue(pad, action) {
    const bindings = preferences.bindings[action.id];
    return Math.max(getInput(pad, bindings[0]), getInput(pad, bindings[1]));
  }

  function frame() {
    makeUI();
    let pads = [];
    try { pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : []; } catch (_) {}
    activePad = pads.find(pad => pad.connected) || null;
    if (statusNode) statusNode.textContent = activePad ? (activePad.id + (activePad.mapping === "standard" ? " · Standard layout" : " · Generic layout")) : "Connect a controller";

    const current = Object.create(null);
    if (activePad) {
      paintTest(activePad);
      const justCaptured = captureInput(activePad);
      const targets = menuTargets();
      const menuMode = targets.length > 0;
      if (!menuMode && focusedMenuTarget) focusMenuTarget(null);
      if (menuMode) {
        [["navUp", 12, "up"], ["navDown", 13, "down"], ["navLeft", 14, "left"], ["navRight", 15, "right"]].forEach(([id, button, direction]) => {
          const down = !!(activePad.buttons[button] && activePad.buttons[button].pressed);
          current[id] = down;
          if (down && !wasDown[id]) { moveMenuFocus(direction); vibrate(activePad); }
        });
      }
      ACTIONS.forEach(action => {
        const bindings = preferences.bindings[action.id];
        const value = actionValue(activePad, action);
        const down = value >= (bindings.some(binding => binding && binding.startsWith("a")) ? 0.35 : 0.5);
        current[action.id] = down;
        if (justCaptured || capture || (capturedInput && getInput(activePad, capturedInput) >= 0.35)) {
          if (wasDown[action.id]) signal(action.code, "keyup");
          current[action.id] = false;
          return;
        }
        if (capturedInput && getInput(activePad, capturedInput) < 0.35) capturedInput = "";
        if (action.id === "menuSelect" || action.id === "menuBack") {
          if (menuMode && down && !wasDown[action.id]) {
            if (action.id === "menuSelect") activateMenuTarget();
            else signal("Escape", "keydown"), signal("Escape", "keyup");
            vibrate(activePad);
          }
          return;
        }
        if (menuMode && (action.id === "accelerate" || action.id === "brake" || action.id === "left" || action.id === "right" || action.id === "reset" || action.id === "pause" || action.id === "camera")) {
          if (wasDown[action.id]) signal(action.code, "keyup");
          current[action.id] = false;
          return;
        }
        if (down !== !!wasDown[action.id]) {
          signal(action.code, down ? "keydown" : "keyup");
          if (down) vibrate(activePad);
        }
      });
    } else {
      if (focusedMenuTarget) focusMenuTarget(null);
      Object.keys(testNodes).forEach(key => {
        const node = testNodes[key];
        node.number.textContent = "0.00";
        node.fill.style.left = "0";
        node.fill.style.width = "0";
      });
      ACTIONS.forEach(action => {
        if (wasDown[action.id]) signal(action.code, "keyup");
      });
    }
    wasDown = current;
    requestAnimationFrame(frame);
  }

  window.addEventListener("gamepadconnected", () => makeUI());
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(frame), { once: true });
  else requestAnimationFrame(frame);
})();
