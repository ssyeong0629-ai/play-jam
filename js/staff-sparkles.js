'use strict';
// Starlight from 초안5 with the falling snow removed: fixed twinkling stars, cleared over the staff lines.
(()=>{
// Background particles per screen skin: band = twinkling white stars (from 초안5, snow removed),
// carol = falling snow (soft white flakes on the black screen). Cleared over the staff lines.
const viewport=document.getElementById('viewport'),stage=document.querySelector('main'),canvas=document.createElement('canvas');
canvas.id='staff-sparkles';canvas.setAttribute('aria-hidden','true');
Object.assign(canvas.style,{position:'fixed',pointerEvents:'none',zIndex:'24'});stage.append(canvas);
const ctx=canvas.getContext('2d'),motion=matchMedia('(prefers-reduced-motion: reduce)');
let w=0,h=0,last=0,raf=0,maskDirty=true,staffMasks=[];
function refreshMasks(){if(!maskDirty)return;maskDirty=false;const base=stage.getBoundingClientRect();staffMasks=[...viewport.querySelectorAll('.staff')].map(el=>{const r=el.getBoundingClientRect();const sy=r.height/112;return{x:r.left-base.left-4,y:r.top-base.top+31*sy-4,w:r.width+8,h:52*sy+8};}).filter(r=>r.y+r.h>0&&r.y<h);}
viewport.addEventListener('scroll',()=>{maskDirty=true;},{passive:true});
new MutationObserver(()=>{maskDirty=true;}).observe(document.getElementById('pages'),{childList:true,subtree:true,attributes:true,attributeFilter:['style']});
const stars=Array.from({length:500},()=>({x:Math.random(),y:Math.random(),phase:Math.random()*6.28,rate:.4+Math.random()*.8,pick:Math.random()}));
const flakes=Array.from({length:170},()=>({x:Math.random(),y:Math.random(),speed:14+Math.random()*22,size:.9+Math.random()*1.9,phase:Math.random()*6.28,sway:6+Math.random()*10}));
const SKINS={
 band:{mode:'stars',colors:['#ffffff']},
 carol:{mode:'snow'}
};
const glows=new Map();
function glow(color){if(glows.has(color))return glows.get(color);const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),gr=g.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,color);gr.addColorStop(.15,color+'aa');gr.addColorStop(1,color+'00');g.fillStyle=gr;g.fillRect(0,0,32,32);glows.set(color,c);return c;}
function resize(){maskDirty=true;const b=stage.getBoundingClientRect();w=b.width;h=b.height;const d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);Object.assign(canvas.style,{left:b.left+'px',top:b.top+'px',width:w+'px',height:h+'px'});ctx.setTransform(d,0,0,d,0,0);}
function draw(now){raf=0;if(document.hidden||motion.matches)return;if(now-last<1000/30){raf=requestAnimationFrame(draw);return;}const dt=Math.min((now-last)/1000,.05);last=now;ctx.clearRect(0,0,w,h);
 const cfg=SKINS[document.body.dataset.skin]||SKINS.band,strength=.30+.09*(Number(document.getElementById('density').value)/100);
 if(cfg.mode==='snow'){
  for(const p of flakes){p.y=(p.y+dt*p.speed/Math.max(h,1))%1;const x=p.x*w+Math.sin(now*.0006+p.phase)*p.sway,y=p.y*h;
   const a=.45+.35*Math.sin(now*.0011+p.phase*3)**2;ctx.globalAlpha=a*.55;ctx.drawImage(glow('#ffffff'),x-p.size*3,y-p.size*3,p.size*6,p.size*6);
   ctx.globalAlpha=a;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(x,y,p.size*.8,0,Math.PI*2);ctx.fill();}
 }else{
  const n=Math.min(stars.length,cfg.count||stars.length);
  for(let i=0;i<n;i++){const p=stars[i],x=p.x*w,y=p.y*h,t=Math.pow(.5+.5*Math.sin(now*.001*p.rate+p.phase),4),color=cfg.colors[Math.floor(p.pick*cfg.colors.length)];
   ctx.globalAlpha=(.08+t*.75)*strength*(cfg.colors[0]==='#ffffff'?1:1.4);
   if(cfg.square){ctx.fillStyle=color;const s=1.2+t*1.6;ctx.fillRect(x-s/2,y-s/2,s,s);continue;}
   ctx.drawImage(glow(color),x-6,y-6,12,12);ctx.fillStyle=color;ctx.fillRect(x-.5,y-.5,1,1);
   if(t>.85&&i%4===0){ctx.strokeStyle=color;ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x+3,y);ctx.moveTo(x,y-3);ctx.lineTo(x,y+3);ctx.stroke();}}
 }
 ctx.globalAlpha=1;refreshMasks();for(const r of staffMasks)ctx.clearRect(r.x,r.y,r.w,r.h);raf=requestAnimationFrame(draw);}
function resume(){if(raf)cancelAnimationFrame(raf);raf=0;last=performance.now();if(!document.hidden&&!motion.matches)raf=requestAnimationFrame(draw);else ctx.clearRect(0,0,w,h);}
new ResizeObserver(resize).observe(viewport);addEventListener('resize',resize);document.addEventListener('visibilitychange',resume);motion.addEventListener('change',resume);resize();resume();
})();

(()=>{let timer;function show(){clearTimeout(timer);document.body.classList.remove('keyboard-cursor-hidden');}window.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.target.closest?.('input,textarea,select,[contenteditable],dialog')||document.querySelector('dialog[open]')||document.body.classList.contains('shared-view'))return;if(e.key.length!==1&&!['Backspace','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;document.body.classList.add('keyboard-cursor-hidden');clearTimeout(timer);timer=setTimeout(show,1600);},true);document.addEventListener('pointermove',show,{passive:true});document.addEventListener('pointerdown',show,{passive:true});addEventListener('blur',show);})();
