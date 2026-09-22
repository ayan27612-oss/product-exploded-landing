const canvas=document.getElementById("product-canvas");
const ctx=canvas.getContext("2d",{alpha:false});
const counter=document.getElementById("frame-counter");
const exploded=document.querySelector(".exploded");

const FILES=["assets/frames/ezgif-frame-001.jpg","assets/frames/ezgif-frame-002.jpg","assets/frames/ezgif-frame-003.jpg","assets/frames/ezgif-frame-004.jpg","assets/frames/ezgif-frame-005.jpg","assets/frames/ezgif-frame-006.jpg","assets/frames/ezgif-frame-007.jpg","assets/frames/ezgif-frame-008.jpg","assets/frames/ezgif-frame-009.jpg","assets/frames/ezgif-frame-010.jpg","assets/frames/ezgif-frame-011.jpg","assets/frames/ezgif-frame-012.jpg","assets/frames/ezgif-frame-013.jpg","assets/frames/ezgif-frame-014.jpg","assets/frames/ezgif-frame-015.jpg","assets/frames/ezgif-frame-016.jpg","assets/frames/ezgif-frame-017.jpg","assets/frames/ezgif-frame-018.jpg","assets/frames/ezgif-frame-019.jpg","assets/frames/ezgif-frame-020.jpg","assets/frames/ezgif-frame-021.jpg","assets/frames/ezgif-frame-022.jpg","assets/frames/ezgif-frame-023.jpg","assets/frames/ezgif-frame-024.jpg","assets/frames/ezgif-frame-025.jpg","assets/frames/ezgif-frame-026.jpg","assets/frames/ezgif-frame-027.jpg","assets/frames/ezgif-frame-028.jpg","assets/frames/ezgif-frame-029.jpg","assets/frames/ezgif-frame-036.jpg","assets/frames/ezgif-frame-037.jpg","assets/frames/ezgif-frame-039.jpg","assets/frames/ezgif-frame-045.jpg","assets/frames/ezgif-frame-047.jpg","assets/frames/ezgif-frame-048.jpg","assets/frames/ezgif-frame-052.jpg","assets/frames/ezgif-frame-054.jpg","assets/frames/ezgif-frame-055.jpg","assets/frames/ezgif-frame-057.jpg","assets/frames/ezgif-frame-060.jpg","assets/frames/ezgif-frame-062.jpg","assets/frames/ezgif-frame-063.jpg","assets/frames/ezgif-frame-066.jpg","assets/frames/ezgif-frame-069.jpg","assets/frames/ezgif-frame-072.jpg","assets/frames/ezgif-frame-075.jpg","assets/frames/ezgif-frame-076.jpg","assets/frames/ezgif-frame-077.jpg","assets/frames/ezgif-frame-078.jpg","assets/frames/ezgif-frame-082.jpg","assets/frames/ezgif-frame-083.jpg","assets/frames/ezgif-frame-084.jpg","assets/frames/ezgif-frame-087.jpg","assets/frames/ezgif-frame-088.jpg","assets/frames/ezgif-frame-089.jpg","assets/frames/ezgif-frame-090.jpg","assets/frames/ezgif-frame-091.jpg","assets/frames/ezgif-frame-092.jpg","assets/frames/ezgif-frame-093.jpg","assets/frames/ezgif-frame-096.jpg","assets/frames/ezgif-frame-100.jpg","assets/frames/ezgif-frame-104.jpg","assets/frames/ezgif-frame-105.jpg"];
const TOTAL=FILES.length;
const frames=new Array(TOTAL);
let current=-1;
let target=0;
let raf=0;

function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const r=canvas.getBoundingClientRect();
  canvas.width=Math.round(r.width*dpr);
  canvas.height=Math.round(r.height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  draw(current<0?0:current);
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
  counter.textContent=String(index+1).padStart(2,"0")+" / "+TOTAL;
}

function loadAll(){
  return Promise.all(FILES.map((src,i)=>new Promise(resolve=>{
    const img=new Image();
    img.decoding="async";
    img.onload=()=>{frames[i]=img;resolve()};
    img.onerror=resolve;
    img.src=src;
  })));
}

function getProgress(){
  const start=exploded.offsetTop;
  const distance=exploded.offsetHeight-window.innerHeight;
  return Math.max(0,Math.min(1,(window.scrollY-start)/Math.max(1,distance)));
}

function update(){
  target=Math.round(getProgress()*(TOTAL-1));
  if(target!==current){
    current=target;
    draw(current);
  }
  raf=0;
}

window.addEventListener("scroll",()=>{if(!raf)raf=requestAnimationFrame(update)},{passive:true});
window.addEventListener("resize",resize);

loadAll().then(()=>{
  resize();
  update();
  document.documentElement.classList.add("frames-ready");
});