/* The Chatling share page does not send X-Frame-Options or CSP frame-ancestors,
   and the published bot renders in a frame. This launcher embeds that share URL.
   "Open in a window" remains available if a browser still refuses the frame. */
(function () {
  const SHARE_URL = "https://share.chatling.ai/s/q7byNJL57hivsW9";

  const widget = document.createElement("div");
  widget.className = "chat-widget";
  widget.innerHTML =
    '<button type="button" class="chat-launcher" aria-expanded="false" aria-controls="chat-panel">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<path fill="currentColor" d="M5 4.5h14a2 2 0 0 1 2 2v8.2a2 2 0 0 1-2 2H9.2L5 20.2v-3.5h0a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2Z"/>' +
      "</svg>" +
      '<span class="chat-launcher-label">Ask the guide</span>' +
    "</button>" +
    '<div class="chat-panel" id="chat-panel" role="dialog" aria-modal="false" aria-labelledby="chat-title" hidden>' +
      '<div class="chat-panel-bar">' +
        '<p id="chat-title" class="chat-title">Ask the guide</p>' +
        '<a class="chat-window-link" data-popup href="' + SHARE_URL + '">Open in a window</a>' +
        '<button type="button" class="chat-close" aria-label="Close chat">' +
          '<span aria-hidden="true">&times;</span>' +
        "</button>" +
      "</div>" +
      '<p class="chat-note">Student prototype. Confirm answers on Smurfit Westrock’s published pages.</p>' +
      '<div class="chat-suggest" hidden>' +
        '<p class="chat-suggest-label">Try typing this question</p>' +
        '<p class="chat-suggest-text"></p>' +
        '<button type="button" class="chat-copy">Copy question</button>' +
      "</div>" +
      '<div class="chat-frame-wrap">' +
        '<p class="chat-loading">Loading the guide…</p>' +
        '<iframe title="Smurfit Westrock Sustainability Guide chat"></iframe>' +
      "</div>" +
    "</div>";

  document.body.appendChild(widget);

  const launcher = widget.querySelector(".chat-launcher");
  const panel = widget.querySelector(".chat-panel");
  const closeBtn = widget.querySelector(".chat-close");
  const iframe = widget.querySelector("iframe");
  const loading = widget.querySelector(".chat-loading");
  const suggest = widget.querySelector(".chat-suggest");
  const suggestText = widget.querySelector(".chat-suggest-text");
  const copyBtn = widget.querySelector(".chat-copy");
  let frameRequested = false;
  let isOpen = false;
  let lastFocus = null;
  let pendingPrompt = "";

  function ensureFrame() {
    if (frameRequested) return;
    frameRequested = true;
    iframe.addEventListener("load", function () {
      loading.hidden = true;
    });
    iframe.src = SHARE_URL;
  }

  function setPrompt(prompt) {
    pendingPrompt = prompt || "";
    if (!pendingPrompt) {
      suggest.hidden = true;
      suggestText.textContent = "";
      return;
    }
    suggest.hidden = false;
    suggestText.textContent = pendingPrompt;
    copyBtn.textContent = "Copy question";
  }

  function open(prompt) {
    if (typeof prompt === "string") setPrompt(prompt);
    ensureFrame();
    if (!isOpen) lastFocus = document.activeElement;
    isOpen = true;
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    document.body.classList.add("chat-open");
    window.setTimeout(function () {
      iframe.focus();
    }, 0);
  }

  function close() {
    isOpen = false;
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    document.body.classList.remove("chat-open");
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    } else {
      launcher.focus();
    }
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  function openPopup(anchor) {
    const win = window.open(
      SHARE_URL,
      "swGuideChat",
      "popup=yes,width=440,height=760"
    );
    if (win) win.opener = null;
    else if (anchor) window.location.href = anchor.href;
  }

  function copyPrompt() {
    const text = pendingPrompt;
    if (!text) return;
    const done = function () {
      copyBtn.textContent = "Copied";
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        fallbackCopy(text);
        done();
      });
      return;
    }
    fallbackCopy(text);
    done();
  }

  function fallbackCopy(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-999px";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
    } catch (err) {
      /* The question text stays visible so it can be copied by hand. */
    }
    document.body.removeChild(area);
  }

  launcher.addEventListener("click", toggle);
  closeBtn.addEventListener("click", close);
  copyBtn.addEventListener("click", copyPrompt);

  document.addEventListener("click", function (event) {
    const promptBtn = event.target.closest("[data-prompt]");
    if (promptBtn) {
      event.preventDefault();
      open(promptBtn.getAttribute("data-prompt") || "");
      return;
    }
    const popup = event.target.closest("[data-popup]");
    if (popup) {
      event.preventDefault();
      openPopup(popup);
      return;
    }
    if (event.target.closest("[data-open-chat]")) {
      event.preventDefault();
      open();
      return;
    }
    if (!isOpen) return;
    if (panel.contains(event.target) || launcher.contains(event.target)) return;
    close();
  });

  document.addEventListener("keydown", function (event) {
    if (!isOpen || event.key !== "Escape") return;
    event.preventDefault();
    close();
    launcher.focus();
  });

  window.SustainabilityGuideChat = { open: open, close: close };
})();
