'use strict';
(()=>{
const original=JamAudio.target;let cached='',plan=new Map();
const hash=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
function build(s){const signature=JSON.stringify([s.soundTheme,s.bpm,s.notes.map(n=>[n.id,n.icon,n.voice,n.percussion,n.row,n.x,n.y])]);if(signature===cached)return;cached=signature;plan=new Map();
const seed=hash(JSON.stringify(s.notes.slice(0,12).map(n=>[n.icon,Math.round((n.row*8+n.x*8)*4),n.y]))),carol=s.soundTheme==='carol',beat=s.soundTheme==='beatbox',tonic=carol?[0,5,7][seed%3]:[0,2,5,7,9][seed%5],minor=carol?0:beat?1:(seed>>>3)%2,scale=beat?[0,3,5,7,10]:minor?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11],L=scale.length,progressions=[[0,3,4,0],[0,5,3,4],[0,4,5,3],[0,2,3,0]],progression=carol?[[0,3,4,0],[0,5,3,4],[0,3,0,4]][(seed>>>5)%3]:progressions[(seed>>>5)%4];
const ordered=s.notes.map((n,i)=>({...n,order:i,beat:n.row*8+n.x*8})).filter(n=>Number(n.icon.split('-')[0])!==0&&!n.percussion).sort((a,b)=>a.beat-b.beat||a.order-b.order);const active=[];
for(const n of ordered){const g=Number(n.icon.split('-')[0]),range={1:[55,79],2:[33,52],3:[48,72],4:[52,76],5:[43,67]}[g]||[48,72],degree=Math.round((12-n.y)*8/12),raw=(g===2?36:48)+tonic+12*Math.floor(degree/L)+scale[degree%L],root=progression[Math.floor(n.beat/4)%4],chord=[0,2,4].map(d=>(tonic+scale[(root+d)%L])%12),options=[];
for(let pitch=range[0];pitch<=range[1];pitch++)if(scale.includes(((pitch-tonic)%12+12)%12))options.push(pitch);
const base=options.reduce((a,b)=>Math.abs(b-raw)<Math.abs(a-raw)?b:a,options[0]);const sounding=active.filter(a=>a.end>n.beat+.0001);const conflicts=p=>sounding.reduce((v,a)=>v+([1,6,11].includes(Math.abs(p-a.pitch)%12)?1:0),0);
let pitch=base;if(conflicts(base)){pitch=options.slice().sort((a,b)=>conflicts(a)-conflicts(b)||Math.abs(a-base)-Math.abs(b-base)||(chord.includes(b%12)?1:0)-(chord.includes(a%12)?1:0)||a-b)[0];}
plan.set(n.id,pitch);active.push({pitch,end:n.beat+(n.accent?.18:.24)*s.bpm/60});while(active.length&&active[0].end<=n.beat)active.shift();}
window.JamDiverseInfo={tonic,minor,progression,pitches:[...plan]};
}
JamAudio.target=function(n,e){const s=window.Jam?.state;if(s&&s.pitchMode!=='fixed'&&Number(n.icon.split('-')[0])!==0){build(s);if(plan.has(n.id))return plan.get(n.id);}return original.call(this,n,e)};
})();
