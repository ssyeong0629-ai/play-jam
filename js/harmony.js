"use strict";
window.JamHarmony={
 validate(h){if(!h||h.version!==1||!['bright','soft','pulse','deep'].includes(h.profile)||!Array.isArray(h.chords)||h.chords.length!==4||!Array.isArray(h.roots)||h.roots.length!==4)return null;if(!h.chords.every(c=>Array.isArray(c)&&c.length===3&&c.every(n=>Number.isInteger(n)&&n>=0&&n<12))||!h.roots.every(n=>Number.isInteger(n)&&n>=28&&n<=48))return null;return {version:1,profile:h.profile,chords:h.chords.map(c=>[...c]),roots:[...h.roots]};},
 choose(notes){const sample=notes.slice(0,12),avg=sample.reduce((v,n)=>v+n.y,0)/Math.max(1,sample.length),bass=sample.filter(n=>['2','11'].includes(n.icon.split('-')[0])).length/Math.max(1,sample.length);let gaps=[];const last={};for(const n of sample){const g=n.icon.split('-')[0],beat=n.row*8+n.x*8;if(last[g]!==undefined&&beat>=last[g])gaps.push(beat-last[g]);last[g]=beat;}const gap=gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:1;
 const profile=bass>=.4||avg>=8?'deep':avg<=4?'bright':gap<=.5?'pulse':'soft';
 const options={bright:{chords:[[0,4,7],[7,11,2],[9,0,4],[5,9,0]],roots:[36,31,33,41]},soft:{chords:[[0,4,7],[4,7,11],[5,9,0],[0,4,7]],roots:[36,40,41,36]},pulse:{chords:[[0,4,7],[5,9,0],[0,4,7],[7,11,2]],roots:[36,41,36,31]},deep:{chords:[[9,0,4],[5,9,0],[0,4,7],[7,11,2]],roots:[33,41,36,31]}};
 return {version:1,profile,...options[profile]};}
};
