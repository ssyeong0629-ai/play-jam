'use strict';
// Follow-along tutorial without words (3 steps): light and translucent icons show what to do next.
//  ① glowing A S D F keycaps in the middle of the score → place 3 symbols
//  ② a white dotted circle + a soft round glow on ▶, with a fixed number 1 → press play
//  ③ the same on ⬇ with a fixed number 2 → open the save window
// Shown once after START (remembered in this browser). No close mark on screen; Esc ends it quietly. The help dialog has "튜토리얼 다시 보기".
(()=>{
const KEY='playjam.tutorial.done',NEED=3;
const $=id=>document.getElementById(id);
let i=-1,keys,hint,ring,timer,startNotes=0;
const stored=k=>{try{return localStorage.getItem(k);}catch{return null;}};
const store=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
function build(){
 keys=document.createElement('div');keys.id='coach-keys';keys.setAttribute('aria-hidden','true');
 keys.innerHTML='<div class="coach-caps"><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><kbd>F</kbd></div><div class="coach-steps"><i></i><i></i><i></i></div>';
 hint=document.createElement('div');hint.id='coach-hint';
 hint.hidden=true;
 ring=document.createElement('div');ring.id='coach-ring';ring.setAttribute('aria-hidden','true');ring.innerHTML='<i class="coach-glow"></i><i class="coach-dash"></i><b class="coach-num"></b>';
 document.body.append(ring,keys,hint);
 addEventListener('keydown',e=>{if(i>=0&&e.key==='Escape'&&!document.querySelector('dialog[open]'))finish(false);},true);
 // pressing a key lights up its keycap
 addEventListener('keydown',e=>{if(i!==0)return;const k=/^Key([A-Z])$/.exec(e.code||'')?.[1];keys.querySelectorAll('kbd').forEach(el=>{if(el.textContent===k){el.classList.remove('hit');void el.offsetWidth;el.classList.add('hit');}});},true);
 addEventListener('resize',place);$('viewport').addEventListener('scroll',place,{passive:true});
 $('png').addEventListener('click',()=>{if(i===2)finish(true);},true);
}
function show(n){i=n;document.body.classList.toggle('coach-on',n>=0);
 keys.hidden=n!==0;hint.hidden=true;ring.hidden=n===0;
 if(n>0){hint.dataset.step=n;ring.querySelector('.coach-num').textContent=n;}
 place();}
function place(){
 if(i<0||!keys)return;
 if(i===0){const v=$('viewport').getBoundingClientRect();keys.style.left=v.left+v.width/2+'px';keys.style.top=v.top+v.height*.38+'px';return;}
 const t=$(i===1?'play':'png');if(!t)return;const r=t.getBoundingClientRect();
 // a circle of light centered on the button, a bit larger than it; the × sits at its lower right
 const d=Math.max(r.width,r.height)+30,cx=r.left+r.width/2,cy=r.top+r.height/2;
 Object.assign(ring.style,{left:cx-d/2+'px',top:cy-d/2+'px',width:d+'px',height:d+'px'});
 hint.style.left=Math.min(innerWidth-16,cx+d/2+4)+'px';hint.style.top=cy+d/2-6+'px';
}
function tick(){
 if(i<0)return;const J=window.Jam;if(!J)return;
 const away=document.body.classList.contains('shared-view')||!!document.querySelector('dialog[open]');
 keys.style.visibility=hint.style.visibility=ring.style.visibility=away?'hidden':'';if(away)return;
 if(i===0){const placed=Math.max(0,J.state.notes.length-startNotes);keys.querySelectorAll('.coach-steps i').forEach((el,k)=>el.classList.toggle('on',k<placed));if(placed>=NEED)show(1);}
 else if(i===1){if($('play').textContent==='Ⅱ')show(2);}
}
function begin(){
 if(!keys)build();startNotes=window.Jam?.state.notes.length||0;show(0);clearInterval(timer);timer=setInterval(tick,200);
}
function finish(completed){
 clearInterval(timer);i=-1;document.body.classList.remove('coach-on');if(keys){keys.hidden=true;hint.hidden=true;ring.hidden=true;}store(KEY,'1');
 if(completed){window.JamEaster?.say?.('완성! ❄','연주하다가 겨울 단어를 찾아보세요');hintHelp();}
}
// After finishing, the ? (help) button glows softly for ~3s, without a number — a light hint, not a step.
// It waits until the save window (opened by the last step) is closed.
function hintHelp(){const startAt=Date.now();(function wait(){
 if(document.querySelector('dialog[open]')){if(Date.now()-startAt<20000)setTimeout(wait,300);return;}
 const t=$('help');if(!t||!ring)return;const r=t.getBoundingClientRect(),d=Math.max(r.width,r.height)+30;
 Object.assign(ring.style,{left:r.left+r.width/2-d/2+'px',top:r.top+r.height/2-d/2+'px',width:d+'px',height:d+'px',visibility:''});
 ring.classList.add('soft');ring.hidden=false;setTimeout(()=>{ring.hidden=true;ring.classList.remove('soft');},3200);})();}
// Start after START on a first visit (not for shared links, which open in view mode).
$('start').addEventListener('click',()=>{if(!stored(KEY)&&!document.body.classList.contains('shared-view'))setTimeout(begin,250);});
window.JamTutorial={begin,finish};
})();
