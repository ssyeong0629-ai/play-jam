"use strict";
window.JamBacking={
 signature(notes){return JSON.stringify(notes.map(n=>[n.row,n.x,n.y,n.icon]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]||a[3].localeCompare(b[3])));},
 build(notes){const source=this.signature(notes),events=[];if(!notes.length)return {version:1,source,beats:0,events};const beats=Math.min(504,Math.ceil((Math.max(...notes.map(n=>n.row*8+n.x*8))+.25)/4)*4);
 const put=(beat,voice,gain)=>{if(!events.some(e=>e.beat===beat&&e.voice===voice))events.push({beat,voice,gain});};
 for(let bar=0;bar<beats;bar+=4){const local=notes.filter(n=>n.row*8+n.x*8>=bar&&n.row*8+n.x*8<bar+4),dense=local.length>7,drums=local.some(n=>n.icon[0]==='0'),level=drums?.65:1;
 put(bar,'kick',.34*level);put(bar+2,'kick',.25*level);put(bar+1,'snare',.12*level);put(bar+3,'snare',.15*level);
 const step=dense?1:.5;for(let t=0;t<4;t+=step)put(bar+t,'hat',(t%1?.055:.075)*level);
 const accents=[...new Set(local.map(n=>Math.round((n.row*8+n.x*8-bar)*4)/4))].filter(t=>t>0&&t<4&&t%1!==0);
 if(!dense)for(const t of accents.slice(0,2))put(bar+t,'kick',.18*level);
 if((bar/4)%4===3&&!dense&&local.length)put(bar+3.75,'snare',.065*level);
 }events.sort((a,b)=>a.beat-b.beat||a.voice.localeCompare(b.voice));return {version:1,source,beats,events};},
 validate(b){if(!b||b.version!==1||typeof b.source!=='string'||b.source.length>300000||!Number.isFinite(b.beats)||b.beats<0||b.beats>504||!Array.isArray(b.events)||b.events.length>6000)return null;if(!b.events.every(e=>Number.isFinite(e.beat)&&e.beat>=0&&e.beat<b.beats&&['kick','snare','hat'].includes(e.voice)&&Number.isFinite(e.gain)&&e.gain>0&&e.gain<=.5))return null;return {version:1,source:b.source,beats:b.beats,events:b.events.map(e=>({beat:e.beat,voice:e.voice,gain:e.gain}))};},
 hit(e,at){const A=JamAudio,c=A.ctx,g=c.createGain(),nodes=[g];let node;
 if(e.voice==='kick'){node=c.createOscillator();node.type='sine';node.frequency.setValueAtTime(125,at);node.frequency.exponentialRampToValueAtTime(46,at+.11);node.connect(g);}
 else{node=c.createBufferSource();if(!this.noise||this.noise.sampleRate!==c.sampleRate){this.noise=c.createBuffer(1,c.sampleRate*.3,c.sampleRate);const d=this.noise.getChannelData(0);let seed=7193;for(let i=0;i<d.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;d[i]=seed/2147483648-1;}}node.buffer=this.noise;const filter=c.createBiquadFilter();filter.type=e.voice==='hat'?'highpass':'bandpass';filter.frequency.value=e.voice==='hat'?7500:1600;filter.Q.value=.7;node.connect(filter);filter.connect(g);nodes.push(filter);}
 const duration=e.voice==='kick'?.19:e.voice==='snare'?.12:.045;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(e.gain,at+.003);g.gain.exponentialRampToValueAtTime(.0001,at+duration);g.connect(A.master);A.voices.add(node);node.onended=()=>{A.voices.delete(node);node.disconnect();nodes.forEach(n=>n.disconnect());};node.start(at);node.stop(at+duration+.01);
 }
};
