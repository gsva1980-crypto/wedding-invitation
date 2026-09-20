/**
 * Wedding Invitation — Video Scenes + Tap Navigation + Scratch
 */

const experience = {
  curtainOpened: false,
  curtainFinished: false,
  activeScene: 0,
  transitionLocked: false,
  tapNavigationEnabled: false,
  scratchStarted: false,
  scratchComplete: false,
  finalVideoFinished: false
};

const curtainExperience = document.getElementById("curtainExperience");
const curtainVideo = document.getElementById("curtainVideo");
const openInvitationButton = document.getElementById("openInvitation");
const weddingAudio = document.getElementById("weddingAudio");
const slideStage = document.getElementById("slideStage");
const ambientBg = document.getElementById("ambientBackground");

/* ---------- CURTAIN ---------- */
let weddingMusicStarted = false;

function startWeddingMusic() {
  const audio = document.getElementById("weddingAudio");
  if (!audio) {
    console.warn("[AUDIO] weddingAudio not found");
    return;
  }
  audio.loop = true;
  audio.volume = 1;
  audio.muted = false;
  if (weddingMusicStarted) {
    if (audio.paused) {
      audio.play().catch((error) => console.warn("[AUDIO] Resume failed", error));
    }
    return;
  }
  try { audio.currentTime = 0; } catch (e) {}
  const playPromise = audio.play();
  if (playPromise && typeof playPromise.then === "function") {
    playPromise.then(() => { weddingMusicStarted = true; console.log("[AUDIO] Wedding song started"); })
      .catch((error) => { weddingMusicStarted = false; console.error("[AUDIO] Playback failed:", error.name, error.message); });
  } else {
    weddingMusicStarted = true;
  }
}

function openInvitation() {
  if (experience.curtainOpened) return;
  startWeddingMusic();
  experience.curtainOpened = true;
  openInvitationButton?.classList.add("hidden");
  curtainVideo.pause();
  curtainVideo.currentTime = 0;
  curtainVideo.play().catch(() => {});
}

function finishCurtainOnce() {
  if (experience.curtainFinished) return;
  experience.curtainFinished = true;
  showScene(0);
  experience.activeScene = 0;
  experience.tapNavigationEnabled = true;
  curtainExperience.style.pointerEvents = "none";
  curtainExperience.classList.add("curtain-fade-out");
  setTimeout(() => {
    curtainExperience.style.display = "none";
    showTapHint();
  }, 180);
  playSceneVideo(0);
}

/* ---------- SCENE VIDEO ---------- */
function playSceneVideo(index) {
  const videos = document.querySelectorAll(".sceneVideo");
  videos.forEach((video, i) => {
    if (i !== index) video.pause();
  });
  const video = videos[index];
  if (!video) return;
  video.muted = true;
  video.playsInline = true;
  if (index >= 0 && index <= 2) video.loop = true;
  try { video.currentTime = 0; } catch (e) {}
  video.play().catch((err) => console.warn("[SCENE VIDEO] play failed", index, err));
}



function holdLastFrame(video) {
  if (!video) return;
  const d = video.duration;
  if (Number.isFinite(d) && d > 0) {
    video.currentTime = Math.max(0, d - 0.04);
  }
  video.pause();
}

/* ---------- SHOW / TRANSITION ---------- */
function showScene(index) {
  const slides = document.querySelectorAll(".slide");
  slides.forEach((s, i) => {
    s.classList.remove("active", "entering", "leaving");
    s.style.visibility = "hidden";
    s.style.opacity = "";
    s.style.transform = "";
    const v = s.querySelector(".sceneVideo");
    if (v) { v.pause(); v.currentTime = 0; }
  });
  const target = slides[index];
  if (target) {
    target.classList.add("active");
    target.style.visibility = "visible";
  }
  updateAmbientBackground(index);
}

function transitionToScene(nextIndex) {
  if (experience.transitionLocked) return;
  if (nextIndex > 3) return;
  const slides = document.querySelectorAll(".slide");
  const current = slides[experience.activeScene];
  const next = slides[nextIndex];
  if (!current || !next) return;
  experience.transitionLocked = true;
  hideTapHint();
  const outVideo = current.querySelector(".sceneVideo");
  if (outVideo) outVideo.pause();
  next.classList.add("entering");
  next.style.visibility = "visible";
  next.style.opacity = "0";
  next.style.transform = "translate3d(0,7%,0) scale(1.01)";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      current.classList.add("leaving");
      next.style.opacity = "1";
      next.style.transform = "translate3d(0,0,0) scale(1)";
    });
  });
  setTimeout(() => {
    current.classList.remove("active", "leaving");
    current.style.visibility = "";
    current.style.opacity = "";
    current.style.transform = "";
    next.classList.remove("entering");
    next.classList.add("active");
    next.style.visibility = "";
    next.style.opacity = "";
    next.style.transform = "";
    experience.activeScene = nextIndex;
    experience.transitionLocked = false;
    updateAmbientBackground?.(nextIndex);
    playSceneVideo(nextIndex);
    if (nextIndex === 3) {
      experience.tapNavigationEnabled = false;
      hideTapHint();
      initScratchCard();
      setupFinalSceneVideo();
    } else {
      showTapHint();
    }
  }, 760);
}

function setupFinalSceneVideo() {
  const finalVideo = document.getElementById("finalSceneVideo");
  if (!finalVideo) return;
  finalVideo.loop = true;
}


/* ---------- AMBIENT ---------- */
function updateAmbientBackground(index) {
  const slides = document.querySelectorAll(".slide");
  const active = slides[index];
  if (!active) return;
  const v = active.querySelector(".sceneVideo");
  if (v && v.poster) {
    ambientBg.style.backgroundImage = `url(${v.poster})`;
  } else {
    const img = active.querySelector("img");
    if (img) ambientBg.style.backgroundImage = `url(${img.src})`;
  }
}

/* ---------- TAP ---------- */
function handleStageTap(event) {
  if (!experience.tapNavigationEnabled) return;
  if (experience.transitionLocked) return;
  if (experience.scratchStarted || experience.scratchComplete) return;
  if (event.target.closest("#scratchZone")) return;
  if (event.target.closest("#audioToggle")) return;
  if (experience.activeScene >= 3) return;
  transitionToScene(experience.activeScene + 1);
}

function showTapHint() {
  const tapHint = document.getElementById("tapHint");
  if (experience.activeScene >= 0 && experience.activeScene <= 2 && experience.tapNavigationEnabled) {
    tapHint?.classList.add("visible");
  } else {
    tapHint?.classList.remove("visible");
  }
}

function showTapHintLegacy() {
  let h = document.getElementById("tapHint");
  if (!h) {
    h = document.createElement("div");
    h.id = "tapHint";
    h.innerHTML = "TAP TO CONTINUE";
    h.setAttribute("aria-label", "Tap to continue");
    slideStage.appendChild(h);
  }
  h.style.opacity = "1";
}

function hideTapHint() {
  const tapHint = document.getElementById("tapHint");
  if (tapHint) tapHint.classList.remove("visible");
}

/* ---------- SCRATCH ---------- */
let scratchInitialized = false;
let scratching = false;
let previousPoint = null;
let scratchCtx = null;
let scratchCanvasEl = null;
let scratchZoneEl = null;

function sizeScratchCanvas() {
  const scratchZone = document.getElementById("scratchZone");
  const rect = scratchZone ? scratchZone.getBoundingClientRect() : { width: 300, height: 50, left: 0, top: 0 };
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  scratchCanvasEl.width = Math.round(rect.width * dpr);
  scratchCanvasEl.height = Math.round(rect.height * dpr);
  scratchCanvasEl.style.width = `${rect.width}px`;
  scratchCanvasEl.style.height = `${rect.height}px`;
  const ctx = scratchCanvasEl.getContext("2d", { willReadFrequently: true });
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  console.log("[SCRATCH SIZE]", scratchCanvasEl.width, scratchCanvasEl.height, rect);
  return { ctx, rect, dpr };
}

function getVideoCropForScratchZone() {
  const finalSceneVideo = document.getElementById("finalSceneVideo");
  const scratchZone = document.getElementById("scratchZone");
  if (!finalSceneVideo || !scratchZone) return { sx: 0, sy: 0, sw: 0, sh: 0 };
  const videoRect = finalSceneVideo.getBoundingClientRect();
  const zoneRect = scratchZone.getBoundingClientRect();
  const videoWidth = finalSceneVideo.videoWidth || 0;
  const videoHeight = finalSceneVideo.videoHeight || 0;
  const elementWidth = videoRect.width;
  const elementHeight = videoRect.height;
  const scale = Math.max(elementWidth / videoWidth, elementHeight / videoHeight);
  const renderedWidth = videoWidth * scale;
  const renderedHeight = videoHeight * scale;
  const offsetX = (elementWidth - renderedWidth) / 2;
  const offsetY = (elementHeight - renderedHeight) / 2;
  const zoneX = zoneRect.left - videoRect.left;
  const zoneY = zoneRect.top - videoRect.top;
  let sx = (zoneX - offsetX) / scale;
  let sy = (zoneY - offsetY) / scale;
  let sw = zoneRect.width / scale;
  let sh = zoneRect.height / scale;
  sx = Math.max(0, sx);
  sy = Math.max(0, sy);
  sw = Math.min(videoWidth - sx, sw);
  sh = Math.min(videoHeight - sy, sh);
  return { sx, sy, sw, sh };
}

function initializeScratchCanvas() {
  const finalSceneVideo = document.getElementById("finalSceneVideo");
  const { ctx, rect, dpr } = sizeScratchCanvas();
  const { sx, sy, sw, sh } = getVideoCropForScratchZone();

  ctx.save();
  ctx.filter = "blur(16px)";
  ctx.drawImage(finalSceneVideo || document.getElementById("finalSceneVideo"), sx, sy, sw, sh, 0, 0, rect.width, rect.height);
  ctx.restore();

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(246,237,218,0.28)";
  ctx.fillRect(0, 0, rect.width, rect.height);

  ctx.filter = "none";

  scratchCanvasEl.style.opacity = "1";
  scratchCanvasEl.style.visibility = "visible";

  requestAnimationFrame(() => {
    const datePreBlur = document.getElementById("datePreBlur");
    if (datePreBlur) {
      datePreBlur.style.opacity = "0";
      datePreBlur.style.visibility = "hidden";
    }
  });

  const scratchHint = document.getElementById("scratchHint");
  if (scratchHint) scratchHint.classList.add("hidden");

  scratchCtx = ctx;
  console.log("[SCRATCH] initialized successfully");
}

function getScratchPoint(event) {
  const rect = document.getElementById("scratchZone") ? document.getElementById("scratchZone").getBoundingClientRect() : { left: 0, top: 0 };
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function eraseAtPoint(point) {
  const ctx = scratchCanvasEl.getContext("2d");
  if (!ctx) return;
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(point.x, point.y, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function handleScratchPointerDown(event) {
  console.log("[SCRATCH] pointerdown", event.clientX, event.clientY);
  event.preventDefault();
  event.stopPropagation();
  if (experience.scratchComplete) return;
  const sz = document.getElementById("scratchZone");
  if (sz) sz.setPointerCapture?.(event.pointerId);
  if (!scratchInitialized) {
    const finalSceneVideo = document.getElementById("finalSceneVideo");
    if (finalSceneVideo) {
      finalSceneVideo.pause();
      finalSceneVideo.loop = false;
    }
    scratchZoneEl = document.getElementById("scratchZone");
    scratchCanvasEl = document.getElementById("scratchCanvas");
    initializeScratchCanvas();
    scratchInitialized = true;
    experience.scratchStarted = true;
  }
  scratching = true;
  previousPoint = getScratchPoint(event);
  eraseAtPoint(previousPoint);
  console.log("[SCRATCH] initialized", scratchCanvasEl ? scratchCanvasEl.width : 0, scratchCanvasEl ? scratchCanvasEl.height : 0);
}

function handleScratchPointerMove(event) {
  if (!scratching) return;
  event.preventDefault();
  event.stopPropagation();
  const point = getScratchPoint(event);
  console.log("[SCRATCH] move", point.x, point.y);
  const ctx = scratchCanvasEl.getContext("2d");
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.lineWidth = 56;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(previousPoint.x, previousPoint.y);
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
  ctx.restore();
  previousPoint = point;
}

function handleScratchPointerUp(event) {
  event.preventDefault();
  event.stopPropagation();
  scratching = false;
  previousPoint = null;
  checkScratchComplete();
  try {
    const sz = document.getElementById("scratchZone");
    sz.releasePointerCapture?.(event.pointerId);
  } catch (e) {}
}

function checkScratchComplete() {
  if (!scratchCtx || !scratchCanvasEl) return;
  const w = scratchCanvasEl.width;
  const h = scratchCanvasEl.height;
  const data = scratchCtx.getImageData(0, 0, w, h).data;
  let cleared = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 40) cleared++;
  }
  const pct = cleared / (w * h);
  if (pct > 0.55 && !experience.scratchComplete) {
    experience.scratchComplete = true;
    const sz = document.getElementById("scratchZone");
    if (sz) sz.style.pointerEvents = "none";
    if (scratchCanvasEl) {
      scratchCanvasEl.style.transition = "opacity 600ms ease";
      scratchCanvasEl.style.opacity = "0";
      setTimeout(() => {
        scratchCanvasEl.style.visibility = "hidden";
        scratchCanvasEl.style.pointerEvents = "none";

        const finalSceneVideo = document.getElementById("finalSceneVideo");
        if (finalSceneVideo) {
          finalSceneVideo.loop = true;

          const resumePromise = finalSceneVideo.play();

          if (
            resumePromise &&
            typeof resumePromise.catch === "function"
          ) {
            resumePromise.catch(error => {
              console.warn(
                "[FINAL VIDEO] Resume failed",
                error
              );
            });
          }
        }

        const pdfContinue = document.getElementById("pdfContinue");
        pdfContinue?.classList.add("visible");
      }, 620);
    }
    const hint = document.getElementById("scratchHint");
    if (hint) hint.style.display = "none";
  }
}

// Stop stage tap propagation inside scratchZone
["click", "pointerdown", "pointermove", "pointerup"].forEach(type => {
  const sz = document.getElementById("scratchZone");
  if (sz) {
    sz.addEventListener(type, event => {
      event.stopPropagation();
    });
  }
});

// Stop PDF link clicks from triggering Scene 4 or scratch logic
const pdfContinue = document.getElementById("pdfContinue");
pdfContinue?.addEventListener("click", event => {
  event.stopPropagation();
});

// Attach directly to scratchZone
const scratchZone = document.getElementById("scratchZone");
if (scratchZone) {
  scratchZone.addEventListener("pointerdown", handleScratchPointerDown, { passive: false });
  scratchZone.addEventListener("pointermove", handleScratchPointerMove, { passive: false });
  scratchZone.addEventListener("pointerup", handleScratchPointerUp, { passive: false });
  scratchZone.addEventListener("pointercancel", handleScratchPointerUp, { passive: false });
}

function initScratchCard() {
  scratchZoneEl = document.getElementById("scratchZone");
  if (!scratchZoneEl) return;
  scratchZoneEl.style.pointerEvents = "auto";
  // Listeners already attached above
}

/* ---------- EVENTS ---------- */
openInvitationButton?.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); openInvitation(); });
curtainExperience?.addEventListener("click", (e) => { if (e.target.closest("#audioToggle")) return; openInvitation(); });
document.addEventListener("keydown", (e) => { if (experience.curtainOpened) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openInvitation(); } });

curtainVideo?.addEventListener("ended", finishCurtainOnce);
curtainVideo?.addEventListener("timeupdate", () => {
  const d = curtainVideo.duration;
  if (Number.isFinite(d) && d > 0 && curtainVideo.currentTime >= d - 0.08) finishCurtainOnce();
});
slideStage?.addEventListener("click", handleStageTap);

/* Preload */
function preloadAssets() {
  [
    "assets/derived/curtain-opening.mp4",
    "assets/derived/scene-1-ganesha.mp4",
    "assets/derived/scene-2-shubh-vivah.mp4",
    "assets/derived/scene-3-couple.mp4",
    "assets/derived/scene-4-final.mp4"
  ].forEach((src) => {
    const v = document.createElement("video");
    v.preload = "auto";
    v.src = src;
  });
}

window.addEventListener("DOMContentLoaded", () => {
  preloadAssets();
  const s1 = document.querySelector('.slide[data-scene="0"]') || document.querySelector('.slide.active');
  if (s1) { s1.style.visibility = "visible"; s1.classList.add("active"); }
  // Scene 1 video set for when curtain finishes; keep paused until then
  playSceneVideo(0);
  updateAmbientBackground(0);
  // Show pre-blur initially (hidden when curtain finishes via setup)
  const preBlur = document.getElementById("datePreBlur");
  if (preBlur) preBlur.style.display = "block";
});

document.getElementById("audioToggle")?.addEventListener("click", (e) => {
  e.preventDefault(); e.stopPropagation();
  const a = document.getElementById("weddingAudio");
  if (a) { a.muted = !a.muted; }
});
