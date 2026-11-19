'use strict';
// Sound themes. "band" keeps the bundled recordings unchanged. "carol" replaces every voice with
// browser-synthesized winter instruments (no external audio files), keeping each key's role and timing:
// 1 drums -> sleigh bells, 2 synth lead -> glockenspiel, 3 bass -> tuba, 4 acoustic (chords) -> celesta,
// 5 clean guitar -> music box (two octaves up), 6 drive (accent) -> handbell, ',' hi-hat -> shaker, '.' kick -> soft bass drum.
// "beatbox" voices every role with a synthesized mouth sound: 1 vocal drums (북 / 치 / 박), 2 short mouth pop "톡", 3 mouth bass,
// 4 "aah" chorus, 5 "ooh" vocal, 6 scratch, ',' "ts" hat, '.' vocal kick.
(()=>{
const A=JamAudio;
const theme=()=>window.Jam?.state?.soundTheme||'band';
const carol=()=>theme()==='carol';
const beatbox=()=>theme()==='beatbox';
const synthTheme=()=>carol()||beatbox();
const hz=m=>440*2**((m-69)/12);
let noiseBuffer=null,bus=null;
// Brighter carol: lift the highs and add a soft short echo so bells shimmer.
function out(){const c=A.ctx;if(bus&&bus.context===c)return bus;bus=c.createGain();const shelf=c.createBiquadFilter(),delay=c.createDelay(1),fb=c.createGain(),wet=c.createGain(),lp=c.createBiquadFilter();
 shelf.type='highshelf';shelf.frequency.value=2500;shelf.gain.value=6;delay.delayTime.value=.17;fb.gain.value=.28;wet.gain.value=.2;lp.type='lowpass';lp.frequency.value=7000;
 bus.connect(shelf);shelf.connect(A.master);shelf.connect(delay);delay.connect(lp);lp.connect(fb);fb.connect(delay);lp.connect(wet);wet.connect(A.master);return bus;}
function noise(c){if(!noiseBuffer||noiseBuffer.sampleRate!==c.sampleRate){noiseBuffer=c.createBuffer(1,c.sampleRate*.6,c.sampleRate);const d=noiseBuffer.getChannelData(0);let seed=2741;for(let i=0;i<d.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;d[i]=seed/2147483648-1;}}return noiseBuffer;}
// Register a source so pause/stop silences it, and disconnect everything when it ends.
function track(src,nodes){A.voices.add(src);src.onended=()=>{A.voices.delete(src);nodes.forEach(n=>{try{n.disconnect();}catch{}});};}
// Additive bell-like voice: partials = [ratio, level, decay seconds].
function partials(f,t,level,list,attack=.002){const c=A.ctx,mix=c.createGain();mix.gain.value=level;mix.connect(out());let left=list.length;
 for(const [ratio,amp,decay] of list){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f*ratio;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(amp,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+decay);o.connect(g);g.connect(mix);
  A.voices.add(o);o.onended=()=>{A.voices.delete(o);o.disconnect();g.disconnect();if(--left===0)mix.disconnect();};o.start(t);o.stop(t+decay+.02);}}
const voices={
 1:(f,t,v)=>partials(f*2,t,.16*v,[[1,1,1.4],[2.76,.4,.5],[5.4,.2,.25],[8.93,.1,.15]],.001), // glockenspiel, an octave up
 3:(f,t,v)=>partials(f*2,t,.13*v,[[1,1,1.2],[2,.45,.7],[3,.2,.4],[4,.1,.25]],.003),                  // celesta
 4:(f,t,v)=>partials(f*4,t,.12*v,[[1,1,1],[3,.3,.35],[4.2,.15,.2],[6.1,.06,.12]],.001),                      // music box
 5:(f,t,v)=>partials(f*2,t,.15*v,[[1,1,2],[2,.5,1.2],[2.4,.35,.9],[3,.28,.6],[4.2,.16,.35],[5.4,.08,.2]]),// handbell
 // Soft round tuba: mellow triangle+sine with a fixed low filter and a fading tail, quieter, and
 // routed past the carol brightening bus so it sits under the bells instead of sticking out.
 2:(f,t,v,d)=>{const c=A.ctx,o=c.createOscillator(),sub=c.createOscillator(),lp=c.createBiquadFilter(),g=c.createGain(),len=Math.max(.22,d+.14);
  o.type='triangle';o.frequency.value=f;sub.type='sine';sub.frequency.value=f;lp.type='lowpass';lp.Q.value=.3;lp.frequency.value=Math.min(900,f*2.5);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.068*v,t+.035);g.gain.exponentialRampToValueAtTime(.026*v,t+len*.6);g.gain.linearRampToValueAtTime(0,t+len);
  o.connect(lp);sub.connect(lp);lp.connect(g);g.connect(A.master);track(o,[o,sub,lp,g]);sub.onended=()=>A.voices.delete(sub);A.voices.add(sub);o.start(t);sub.start(t);o.stop(t+len+.01);sub.stop(t+len+.01);}
};
// Sleigh bells: a few jittered bursts of bright noise plus small metallic rings.
function sleigh(t,v,long){const c=A.ctx,hits=long?4:3;for(let i=0;i<hits;i++){const at=t+i*.022+(i?Math.random()*.008:0),src=c.createBufferSource(),bp=c.createBiquadFilter(),g=c.createGain();src.buffer=noise(c);bp.type='bandpass';bp.frequency.value=7200+Math.random()*1500;bp.Q.value=2.5;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.12*v*(i?0.75:1),at+.002);g.gain.exponentialRampToValueAtTime(.0001,at+.09);src.connect(bp);bp.connect(g);g.connect(out());track(src,[src,bp,g]);src.start(at,Math.random()*.4);src.stop(at+.1);}
 partials(5200,t,.035*v,[[1,1,.25],[1.37,.6,.2],[1.83,.4,.15]]);}
function triangleTap(t,v){partials(2600,t,.06*v,[[1,1,.7],[2.71,.3,.3],[5.1,.15,.15]]);}
function shaker(t,v){const c=A.ctx,src=c.createBufferSource(),bp=c.createBiquadFilter(),g=c.createGain();src.buffer=noise(c);bp.type='bandpass';bp.frequency.value=5200;bp.Q.value=1.1;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09*v,t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+.075);src.connect(bp);bp.connect(g);g.connect(out());track(src,[src,bp,g]);src.start(t,Math.random()*.4);src.stop(t+.09);}
function softDrum(t,v){const c=A.ctx,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(95,t);o.frequency.exponentialRampToValueAtTime(52,t+.22);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.26*v,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.32);o.connect(g);g.connect(out());track(o,[o,g]);o.start(t);o.stop(t+.34);
 const src=c.createBufferSource(),lp=c.createBiquadFilter(),ng=c.createGain();src.buffer=noise(c);lp.type='lowpass';lp.frequency.value=380;ng.gain.setValueAtTime(.05*v,t);ng.gain.exponentialRampToValueAtTime(.0001,t+.08);src.connect(lp);lp.connect(ng);ng.connect(out());track(src,[src,lp,ng]);src.start(t);src.stop(t+.09);}

// ---------- Beatbox: mouth sounds, all synthesized (human-beatbox style: "북 / 치 / 박 / 츠") ----------
let beatBus=null;
function beatOut(){const c=A.ctx;if(beatBus&&beatBus.context===c)return beatBus;beatBus=c.createGain();const ws=c.createWaveShaper(),lp=c.createBiquadFilter(),curve=new Float32Array(1025);
 for(let i=0;i<curve.length;i++){const x=i*2/1024-1;curve[i]=Math.tanh(x*3.2)/Math.tanh(3.2);}ws.curve=curve;ws.oversample='2x';lp.type='lowpass';lp.frequency.value=9500;
 beatBus.connect(ws);ws.connect(lp);lp.connect(A.master);return beatBus;}
function env(g,t,peak,attack,len){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+len);}
function burst(t,{type='bandpass',freq=2000,q=1,peak=.1,attack=.002,len=.08,to=null}){const c=A.ctx,src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();src.buffer=noise(c);f.type=type;f.frequency.setValueAtTime(freq,t);if(to)f.frequency.exponentialRampToValueAtTime(to,t+len);f.Q.value=q;env(g,t,peak,attack,len);src.connect(f);f.connect(g);g.connect(beatOut());track(src,[src,f,g]);src.start(t,Math.random()*.4);src.stop(t+len+.02);}
function tone(t,{type='sine',from,to=from,peak=.2,attack=.003,len=.12}){const c=A.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(from,t);if(to!==from)o.frequency.exponentialRampToValueAtTime(to,t+len*.7);env(g,t,peak,attack,len);o.connect(g);g.connect(beatOut());track(o,[o,g]);o.start(t);o.stop(t+len+.02);}
// "북" (B kick): lip pop + fast falling low thump.
const vocalKick=(t,v)=>{tone(t,{from:120,to:48,peak:.55*v,attack:.002,len:.2});burst(t,{type:'lowpass',freq:650,q:.8,peak:.16*v,attack:.001,len:.03});tone(t,{type:'square',from:75,to:55,peak:.05*v,attack:.001,len:.03});};
// "박" (Pk snare): small 'p' pop + snappy air burst + short body.
const vocalSnare=(t,v)=>{burst(t,{type:'lowpass',freq:900,peak:.08*v,attack:.001,len:.015});burst(t,{freq:2600,q:.7,peak:.3*v,attack:.002,len:.11,to:1700});tone(t,{type:'triangle',from:330,to:210,peak:.07*v,len:.05});};
// "치" (ch): sharp fricative.
const vocalCh=(t,v)=>burst(t,{freq:4800,q:1.2,peak:.18*v,attack:.004,len:.09,to:3600});
const tongueClick=(t,v)=>{tone(t,{from:2300,to:1500,peak:.09*v,attack:.001,len:.03});burst(t,{type:'highpass',freq:3000,peak:.04*v,len:.02});}; // "t"
// "츠" (ts hat): short bright hiss.
const vocalHat=(t,v)=>burst(t,{type:'highpass',freq:7200,q:.7,peak:.12*v,attack:.002,len:.05});
// Formant voice: two detuned saws through vowel-shaped bandpass filters.
// Short sung syllables ("밥/둡"): consonant onset, quick fade; glide>1 starts sharp and drops (vocal bass "붐").
function vowel(f,t,v,d,formants,peak,glide=1,maxLen=.18,onset=1400){burst(t,{type:'lowpass',freq:onset,peak:.035*v,attack:.001,len:.022});const c=A.ctx,len=Math.max(.11,Math.min(maxLen,d+.03)),g=c.createGain(),oscs=[1,1.006].map(k=>{const o=c.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(f*k*glide,t);if(glide!==1)o.frequency.exponentialRampToValueAtTime(f*k,t+.06);return o;}),lfo=c.createOscillator(),depth=c.createGain();
 lfo.frequency.value=5.2;depth.gain.value=f*.008;lfo.connect(depth);oscs.forEach(o=>depth.connect(o.frequency));
 const nodes=[g,lfo,depth,...oscs];for(const [fq,q,amp] of formants){const bp=c.createBiquadFilter(),fg=c.createGain();bp.type='bandpass';bp.frequency.value=fq;bp.Q.value=q;fg.gain.value=amp;oscs.forEach(o=>o.connect(bp));bp.connect(fg);fg.connect(g);nodes.push(bp,fg);}
 g.gain.setValueAtTime(0,t+.012);g.gain.linearRampToValueAtTime(peak*v,t+.026);g.gain.exponentialRampToValueAtTime(peak*v*.3,t+len*.65);g.gain.linearRampToValueAtTime(0,t+len);g.connect(beatOut());
 track(oscs[0],nodes);[oscs[1],lfo].forEach(o=>{A.voices.add(o);o.onended=()=>A.voices.delete(o);});[...oscs,lfo].forEach(o=>{o.start(t);o.stop(t+len+.01);});}
const beatVoices={
 // Mouth "톡": a short pitched tongue/cheek pop instead of a sustained whistle, so key 2 keeps its notes
 // but reads as rhythm (the whistle made the beat sound like a melody).
 1:(f,t,v)=>{const c=A.ctx,o=c.createOscillator(),bp=c.createBiquadFilter(),g=c.createGain(),len=.085,p=f*2;
  o.type='triangle';o.frequency.setValueAtTime(p*1.35,t);o.frequency.exponentialRampToValueAtTime(p,t+.018);bp.type='bandpass';bp.frequency.value=Math.min(3000,p*1.6);bp.Q.value=1.4;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.075*v,t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+len);o.connect(bp);bp.connect(g);g.connect(beatOut());
  track(o,[o,bp,g]);o.start(t);o.stop(t+len+.02);
  burst(t,{type:'bandpass',freq:Math.min(4000,p*2.2),q:2,peak:.03*v,attack:.001,len:.012});},
 2:(f,t,v,d)=>vowel(f,t,v,d,[[280,4,1],[620,6,.45],[2200,9,.08]],.25,1.25,.24,500),   // vocal bass "붐": lips buzzing an 'oo', dropping into the note
 3:(f,t,v,d)=>vowel(f,t,v,d,[[800,7,1],[1200,8,.7],[2600,10,.25]],.2),    // "밥" chorus syllable
 4:(f,t,v,d)=>vowel(f,t,v,d,[[350,6,1],[700,7,.6],[2400,10,.15]],.2),     // "둡" vocal syllable
 5:(f,t,v,d)=>{const len=Math.max(.14,Math.min(.22,d+.06));burst(t,{freq:700,q:2.5,peak:.5*v,attack:.004,len,to:2600});          // scratch "wika"
  const c=A.ctx,o=c.createOscillator(),bp=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';o.frequency.setValueAtTime(f*2,t);o.frequency.exponentialRampToValueAtTime(f*.6,t+len);bp.type='bandpass';bp.frequency.value=1400;bp.Q.value=2;env(g,t,.22*v,.004,len);o.connect(bp);bp.connect(g);g.connect(beatOut());track(o,[o,bp,g]);o.start(t);o.stop(t+len+.02);}
};

// Percussion (',' '.', and the extra hat/snare groups): shaker and soft bass drum in carol.
const percussion=A.percussion;
A.percussion=function(e,at){if(!synthTheme()||!this.ctx)return percussion.call(this,e,at);const v=Math.max(.4,e.gain/.12);
 if(beatbox()){if(e.voice==='kick')return vocalKick(at,1);if(e.voice==='hat')return vocalHat(at,Math.min(1.3,e.gain/.07));return vocalSnare(at,Math.min(1.3,v));}
 if(e.voice==='kick')return softDrum(at,1);if(e.voice==='hat')return shaker(at,Math.min(1.3,e.gain/.07));return sleigh(at,Math.min(1.3,v),false);};
// Synthesized themes need no recordings, so skip decoding samples.
const prepare=A.prepare;
A.prepare=async function(notes){if(!synthTheme())return prepare.call(this,notes);await this.ready();return 0;};
const note=A.note;
A.note=function(n,at,bpm=130,elapsed=0){
 if(!synthTheme()||n.percussion||!this.ctx)return note.call(this,n,at,bpm,elapsed);
 const group=Number(n.icon.split('-')[0]);if(group>5)return note.call(this,n,at,bpm,elapsed);
 const base=at??this.ctx.currentTime+.01,v=n.accent?1.15:1;
 if(group===0){if(elapsed>=.02)return;const kind=n.voice||n.icon;
  if(beatbox()){if(kind.startsWith('7-'))vocalCh(base,v);else if(kind.startsWith('8-'))vocalSnare(base,v);else vocalKick(base,v);return;}
  if(kind.startsWith('7-'))triangleTap(base,v);else sleigh(base,v,kind.startsWith('8-'));return;}
 const table=beatbox()?beatVoices:voices;
 for(const {event,at:eventAt,duration} of this.shortEvents(n,bpm)){
  const offset=Math.max(0,elapsed-eventAt);if(offset>=duration||offset>.03)continue;
  table[group](hz(this.target(n,event)),base+Math.max(0,eventAt-elapsed),v,duration);
 }
};
const svg=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
// Carol icons (final pick 2026-11-20): 1 santa hat (white trim kept), 2 star, 3 tree, 4 snowflake, 5 gift, 6 handbell.
// Root attributes live on an inner <g> so the editor's <symbol> sprites keep stroke/fill.
// Each icon is scaled about its drawn center so its largest side matches the band icons (~17.5 of 26).
// Measured drawn box [w,h,cx,cy] is passed per icon; k = 17.5 / max(w,h).
const I=(c,body,box,sw=1.5)=>{const [w,h,cx,cy]=box,k=17.5/Math.max(w,h);return `<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(13 13) scale(${k.toFixed(3)}) translate(${-cx} ${-cy})"><g fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</g></g></svg>`;};
// Line style (2026-11-20 revision): outlines like the band icons, small filled accents only.
const carolIcons=[
 I('#FF0049','<path d="M6 16.5Q8.5 5.5 19.5 6.8L18 16.5"/><path d="M19.5 6.8l1.4 1.2"/><rect x="4.5" y="16.5" width="16" height="3.6" rx="1.8" stroke="#FFFFFF"/><circle cx="21.6" cy="8.6" r="1.8" fill="#FFFFFF" stroke="#FFFFFF"/>',[20.4,14.9,13.9,13.4]),
 I('#7DDCFF','<path d="M13 3l2.8 6.2 6.7.7-5 4.5 1.4 6.6L13 17.6 7.1 21l1.4-6.6-5-4.5 6.7-.7z"/><path d="M21.5 2.5v3M20 4h3" stroke-width="1"/><circle cx="13" cy="13" r="1.2" fill="#7DDCFF" stroke="none"/>',[20.7,19.7,13.1,11.9]),
 I('#00E051','<path d="M13 3.5l4.5 5.5h-2.4l4.2 5.2h-2.8l4.3 5.3H5.2l4.3-5.3H6.7l4.2-5.2H8.5z"/><path d="M11.8 19.5v3.5h2.4v-3.5"/><circle cx="11" cy="12.5" r="1" fill="#00E051" stroke="none"/><circle cx="15.3" cy="16.4" r="1" fill="#00E051" stroke="none"/><circle cx="12.2" cy="17.4" r=".9" fill="#00E051" stroke="none"/>',[16.9,21,13,13.2]),
 I('#FF9708',[0,60,120].map(a=>`<path d="M13 3v20" transform="rotate(${a} 13 13)"/><path d="M10.7 5.4l2.3 2.3 2.3-2.3M10.7 20.6l2.3-2.3 2.3 2.3" transform="rotate(${a} 13 13)" stroke-width="1.2"/>`).join(''),[18.7,21.5,13,13]),
 I('#FFE700','<rect x="5" y="11" width="16" height="11" rx="1"/><rect x="4" y="7.6" width="18" height="3.4" rx=".8"/><path d="M13 7.6V22"/><path d="M13 7.6Q8.5 2.4 7.8 5.6Q8.2 7.4 13 7.6Q17.5 2.4 18.2 5.6Q17.8 7.4 13 7.6"/><circle cx="13" cy="7.6" r="1.1" fill="#FFE700" stroke="none"/>',[19.5,19.1,13,13.2]),
 I('#B58AFF','<path d="M13 3v4"/><rect x="11.2" y="1.8" width="3.6" height="2.4" rx="1"/><path d="M7.3 18Q7.3 9.2 13 7.6Q18.7 9.2 18.7 18Z"/><path d="M5.8 18.3h14.4"/><circle cx="13" cy="21" r="1.7" fill="#B58AFF" stroke="none"/><path d="M10 15Q10.3 11.5 12.2 10.2" stroke-width="1"/>',[15.9,21.6,13,11.8])
];
// Beatbox icons (user pick per key, 2026-11-20): 1 boombox, 2 headphones, 3 speaker, 4 speech bubble, 5 mic, 6 record.
// Thinner lines (1.05 instead of 1.5) because several have inner details, with some light/solid fills; same size rule.
const beatIcons=[
 I('#FF0049','<path d="M8 7V4.5h10V7"/><rect x="2.5" y="7" width="21" height="13" rx="2" fill="#FF004926"/><circle cx="7.5" cy="14" r="3.2" fill="#FF004966"/><circle cx="18.5" cy="14" r="3.2" fill="#FF004966"/><circle cx="7.5" cy="14" r="1" fill="#FF0049" stroke="none"/><circle cx="18.5" cy="14" r="1" fill="#FF0049" stroke="none"/><path d="M11.5 10.5h3"/>',[22.5,17,13,12.2],1.05),
 I('#7DDCFF','<path d="M4.5 16v-3a8.5 8.5 0 0 1 17 0v3"/><rect x="2.5" y="14.5" width="5" height="8" rx="2" fill="#7DDCFF"/><rect x="18.5" y="14.5" width="5" height="8" rx="2" fill="#7DDCFF"/>',[22.5,19.5,13,13.5],1.05),
 I('#00E051','<rect x="6" y="3" width="14" height="20" rx="2" fill="#00E05126"/><circle cx="13" cy="15.5" r="4.5" fill="#00E05166"/><circle cx="13" cy="15.5" r="1.4" fill="#00E051" stroke="none"/><circle cx="13" cy="7.3" r="1.8" fill="#00E051"/>',[15.5,21.5,13,13],1.05),
 I('#FF9708','<path d="M4 6.5Q4 4 6.5 4h13Q22 4 22 6.5v8.5Q22 17.5 19.5 17.5H11l-5 4.5v-4.5Q4 17.5 4 15z" fill="#FF970833"/><path d="M8 11q1.5-2.5 3 0t3 0 3 0"/>',[19.5,19.4,13,12.9],1.05),
 I('#FFE700','<circle cx="13" cy="7.5" r="5" fill="#FFE70055"/><path d="M8.5 6.3h9M8.5 8.7h9" stroke-width=".75"/><path d="M11 12.5l1 10h2l1-10z" fill="#FFE700"/><circle cx="13" cy="7.5" r="1" fill="#FFE700" stroke="none"/>',[11.5,21.5,13,12.5],1.05),
 I('#B58AFF','<circle cx="12" cy="14" r="8.5" fill="#B58AFF33"/><circle cx="12" cy="14" r="5" stroke-width=".75"/><circle cx="12" cy="14" r="1.8" fill="#B58AFF" stroke="none"/><path d="M22 2.5V10l-5.5 4"/>',[20,21.5,12.7,12.5],1.05)
];
window.JamThemes={current:theme,icons:{carol:carolIcons,beatbox:beatIcons},names:{carol:['썰매방울','글로켄슈필','튜바','첼레스타','오르골','핸드벨'],beatbox:['보컬 드럼','입 톡','입 베이스','코러스','보컬','스크래치']},list:[
 ['band','밴드',svg('<path d="M15 3l6 6-2 2-6-6z"/><path d="M14 9l-4.2 4.2"/><path d="M9.8 13.2a3.6 3.6 0 1 0 1 1"/><circle cx="8" cy="16" r="1"/>')],
 ['carol','캐롤',svg('<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20.5a2 2 0 0 0 4 0"/><path d="M12 2v1.5"/>')],
 ['beatbox','비트박스',svg('<rect x="8.5" y="2.5" width="7" height="11" rx="3.5"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21M9 21h6"/>')]
]};
})();
