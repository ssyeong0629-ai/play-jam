"use strict";
(()=>{
 const pages=document.querySelector('#pages'),reduce=matchMedia('(prefers-reduced-motion: reduce)'),active=new WeakSet(),running=new Set();
 function squash(el){
  if(reduce.matches)return;const shape=el.querySelector('.shape');if(!shape)return;
  const strength=Math.max(0,Math.min(1,Jam.state.density/100)),circle=el.classList.contains('circle-icon'),amount=(.12+strength*.22)*(circle?1:.78);
  const note=Jam.state.notes.find(n=>n.id===el.dataset.note),near=note?Jam.state.notes.filter(n=>n.row===note.row&&Math.abs(n.x-note.x)<.075).length:1;
  const jump=(1+strength*3)*(near>3?.45:1),animation=shape.animate([
   {transform:'translateY(0) scale(1,1)',offset:0},
   {transform:`translateY(1px) scale(${1+amount},${1-amount})`,offset:.2},
   {transform:`translateY(${-jump}px) scale(${1-amount*.4},${1+amount*.65})`,offset:.49},
   {transform:`translateY(.4px) scale(${1+amount*.12},${1-amount*.12})`,offset:.78},
   {transform:'translateY(0) scale(1,1)',offset:1}
  ],{duration:300,easing:'cubic-bezier(.25,.7,.3,1)'});
  running.add(animation);animation.onfinish=()=>running.delete(animation);animation.oncancel=()=>running.delete(animation);
 }
 new MutationObserver(records=>{for(const {target:el} of records){if(!el.matches?.('.note'))continue;const hit=el.classList.contains('hit');if(hit&&!active.has(el)){active.add(el);squash(el);}else if(!hit)active.delete(el);}}).observe(pages,{subtree:true,attributes:true,attributeFilter:['class']});
 function cancel(){for(const animation of running)animation.cancel();running.clear();}
 reduce.addEventListener('change',()=>{if(reduce.matches)cancel();});
 new MutationObserver(()=>{if(!document.body.classList.contains('playing'))cancel();}).observe(document.body,{attributes:true,attributeFilter:['class']});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
})();
