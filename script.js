const canvas = document.getElementById("product-canvas");
const ctx = canvas.getContext("2d", { alpha: false });
const counter = document.getElementById("frame-counter");
const exploded = document.querySelector(".exploded");
const stage = document.querySelector(".sticky-stage");

const ZIP_URL = "assets/frames/ezgif-5d0b213fdc0985fb-jpg.zip";
const TOTAL = 298;
const frames = new Array(TOTAL);
const objectUrls = new Array(TOTAL);

let current = 0;
let target = 0;
let raf = 0;
let lastDrawn = -1;
let ready = false;
let imageRatio = 1;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();

  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  draw(Math.round(current));
}

function draw(index) {
  const img = frames[index];
  if (!img || !img.complete || !img.naturalWidth) return;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;

  ctx.fillStyle = "#e9e6df";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);

  lastDrawn = index;
  counter.textContent = String(index + 1).padStart(3, "0") + " / " + TOTAL;
}

function loadFrame(index) {
  if (index < 0 || index >= TOTAL || frames[index]) return;

  const url = objectUrls[index];
  if (!url) return;

  const img = new Image();
  img.decoding = "async";

  img.onload = async () => {
    try { await img.decode(); } catch (_) {}
    frames[index] = img;
    imageRatio = img.naturalWidth / img.naturalHeight;

    if (Math.round(current) === index) draw(index);
  };

  img.src = url;
}

function preloadAround(index) {
  const radius = 18;

  for (let offset = -radius; offset <= radius; offset++) {
    loadFrame(index + offset);
  }
}

function getProgress() {
  const start = exploded.offsetTop;
  const distance = Math.max(1, exploded.offsetHeight - window.innerHeight);
  return Math.max(0, Math.min(1, (window.scrollY - start) / distance));
}

function animate() {
  raf = 0;
  if (!ready) return;

  const progress = getProgress();
  target = progress * (TOTAL - 1);

  // Slow, buttery interpolation instead of snapping to every scroll event.
  const delta = target - current;
  current += delta * 0.085;

  if (Math.abs(delta) < 0.015) current = target;

  const frameIndex = Math.max(0, Math.min(TOTAL - 1, Math.round(current)));
  preloadAround(frameIndex);

  if (frames[frameIndex] && frameIndex !== lastDrawn) {
    draw(frameIndex);
  }

  // Subtle cinematic camera movement layered over the frame sequence.
  const scale = 1 + Math.sin(progress * Math.PI) * 0.045;
  const driftX = Math.sin(progress * Math.PI * 2) * 12;
  const driftY = Math.cos(progress * Math.PI) * 7;
  canvas.style.transform = `translate3d(${driftX}px, ${driftY}px, 0) scale(${scale})`;

  stage.style.setProperty("--explore-progress", progress.toFixed(3));
  requestUpdate();
}

function requestUpdate() {
  if (!raf) raf = requestAnimationFrame(animate);
}

async function loadZip() {
  counter.textContent = "LOADING / 298";

  const response = await fetch(ZIP_URL, { cache: "force-cache" });
  if (!response.ok) throw new Error("Could not load animation ZIP.");

  const zip = await JSZip.loadAsync(await response.arrayBuffer());

  const files = Object.values(zip.files)
    .filter(file => !file.dir && /ezgif-frame-\d{3}\.jpg$/i.test(file.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  if (files.length !== TOTAL) {
    throw new Error("Expected 298 frames, found " + files.length + ".");
  }

  // Extract URLs without decoding every image up front.
  for (let i = 0; i < TOTAL; i++) {
    const blob = await files[i].async("blob");
    objectUrls[i] = URL.createObjectURL(blob);
  }

  ready = true;
  preloadAround(0);
  loadFrame(0);
  document.documentElement.classList.add("frames-ready");
  requestUpdate();
}

window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", resize);

resize();

loadZip().catch(error => {
  console.error(error);
  counter.textContent = "ANIMATION ERROR";
});
