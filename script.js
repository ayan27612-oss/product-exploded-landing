const canvas = document.getElementById("product-canvas");
const ctx = canvas.getContext("2d", { alpha: false });
const counter = document.getElementById("frame-counter");
const exploded = document.querySelector(".exploded");

const ZIP_URL = "assets/frames/ezgif-5d0b213fdc0985fb-jpg.zip";
const TOTAL = 298;
const frames = new Array(TOTAL);
const objectUrls = new Array(TOTAL);

let current = 0;
let desired = 0;
let raf = 0;
let lastDrawn = -1;
let ready = false;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();

  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  draw(current);
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

    if (index === current) draw(index);
  };

  img.src = url;
}

function preloadAround(index) {
  const radius = 10;

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

  desired = Math.round(getProgress() * (TOTAL - 1));

  // Follow scroll closely while avoiding needless canvas redraws.
  if (current !== desired) {
    current = desired;
    preloadAround(current);

    if (frames[current]) {
      draw(current);
    } else if (lastDrawn < 0) {
      loadFrame(current);
    }
  }
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