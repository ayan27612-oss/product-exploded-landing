const canvas=document.getElementById("product-canvas");
const ctx=canvas.getContext("2d",{alpha:false});
const counter=document.getElementById("frame-counter");

const ZIP_URL="assets/frames/ezgif-5d0b213fdc0985fb-jpg.zip";
const TOTAL=298;
const frames=new Array(TOTAL);
const objectUrls=new Array(TOTAL);

let progress=0;
let target=0;
let lastDrawn=-1;
let raf=0;
let ready=false;
let touchY=0;

function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const rect=canvas.getBoundingClientRect();
  canvas.width=Math.round(rect.width*dpr);
  canvas.height=Math.round(rect.height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  draw(Math.round(progress));
}

function draw(index){
  const img=frames[index];
  if(!img||!img.complete||!img.naturalWidth)return;
  const w=canvas.clientWidth,h=canvas.clientHeight;
  const scale=Math.min(w/img.naturalWidth,h/img.naturalHeight);
  const dw=img.naturalWidth*scale,dh=img.naturalHeight*scale;
  ctx.fillStyle="#e9e6df";
  ctx.fillRect(0,0,w,h);
  ctx.drawImage(img,(w-dw)/2,(h-dh)/2,dw,dh);
  lastDrawn=index;
  counter.textContent=String(index+1).padStart(3,"0")+" / "+TOTAL;
}

function loadFrame(i){
  if(i<0||i>=TOTAL||frames[i])return;
  const url=objectUrls[i];
  if(!url)return;
  const img=new Image();
  img.decoding="async";
  img.onload=async()=>{
    try{await img.decode()}catch(_){}
    frames[i]=img;
    if(Math.round(progress)===i)draw(i);
  };
  img.src=url;
}

function preload(i){
  // Keep a generous local buffer so the sequence stays continuous.
  for(let n=-24;n<=24;n++)loadFrame(i+n);
}

function requestRender(){
  if(!raf)raf=requestAnimationFrame(render);
}

function render(){
  raf=0;
  if(!ready)return;

  // Smoothly follows the virtual scroll position in either direction.
  progress+=(target-progress)*0.075;
  if(Math.abs(target-progress)<0.02)progress=target;

  const i=Math.max(0,Math.min(TOTAL-1,Math.round(progress)));
  preload(i);
  if(i!==lastDrawn&&frames[i])draw(i);

  const p=progress/(TOTAL-1);
  const scale=1+Math.sin(p*Math.PI)*0.025;
  const x=Math.sin(p*Math.PI*2)*5;
  const y=Math.cos(p*Math.PI)*3;
  canvas.style.transform=`translate3d(${x}px,${y}px,0) scale(${scale})`;

  requestRender();
}

function move(delta){
  if(!ready)return;
  // Wheel/touch distance becomes controlled frame movement, not page length.
  target=Math.max(0,Math.min(TOTAL-1,target+delta));
  requestRender();
}

window.addEventListener("wheel",e=>{
  e.preventDefault();
  move(e.deltaY*0.32);
},{passive:false});

window.addEventListener("touchstart",e=>{
  touchY=e.touches[0].clientY;
},{passive:true});

window.addEventListener("touchmove",e=>{
  const y=e.touches[0].clientY;
  const delta=(touchY-y)*0.95;
  touchY=y;
  move(delta);
  e.preventDefault();
},{passive:false});

window.addEventListener("resize",resize);

async function loadZip(){
  counter.textContent="LOADING / 298";
  const response=await fetch(ZIP_URL,{cache:"force-cache"});
  if(!response.ok)throw new Error("Could not load animation ZIP.");
  const zip=await JSZip.loadAsync(await response.arrayBuffer());

  const files=Object.values(zip.files)
    .filter(file=>!file.dir&&/ezgif-frame-\d{3}\.jpg$/i.test(file.name))
    .sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));

  if(files.length!==TOTAL)throw new Error("Expected 298 frames, found "+files.length+".");

  for(let i=0;i<TOTAL;i++){
    const blob=await files[i].async("blob");
    objectUrls[i]=URL.createObjectURL(blob);
  }

  ready=true;
  preload(0);
  loadFrame(0);
  requestRender();
}

resize();
loadZip().catch(error=>{
  console.error(error);
  counter.textContent="ANIMATION ERROR";
});