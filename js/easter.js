'use strict';
// Easter egg: typing "크리스마스" (Korean 2-set keys Z M F L T M A K T M) or "CHRISTMAS" while playing
// (free or keyboard mode) fires one short burst of celebration fireworks over the whole screen.
(()=>{
const WORDS=['ZMFLTMAKTM','CHRISTMAS'];
let typed='',lastAt=0,busy=false;
// Window capture runs before the app's own key handlers, which stop the event for mapped keys.
addEventListener('keydown',e=>{
 if(e.metaKey||e.ctrlKey||e.altKey||e.repeat)return;
 if(e.target.closest?.('input,textarea,select,[contenteditable],dialog')||document.querySelector('dialog[open]'))return;
 const m=/^Key([A-Z])$/.exec(e.code||'');if(!m)return;
 const now=performance.now();if(now-lastAt>2500)typed='';lastAt=now;
 typed=(typed+m[1]).slice(-12);
 if(WORDS.some(w=>typed.endsWith(w))){typed='';celebrate();}
},true);

function celebrate(){
 if(busy||matchMedia('(prefers-reduced-motion: reduce)').matches)return;busy=true;
 const c=document.createElement('canvas'),x=c.getContext('2d'),d=Math.min(devicePixelRatio||1,2);
 c.setAttribute('aria-hidden','true');Object.assign(c.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',pointerEvents:'none',zIndex:'90'});
 const W=innerWidth,H=innerHeight;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0);document.body.append(c);
 const colors=['#FF0049','#7DDCFF','#00E051','#FF9708','#FFE700','#B58AFF','#ffffff'];
 const rockets=[],sparks=[],start=performance.now();
 // 7 rockets launched over ~0.9s from the bottom; each bursts into a colored ring of sparks.
 for(let i=0;i<7;i++)rockets.push({at:i*130+Math.random()*80,x:W*(.12+.76*Math.random()),tx:0,ty:H*(.15+.35*Math.random()),y:H+10,color:colors[i%colors.length],done:false});
 rockets.forEach(r=>r.tx=r.x+(Math.random()-.5)*W*.12);
 let last=start;
 function frame(now){
  const dt=Math.min(.05,(now-last)/1000),t=now-start;last=now;
  x.clearRect(0,0,W,H);x.globalCompositeOperation='lighter';
  for(const r of rockets){
   if(r.done||t<r.at)continue;const k=Math.min(1,(t-r.at)/420),e=1-Math.pow(1-k,3);
   const rx=r.x+(r.tx-r.x)*e,ry=H+10+(r.ty-H-10)*e;
   x.globalAlpha=.9;x.fillStyle=r.color;x.beginPath();x.arc(rx,ry,2.2,0,Math.PI*2);x.fill();
   x.globalAlpha=.35;x.beginPath();x.arc(rx,ry+8,1.4,0,Math.PI*2);x.fill();
   if(k>=1){r.done=true;const n=70;for(let j=0;j<n;j++){const a=j/n*Math.PI*2+Math.random()*.08,s=120+Math.random()*170;sparks.push({x:rx,y:ry,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0,max:.9+Math.random()*.5,color:Math.random()<.18?'#ffffff':r.color});}}
  }
  for(const p of sparks){p.life+=dt;p.vx*=Math.exp(-2.2*dt);p.vy=p.vy*Math.exp(-2.2*dt)+140*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
   const f=Math.max(0,1-p.life/p.max);if(!f)continue;x.globalAlpha=f;x.fillStyle=p.color;x.beginPath();x.arc(p.x,p.y,1.3+1.2*f,0,Math.PI*2);x.fill();}
  x.globalAlpha=1;x.globalCompositeOperation='source-over';
  if(t<2600)requestAnimationFrame(frame);else{c.remove();busy=false;}
 }
 requestAnimationFrame(frame);
}
window.JamEaster={celebrate};
})();
