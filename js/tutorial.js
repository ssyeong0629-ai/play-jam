'use strict';
// Guided first-play tutorial (no words, except key labels):
//  ① Glowing A S D F keycaps. Four faint instruments wait at the start of the first line; any key snaps the next one into place
//     (other clicks and keys are paused meanwhile).
//  ② After the fourth, snow flows from the notes to ▶, the rest of the screen dims, and a dotted glowing
//     circle with "1" sits on ▶ with a soft "띵–동" chime — only ▶ (or Space) works — listen. If nothing happens for 5s
//     the circle pulses harder (and chimes once more, softer).
//  ②' Pressing ▶ switches to the view (감상) mode while it plays; a glowing ESC keycap (with a soft chime) shows how to
//     come back. Esc returns to editing.
//  ③ A circle with "2" on ⬇ — the save window opens; its × button glows (dotted circle) to show how to leave it.
//  When the save window closes: the four tutorial notes disappear (the score goes back to how it was), a small
//  "연주하다가 겨울 단어를 찾아보세요" message shows and the ? button glows softly for ~3s.
// Shown once after START (remembered in this browser). Esc during ①–② ends it early (also cleans up).
// The help dialog has "튜토리얼 다시 보기". The user's own score is set aside during the tutorial and put back after
// (kept in this browser, so even a reload in the middle restores it).
(()=>{
const KEY='mobile12.playjam.tutorial.done',STASH='mobile12.playjam.tutorial.stash';
const $=id=>document.getElementById(id);
// four guides from the start of the first line, close together (3 slots apart), one per key A S D F
const GUIDES=[{icon:'0-1',x:1/32,y:8},{icon:'1-1',x:4/32,y:6},{icon:'2-1',x:7/32,y:7},{icon:'3-1',x:10/32,y:4}];
const escView=$('wide').querySelector('.coach-esc-view');
let i=-1,keys,ring,spot,timer,placed=0,escHint=null,stepAt=0,bypass=false;
const stored=k=>{try{return localStorage.getItem(k);}catch{return null;}};
const store=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v);}catch{}};

// put the user's own score back (also after a reload in the middle of the tutorial)
function restore(){const raw=stored(STASH);if(!raw||!window.Jam)return;try{const st=JSON.parse(raw),s=window.Jam.state;s.notes=st.notes||[];s.eggs=st.eggs||[];}catch{}store(STASH,null);window.Jam.guides?.([]);window.Jam.render();}
restore();

const mobile=matchMedia('(max-width:600px)');
let practiceGroup=null;
function build(){
 keys=document.createElement('div');keys.id='coach-keys';keys.setAttribute('aria-hidden','true');
 keys.innerHTML='<span class="touch-instruction"></span><div class="coach-caps"><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><kbd>F</kbd></div><div class="coach-steps"><i></i><i></i><i></i><i></i></div>';
 ring=document.createElement('div');ring.id='coach-ring';ring.setAttribute('aria-hidden','true');ring.innerHTML='<i class="coach-glow"></i><i class="coach-dash"></i><b class="coach-num"></b>';
 spot=document.createElement('div');spot.id='coach-spot';spot.setAttribute('aria-hidden','true');spot.hidden=true;
 document.body.append(spot,ring,keys);
 // keys: during ① any letter/number key places the next guide; other keys are paused until the save window
 addEventListener('keydown',e=>{
  if(i<0||i===5&&(e.target.matches?.('.native-typing')||!e.isTrusted))return;
  if(e.key==='Escape'){if(i===4)return;if(i<=2&&!document.querySelector('dialog[open]')){e.preventDefault();finish(false);}return;}
  if(i===3)return;                                   // the save window handles its own keys
  if(i===1&&e.code==='Space'&&e.shiftKey){
   e.preventDefault();e.stopImmediatePropagation();preview();return;
  }
  if(e.metaKey||e.ctrlKey)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(i===0&&!e.repeat&&e.key.length===1)placeNext(e.code);
 },true);
 // clicks: only the highlighted button works during ②–③; nothing during ①
 const gate=e=>{if(i<0||i===3||bypass)return;if(i===0&&mobile.matches){
   const chip=e.target.closest?.('.dock-chip');
   if(chip){
    if(e.type==='click'){
     practiceGroup=Number(chip.dataset.dockGroup);
     if(window.Jam.state.pitchMode!=='fixed'){
      e.stopImmediatePropagation();
      placeNext('',Math.floor(Math.random()*8));
      return;
     }
     keys.querySelector('.touch-instruction').textContent='아래 건반을 한 번 눌러보세요';
    }
    return;
   }
   const pad=e.target.closest?.('.dock-key');
   if(pad&&practiceGroup!==null){
    e.stopImmediatePropagation();
    if(e.type==='click')placeNext('',Number(pad.dataset.dockKey));
    return;
   }
  }
  const ok=(i===5&&e.target.closest?.('.native-typing'))||(i===1&&e.target.closest?.('#play'))||(i===2&&e.target.closest?.('#png'))||(i===4&&e.target.closest?.('#wide, #edit-shared'));if(!ok){e.preventDefault();e.stopImmediatePropagation();}};
 for(const t of ['pointerdown','mousedown','click','dblclick'])addEventListener(t,gate,{capture:true});
 addEventListener('resize',place);$('viewport').addEventListener('scroll',place,{passive:true});
 const input=document.querySelector('.native-typing');
 input.addEventListener('scoreinput',()=>{
  if(i!==5)return;
  input.blur();
  requestAnimationFrame(()=>{if(i===5)show(1);});
 });
 $('play').addEventListener('click',e=>{if(i===1){e.stopImmediatePropagation();preview();}},true);
 $('png').addEventListener('click',()=>{if(i===2)setTimeout(()=>show(3),60);},true);
}
function placeNext(code,pad){
 const g=GUIDES[placed];if(!g)return;
 const note=pad===undefined?g:{...g,icon:practiceGroup+'-1',y:[12,10,9,7,5,3,2,0][pad]};
 window.Jam.addNote({...note,row:0,id:'tut-'+placed});placed++;
 window.Jam.guides(GUIDES.slice(placed).map(x=>({...x,row:0})));
 const k=/^Key([A-Z])$/.exec(code||'')?.[1]||'';keys.querySelectorAll('kbd').forEach((el,n)=>{if(el.textContent===k||(!'ASDF'.includes(k||'-')&&n===placed-1)){el.classList.remove('hit');void el.offsetWidth;el.classList.add('hit');}});
 keys.querySelectorAll('.coach-steps i').forEach((el,n)=>el.classList.toggle('on',n<placed));
 if(pad!==undefined){window.Jam.guides([]);show(5);return;}
 if(placed>=GUIDES.length)setTimeout(()=>show(1),450);
}
function show(n){i=n;document.body.classList.toggle('coach-on',n>=0);
 $('wide').classList.toggle('coach-return',n===4);
 const input=document.querySelector('.native-typing');
 input.classList.toggle('coach-type',n===5);
 input.placeholder=n===5?(window.Jam.state.pitchMode==='fixed'?'A 입력':'한 글자 입력'):'타이핑으로 연주';
 keys.hidden=n!==0;ring.hidden=!(n===1||n===2);
 // view step (after ▶): the score shows in the view mode while it plays; a glowing ESC keycap shows how to go back
 if(n===4){escView.textContent=mobile.matches?'편집으로 돌아가기':'Esc';escView.hidden=false;setTimeout(()=>{if(i===4)chime(.04);},700);}
 else escView.hidden=true;
 if(n===1||n===2){ring.querySelector('.coach-num').textContent=n;ring.classList.remove('urge');stepAt=performance.now();
  // where the eye should go: sparkles flow from the placed notes (or from ▶) to the button, and the rest of the screen dims
  const from=n===1?[...document.querySelectorAll('[data-note^="tut-"]')].map(el=>el.getBoundingClientRect()):[$('play').getBoundingClientRect()];
  flow(from,$(n===1?'play':'png').getBoundingClientRect());setTimeout(()=>{if(i===n)chime();},1150);}
 spot.hidden=!(n===1||n===2);
 // save step: the window's × button glows (dotted circle) to show how to leave
 if(n===3){const x=document.querySelector('#save-dialog .save-x');if(x&&!x.classList.contains('coach-hl')){x.classList.add('coach-hl');escHint=x;setTimeout(()=>{if(i===3)chime(.035);},500);}}
 place();}
function place(){
 if(i<0||!keys)return;
 if(i===0){const v=$('viewport').getBoundingClientRect();keys.style.left=v.left+v.width/2+'px';keys.style.top=v.top+v.height*.6+'px';return;}
 if(i!==1&&i!==2)return;const t=$(i===1?'play':'png');if(!t)return;const r=t.getBoundingClientRect(),d=Math.hypot(r.width,r.height)+12,cx=r.left+r.width/2,cy=r.top+r.height/2;
 Object.assign(ring.style,{left:cx-d/2+'px',top:cy-d/2+'px',width:d+'px',height:d+'px',visibility:''});
 Object.assign(spot.style,{left:cx-d/2+'px',top:cy-d/2+'px',width:d+'px',height:d+'px'});
}
// Soft white snow flies from the given boxes to the target button along gentle curves, then bursts there
// like a tiny firework of snow (~1.8s in all).
function flow(fromRects,to){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches||!fromRects.length)return;
 const c=document.createElement('canvas'),x=c.getContext('2d'),dpr=Math.min(devicePixelRatio||1,2),W=innerWidth,H=innerHeight;
 c.className='coach-flow';c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);document.body.append(c);
 const tx=to.left+to.width/2,ty=to.top+to.height/2,parts=[],burst=[];
 fromRects.forEach(r=>{for(let k=0;k<12;k++){const sx=r.left+r.width/2+(Math.random()-.5)*14,sy=r.top+r.height/2+(Math.random()-.5)*14;parts.push({sx,sy,cx:(sx+tx)/2+(Math.random()-.5)*160,cy:Math.min(sy,ty)-40-Math.random()*90,d:Math.random()*300,s:.7+Math.random()*1.1});}});
 const start=performance.now(),fly=900,arrive=fly+300;let last=start,burstDone=false;
 const dot=(px,py,r,a)=>{x.globalAlpha=a*.18;x.fillStyle='#fff';x.beginPath();x.arc(px,py,r*2.6,0,Math.PI*2);x.fill();x.globalAlpha=a;x.beginPath();x.arc(px,py,r,0,Math.PI*2);x.fill();};
 (function frame(now){const t=now-start,dt=Math.min(.05,(now-last)/1000);last=now;x.clearRect(0,0,W,H);x.globalCompositeOperation='lighter';
  for(const p of parts){const u=Math.min(1,Math.max(0,(t-p.d)/fly));if(!u||u>=1)continue;const e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2,a=(1-e)*(1-e),b=2*e*(1-e),q=e*e;
   dot(a*p.sx+b*p.cx+q*tx,a*p.sy+b*p.cy+q*ty,p.s,.55);}
  if(t>=arrive&&!burstDone){burstDone=true;for(let k=0;k<40;k++){const an=Math.random()*Math.PI*2,sp=50+Math.random()*120;burst.push({x:tx,y:ty,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,life:0,max:.7+Math.random()*.5,s:.6+Math.random()*1});}}
  for(const b of burst){b.life+=dt;b.vx*=Math.exp(-2.6*dt);b.vy=b.vy*Math.exp(-2.6*dt)+30*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;const f=Math.max(0,1-b.life/b.max);if(f)dot(b.x,b.y,b.s*(.6+.4*f),.6*f);}
  if(t<arrive+1300)requestAnimationFrame(frame);else c.remove();})(start);
}
// A soft two-note bell ("띵–동", quiet sine tones with a gentle fade) that says "press something now".
let actx=null;
function chime(gain=.05){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();const t0=actx.currentTime+.02;
 [[1318.5,0],[1760,.16]].forEach(([f,d])=>{const o=actx.createOscillator(),g=actx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t0+d);g.gain.linearRampToValueAtTime(gain,t0+d+.015);g.gain.exponentialRampToValueAtTime(.0001,t0+d+.9);o.connect(g).connect(actx.destination);o.start(t0+d);o.stop(t0+d+1);});}catch{}}
function preview(){
 bypass=true;
 try{if(!document.body.classList.contains('shared-view'))$('wide').click();}
 finally{bypass=false;}
 window.Jam.play?.();
 show(4);
}
function tick(){
 if(i<0)return;
 if((i===1||i===2)&&performance.now()-stepAt>5000&&!ring.classList.contains('urge')){ring.classList.add('urge');chime(.035);}
 if(i===4&&!document.body.classList.contains('shared-view'))show(2);
 else if(i===3&&!document.querySelector('#save-dialog[open]'))finish(true);
}
function begin(){
 if(!window.Jam)return;if(!keys)build();
 practiceGroup=null;
 keys.querySelector('.touch-instruction').textContent='아래 악기를 한 번 눌러보세요';
 if(mobile.matches&&document.body.classList.contains('dock-collapsed'))document.querySelector('.dock-min').click();
 const s=window.Jam.state;window.Jam.pause?.();
 if(!stored(STASH))store(STASH,JSON.stringify({notes:s.notes,eggs:s.eggs||[]}));
 s.notes=[];s.eggs=[];placed=0;window.Jam.render();window.Jam.guides(mobile.matches?[]:GUIDES.map(g=>({...g,row:0})));
 $('viewport').scrollTop=0;show(mobile.matches?5:0);clearInterval(timer);timer=setInterval(tick,200);
}
function finish(completed){
 clearInterval(timer);$('wide').classList.remove('coach-return');i=-1;document.body.classList.remove('coach-on');
 if(keys){keys.hidden=true;ring.hidden=true;spot.hidden=true;ring.classList.remove('urge');}escHint?.classList.remove('coach-hl');escHint=null;escView.hidden=true;
 if(document.body.classList.contains('shared-view')&&!window.Jam?.state?.__shared){bypass=true;try{document.querySelector('.mode-switch [data-mode="edit"]')?.click();}finally{bypass=false;}}
 window.Jam?.pause?.();restore();store(KEY,'1');
 if(completed){window.JamEaster?.say?.('연주하다가 겨울 단어를 찾아보세요 ❄','',{ms:3800});hintHelp();}
}
// After finishing, the ? (help) button glows softly for ~3s, without a number — a light hint, not a step.
function hintHelp(){setTimeout(()=>{const t=$('help');if(!t||!ring)return;const r=t.getBoundingClientRect(),d=Math.max(r.width,r.height)+30;
 Object.assign(ring.style,{left:r.left+r.width/2-d/2+'px',top:r.top+r.height/2-d/2+'px',width:d+'px',height:d+'px',visibility:''});
 ring.classList.add('soft');ring.hidden=false;setTimeout(()=>{ring.hidden=true;ring.classList.remove('soft');},3200);},600);}
// Start after START on a first visit (not for shared links, which open in view mode).
$('start').addEventListener('click',()=>{if(!stored(KEY)&&!document.body.classList.contains('shared-view'))setTimeout(begin,250);});
window.JamTutorial={begin,finish};
})();
