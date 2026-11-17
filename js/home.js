(function () {
  const video = document.querySelector("[data-hero-video]");
  if (video) {
    const playBtn = document.querySelector("[data-video-toggle]");
    const soundBtn = document.querySelector("[data-video-sound]");
    let userPaused = false;

    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.preload = "auto";

    const markPlaying = function () {
      if (!playBtn) return;
      playBtn.textContent = "Pause video";
      playBtn.setAttribute("aria-pressed", "true");
    };

    const markPaused = function () {
      if (!playBtn) return;
      playBtn.textContent = "Play video";
      playBtn.setAttribute("aria-pressed", "false");
    };

    const play = function () {
      const pending = video.play();
      if (pending && typeof pending.catch === "function") {
        pending.then(markPlaying).catch(function () {
          if (video.paused) markPaused();
        });
      }
    };

    play();
    video.addEventListener("canplay", function () {
      if (!userPaused) play();
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && !userPaused) play();
    });

    if (playBtn) {
      playBtn.addEventListener("click", function () {
        if (video.paused) {
          userPaused = false;
          play();
        } else {
          userPaused = true;
          video.pause();
          markPaused();
        }
      });
    }

    if (soundBtn) {
      soundBtn.addEventListener("click", function () {
        video.muted = !video.muted;
        soundBtn.textContent = video.muted ? "Unmute" : "Mute";
        soundBtn.setAttribute("aria-pressed", video.muted ? "false" : "true");
        if (!video.muted && !userPaused) play();
      });
    }
  }

  const root = document.querySelector("[data-journey]");
  if (!root) return;

  const STAGES = [
    { id: "fiber", label: "Renewable fiber" },
    { id: "box", label: "Box" },
    { id: "use", label: "Use" },
    { id: "recycle", label: "Recycle" },
    { id: "new", label: "New fiber" }
  ];

  const PACKAGES = {
    shipper: {
      name: "corrugated shipper",
      use: "it carries a product through shipping and storage"
    },
    carton: {
      name: "folding carton",
      use: "it holds a product on a shelf or in a shopper’s hand"
    },
    tray: {
      name: "retail-ready tray",
      use: "it presents products in a store"
    }
  };

  const scene = root.querySelector("[data-scene]");
  const kicker = root.querySelector("[data-stage-kicker]");
  const title = root.querySelector("[data-stage-title]");
  const body = root.querySelector("[data-stage-body]");
  const packageButtons = Array.prototype.slice.call(root.querySelectorAll("button[data-package]"));
  const stageButtons = Array.prototype.slice.call(root.querySelectorAll("button[data-step]"));
  const prevBtn = root.querySelector("[data-stage-prev]");
  const nextBtn = root.querySelector("[data-stage-next]");
  const playBtn = root.querySelector("[data-stage-play]");
  let packageId = "shipper";
  let stageIndex = 0;
  let timer = null;

  function copyFor(stageId, pkg) {
    if (stageId === "fiber") {
      return "Smurfit Westrock describes a circular model that uses renewable materials for paper-based packaging. This " + pkg.name + " begins with fiber that can be grown again. The step illustrates that published model. It is not a claim about a specific forest, certification, or pack.";
    }
    if (stageId === "box") {
      return "Fiber is formed into paper-based packaging. In this journey, that package is a " + pkg.name + ". The guide can explain the approach. It does not design a custom structure, quote a price, or promise a lead time.";
    }
    if (stageId === "use") {
      return "During use, " + pkg.use + ". Use is part of the loop the company describes. This explorer does not estimate carbon savings for a product, an order, or a shipping lane.";
    }
    if (stageId === "recycle") {
      return "After use, paper-based packaging is often collected for recycling. Smurfit Westrock describes using recyclable and recycled materials. That description is not a guarantee that this " + pkg.name + " is recyclable in every city or collection program.";
    }
    return "Recycled fiber can return to papermaking and become packaging again. The journey closes by returning toward renewable and recycled fiber. It is an illustration of the circular idea, not a measured recovery rate.";
  }

  function render() {
    const stage = STAGES[stageIndex];
    const pkg = PACKAGES[packageId];
    scene.setAttribute("data-stage", stage.id);
    scene.setAttribute("data-package", packageId);
    scene.classList.remove("is-live");
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        scene.classList.add("is-live");
      });
    });
    kicker.textContent = "Stage " + (stageIndex + 1) + " of " + STAGES.length;
    title.textContent = stage.label;
    body.textContent = copyFor(stage.id, pkg);
    stageButtons.forEach(function (button, index) {
      if (index === stageIndex) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    packageButtons.forEach(function (button) {
      const on = button.getAttribute("data-package") === packageId;
      button.setAttribute("aria-checked", on ? "true" : "false");
      button.tabIndex = on ? 0 : -1;
    });
    const fill = root.querySelector("[data-loop-fill]");
    if (fill) fill.style.transform = "scaleX(" + (stageIndex / (STAGES.length - 1)) + ")";
  }

  function go(nextIndex) {
    const count = STAGES.length;
    stageIndex = (nextIndex + count) % count;
    render();
  }

  function stopPlay() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
    if (playBtn) {
      playBtn.textContent = "Play the loop";
      playBtn.setAttribute("aria-pressed", "false");
    }
  }

  function startPlay() {
    stopPlay();
    playBtn.textContent = "Pause the loop";
    playBtn.setAttribute("aria-pressed", "true");
    timer = window.setInterval(function () {
      go(stageIndex + 1);
    }, 2600);
  }

  packageButtons.forEach(function (button, index) {
    button.addEventListener("click", function () {
      packageId = button.getAttribute("data-package");
      stageIndex = 0;
      stopPlay();
      render();
    });
    button.addEventListener("keydown", function (event) {
      let next = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index + 1;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index - 1;
      if (next === null) return;
      event.preventDefault();
      const target = packageButtons[(next + packageButtons.length) % packageButtons.length];
      target.click();
      target.focus();
    });
  });

  stageButtons.forEach(function (button, index) {
    button.addEventListener("click", function () {
      stopPlay();
      go(index);
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      stopPlay();
      go(stageIndex - 1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      stopPlay();
      go(stageIndex + 1);
    });
  }
  if (playBtn) {
    playBtn.addEventListener("click", function () {
      if (timer) stopPlay();
      else startPlay();
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && timer) stopPlay();
  });

  render();
})();
