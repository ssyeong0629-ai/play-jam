'use strict';
// Faint fixed starlight over the sidebar, workspace header and score.
// Each star stays in place and never disappears; it only drifts between dimmer and brighter at its own random pace (CSS opacity only).
(()=>{
const main=document.querySelector('main');
if(!main)return;
const layer=document.createElement('div');layer.id='staff-stars';layer.setAttribute('aria-hidden','true');
const count=70;
for(let i=0;i<count;i++){
 const s=document.createElement('i'),lo=.08+Math.random()*.06,hi=lo+.12+Math.random()*.16;
 s.style.cssText=`left:${(Math.random()*100).toFixed(2)}%;top:${(Math.random()*100).toFixed(2)}%;--lo:${lo.toFixed(2)};--hi:${hi.toFixed(2)};--size:${(Math.random()<.15?1.8:1.2+Math.random()*.4).toFixed(1)}px;animation-duration:${(3+Math.random()*6).toFixed(1)}s;animation-delay:-${(Math.random()*9).toFixed(1)}s`;
 layer.append(s);
}
main.append(layer);
})();

(()=>{let timer;function show(){clearTimeout(timer);document.body.classList.remove('keyboard-cursor-hidden');}window.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.target.closest?.('input,textarea,select,[contenteditable],dialog')||document.querySelector('dialog[open]')||document.body.classList.contains('shared-view'))return;if(e.key.length!==1&&!['Backspace','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;document.body.classList.add('keyboard-cursor-hidden');clearTimeout(timer);timer=setTimeout(show,1600);},true);document.addEventListener('pointermove',show,{passive:true});document.addEventListener('pointerdown',show,{passive:true});addEventListener('blur',show);})();
