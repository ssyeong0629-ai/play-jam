'use strict';
// Starlight from 초안5 with the falling snow removed: fixed twinkling stars, cleared over the staff lines.
(()=>{
// Background particles: every theme now shows soft falling snow (초안10, user decision: snow instead of stars,
// subtler than 초안9's carol snow). The star code is kept for reference. Cleared over the staff lines.
const viewport=document.getElementById('viewport'),stage=document.querySelector('main'),canvas=document.createElement('canvas');
canvas.id='staff-sparkles';canvas.setAttribute('aria-hidden','true');
Object.assign(canvas.style,{position:'fixed',pointerEvents:'none',zIndex:'24'});stage.append(canvas);
const ctx=canvas.getContext('2d'),motion=matchMedia('(prefers-reduced-motion: reduce)');
let w=0,h=0,last=0,raf=0,maskDirty=true,staffMasks=[],fx=0;
function refreshMasks(){if(!maskDirty)return;maskDirty=false;const base=stage.getBoundingClientRect();staffMasks=[...viewport.querySelectorAll('.staff')].map(el=>{const r=el.getBoundingClientRect();const sy=r.height/112;return{x:r.left-base.left-4,y:r.top-base.top+31*sy-4,w:r.width+8,h:52*sy+8};}).filter(r=>r.y+r.h>0&&r.y<h);}
viewport.addEventListener('scroll',()=>{maskDirty=true;},{passive:true});
new MutationObserver(()=>{maskDirty=true;}).observe(document.getElementById('pages'),{childList:true,subtree:true,attributes:true,attributeFilter:['style']});
const stars=Array.from({length:500},()=>({x:Math.random(),y:Math.random(),phase:Math.random()*6.28,rate:.4+Math.random()*.8,pick:Math.random()}));
const flakes=Array.from({length:130},()=>({x:Math.random(),y:Math.random(),speed:10+Math.random()*16,size:.7+Math.random()*1.4,phase:Math.random()*6.28,sway:6+Math.random()*10}));
const SKINS={
 band:{mode:'snow'},beatbox:{mode:'snow'},
 carol:{mode:'snow'}
};
const glows=new Map();
function glow(color){if(glows.has(color))return glows.get(color);const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),gr=g.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,color);gr.addColorStop(.15,color+'aa');gr.addColorStop(1,color+'00');g.fillStyle=gr;g.fillRect(0,0,32,32);glows.set(color,c);return c;}
function resize(){maskDirty=true;const b=stage.getBoundingClientRect();w=b.width;h=b.height;const d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);Object.assign(canvas.style,{left:b.left+'px',top:b.top+'px',width:w+'px',height:h+'px'});ctx.setTransform(d,0,0,d,0,0);}
function draw(now){raf=0;if(document.hidden||motion.matches)return;if(now-last<1000/30){raf=requestAnimationFrame(draw);return;}const dt=Math.min((now-last)/1000,.05);last=now;ctx.clearRect(0,0,w,h);
 const cfg=SKINS[document.body.dataset.skin]||SKINS.band,strength=.30+.09*(Number(document.getElementById('density').value)/100);
 if(cfg.mode==='snow'){
  // While an easter egg picture plays (body.egg-fx), the snow twinkles brighter, glows wider and some flakes flash a small cross.
  fx+=((document.body.classList.contains('egg-fx')?1:0)-fx)*Math.min(1,dt*2.5);
  for(const p of flakes){p.y=(p.y+dt*p.speed/Math.max(h,1))%1;const x=p.x*w+Math.sin(now*.0006+p.phase)*p.sway,y=p.y*h;
   const a=.45+.35*Math.sin(now*.0011+p.phase*3)**2,tw=fx*(.5+.5*Math.sin(now*.009+p.phase*7)),g=1+fx*.7;
   ctx.globalAlpha=Math.min(1,a*.28*(1+2.4*tw));ctx.drawImage(glow('#ffffff'),x-p.size*3*g,y-p.size*3*g,p.size*6*g,p.size*6*g);
   ctx.globalAlpha=Math.min(1,a*.55*(1+1.3*tw));ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(x,y,p.size*.8,0,Math.PI*2);ctx.fill();
   if(tw>.62&&p.size>1.3){const r=p.size*2.6*tw;ctx.globalAlpha=(tw-.62)*1.6;ctx.strokeStyle='#ffffff';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x+r,y);ctx.moveTo(x,y-r);ctx.lineTo(x,y+r);ctx.stroke();}}
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
