'use strict';
// All voices use bundled recordings. Choose the closest recorded pitch, never a random timbre.
window.JamAudio={
 compareMode:'B',ctx:null,voices:new Set(),buffers:new Map(),loading:new Map(),levels:new Map(),
 async ready(){
  // Request a media-playback session where the browser supports it.
  try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{}
  if(!this.ctx||this.ctx.state==='closed'){
   this.buffers.clear();this.loading.clear();this.voices.clear();
   this.ctx=new(window.AudioContext||window.webkitAudioContext)();
   this.compressor=this.ctx.createDynamicsCompressor();
   this.compressor.threshold.value=-22;this.compressor.knee.value=18;
   this.compressor.ratio.value=8;this.compressor.attack.value=.005;this.compressor.release.value=.12;
   this.master=this.ctx.createGain();this.master.gain.value=.64;
   this.output=this.ctx.createAnalyser();this.output.fftSize=2048;
   this.master.connect(this.compressor);this.compressor.connect(this.output);this.output.connect(this.ctx.destination);
  }
  if(this.ctx.state!=='running'){
   let timer;
   try{await Promise.race([this.ctx.resume(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('소리 시작이 차단됐어요. PLAY를 다시 눌러 주세요.')),4000);})]);}
   finally{clearTimeout(timer);}
  }
  if(this.ctx.state!=='running')throw Error('오디오가 중단됐어요. PLAY를 다시 눌러 주세요.');
 },
 target(n,e){
  if(window.Jam?.state.pitchMode==='fixed'){const steps=[0,2,4,5,7,9,11,12,14,16,17,19,21];return (Number(n.icon.split('-')[0])===2?36:48)+steps[12-Math.max(0,Math.min(12,Math.round(n.keyY??n.y)))];}

  const scale=[0,2,4,7,9,12,14,16,19,21,24,26,28],group=Number(n.icon.split('-')[0]);
  const step=Math.round((12-n.y)*8/12),base=group===2?36:48,raw=base+scale[step]+(e.semitones||0);
  // Shared C-major pentatonic pitch classes; retain per-voice timbre and phrasing.
  const allowed=[0,2,4,7,9];let best=raw,distance=Infinity;
  for(let pitch=Math.floor(raw)-6;pitch<=Math.ceil(raw)+6;pitch++)if(allowed.includes((pitch%12+12)%12)&&Math.abs(pitch-raw)<distance){best=pitch;distance=Math.abs(pitch-raw);}
  if(this.compareMode==='B'&&group!==0){
   const bar=Math.floor((n.row*8+n.x*8)/4)%4,chords=window.Jam?.state.harmony?.chords||[[0,4,7],[9,0,4],[5,9,0],[7,11,2]],roots=window.Jam?.state.harmony?.roots||[36,33,41,31];
   if(group===2)return roots[bar];
   const ranges={1:[55,76],3:[48,64],4:[52,69],5:[43,60]},range=ranges[group]||[48,72],center=Math.max(range[0],Math.min(range[1],best));
   let chosen=center,dist=Infinity;for(let pitch=range[0];pitch<=range[1];pitch++)if(chords[bar].includes(pitch%12)&&Math.abs(pitch-center)<dist){dist=Math.abs(pitch-center);chosen=pitch;}return chosen;
  }
  return best;
 },
 resolve(n,e){if(!e.samples?.length)return e;const target=this.target(n,e),sample=e.samples.reduce((a,b)=>Math.abs(JAM_AUDIO_SAMPLES[b].rootMidi-target)<Math.abs(JAM_AUDIO_SAMPLES[a].rootMidi-target)?b:a);return {...e,sample};},
 async prepare(notes){
  await this.ready();const required=new Set();
  for(const n of notes){const entry=JAM_AUDIO_BANK[n.icon];if(!entry)throw Error('Missing recording: '+n.icon);for(const e of entry.events)required.add(this.resolve(n,e).sample);}
  await Promise.all([...required].map(async id=>{
   if(this.buffers.has(id))return;
   if(!this.loading.has(id)){const sample=JAM_AUDIO_SAMPLES[id];if(!sample)throw Error('Missing sample: '+id);const bytes=Uint8Array.from(atob(sample.data.split(',')[1]),c=>c.charCodeAt(0));this.loading.set(id,this.ctx.decodeAudioData(bytes.buffer).then(b=>{this.buffers.set(id,b);let energy=0,peak=0,count=0;for(let c=0;c<b.numberOfChannels;c++){const d=b.getChannelData(c),end=Math.min(d.length,Math.floor(b.sampleRate*.24));for(let i=0;i<end;i++){energy+=d[i]*d[i];peak=Math.max(peak,Math.abs(d[i]));count++;}}const rms=Math.sqrt(energy/Math.max(1,count));this.levels.set(id,Math.max(.4,Math.min(1.6,.14/Math.max(.01,rms),.8/Math.max(.01,peak))));return b;}).catch(error=>{this.loading.delete(id);throw error;}));}
   await this.loading.get(id);
  }));return 0;
 },
 pitch(n,e){e=this.resolve(n,e);return JAM_AUDIO_BANK[n.icon].drums?2**((e.semitones||0)/12):2**((this.target(n,e)-JAM_AUDIO_SAMPLES[e.sample].rootMidi)/12);},
 eventDuration(n,e,bpm){e=this.resolve(n,e);const available=JAM_AUDIO_SAMPLES[e.sample].duration/(this.pitch(n,e)*Math.max(1,2**((e.bend||0)/12)));return Math.max(.015,Math.min(available,e.gate===undefined?available:e.gate*60/bpm));},
 shortEvents(n,bpm){
  const limit=n.accent?.18:.24;
  return JAM_AUDIO_BANK[n.icon].events.map(event=>{
   const at=Math.min(limit-.04,event.beat*.045);
   return {event,at,duration:Math.min(limit-at,this.eventDuration(n,event,bpm))};
  });
 },
 percussion(e,at){const A=JamAudio,c=A.ctx,g=c.createGain(),nodes=[g];let node;
 if(e.voice==='kick'){node=c.createOscillator();node.type='sine';node.frequency.setValueAtTime(125,at);node.frequency.exponentialRampToValueAtTime(46,at+.11);node.connect(g);}
 else{node=c.createBufferSource();if(!this.noise||this.noise.sampleRate!==c.sampleRate){this.noise=c.createBuffer(1,c.sampleRate*.3,c.sampleRate);const d=this.noise.getChannelData(0);let seed=7193;for(let i=0;i<d.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;d[i]=seed/2147483648-1;}}node.buffer=this.noise;const filter=c.createBiquadFilter();filter.type=e.voice==='hat'?'highpass':'bandpass';filter.frequency.value=e.voice==='hat'?7500:1600;filter.Q.value=.7;node.connect(filter);filter.connect(g);nodes.push(filter);}
 const duration=e.voice==='kick'?.19:e.voice==='snare'?.12:.045;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(e.gain,at+.003);g.gain.exponentialRampToValueAtTime(.0001,at+duration);g.connect(A.master);A.voices.add(node);node.onended=()=>{A.voices.delete(node);node.disconnect();nodes.forEach(n=>n.disconnect());};node.start(at);node.stop(at+duration+.01);
 },
 duration(n,bpm){if(n.percussion)return n.percussion==='kick'?.19:.045;return Math.max(0,...this.shortEvents(n,bpm).map(e=>e.at+e.duration));},
 note(n,at,bpm=100,elapsed=0){
  if(n.percussion&&this.ctx){if(elapsed<.02)this.percussion({voice:n.percussion,gain:n.percussion==='kick'?.24:.07},at??this.ctx.currentTime+.01);return;}
  const entry=JAM_AUDIO_BANK[n.icon];if(!entry||!this.ctx)return;const base=at??this.ctx.currentTime+.01;
  for(const {event:original,at:eventAt,duration} of this.shortEvents(n,bpm)){
   const e=this.resolve(n,original),offset=Math.max(0,elapsed-eventAt);if(offset>=duration)continue;
   const buffer=this.buffers.get(e.sample);if(!buffer)throw Error('음원이 준비되지 않았어요. PLAY를 다시 눌러 주세요.');
   const t=base+Math.max(0,eventAt-elapsed),remaining=duration-offset,node=this.ctx.createBufferSource(),gain=this.ctx.createGain(),rate=this.pitch(n,e),nodes=[node,gain],bendRate=2**((e.bend||0)/12),ramp=duration*.8,progress=Math.min(offset/ramp,1);
   const family=Number(n.icon[0]),older=[...this.voices].filter(v=>v.family===family&&v.endsAt>t&&v.startedAt<=t);
   // Shared overlap treatment in A and B, so the comparison isolates harmony.
   const limit=family===2?1:2;
   for(const v of older.slice(0,Math.max(0,older.length-limit+1))){try{if(v.voiceGain.gain.cancelAndHoldAtTime)v.voiceGain.gain.cancelAndHoldAtTime(t);else{v.voiceGain.gain.cancelScheduledValues(t);v.voiceGain.gain.setValueAtTime(v.voiceGain.gain.value,t);}v.voiceGain.gain.linearRampToValueAtTime(0,t+.025);v.stop(t+.03);v.endsAt=t+.03;}catch{}}
   node.family=family;node.voiceGain=gain;node.startedAt=t;node.endsAt=t+remaining;
   node.buffer=buffer;node.playbackRate.setValueAtTime(rate*(1+(bendRate-1)*progress),t);
   if(e.bend&&offset<ramp)node.playbackRate.linearRampToValueAtTime(rate*bendRate,t+ramp-offset);

   const groupTrim=[.85,.72,.8,.82,.78,.6][Number(n.icon.split('-')[0])];
   const amp=(n.accent?1.12:1)*(e.gain??.65)*(this.levels.get(e.sample)||1)*groupTrim/Math.sqrt(Math.max(1,entry.events.length*.6))/Math.sqrt(Math.max(1,this.voices.size/8)),attack=Math.min(e.attack||.006,remaining*.25),release=Math.min(.045,remaining*.5);
   gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(amp,t+attack);gain.gain.setValueAtTime(amp,t+Math.max(attack,remaining-release));gain.gain.linearRampToValueAtTime(0,t+remaining);
   let bus=node;
   if(entry.drive){const drive=this.ctx.createWaveShaper(),curve=new Float32Array(1025);for(let i=0;i<curve.length;i++){const x=i*2/1024-1;curve[i]=Math.tanh(x*entry.drive)*.4;}drive.curve=curve;drive.oversample='2x';bus.connect(drive);bus=drive;nodes.push(drive);}
   if(entry.filter){const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=entry.filter;bus.connect(filter);bus=filter;nodes.push(filter);}
   bus.connect(gain);gain.connect(this.master);this.voices.add(node);node.onended=()=>{this.voices.delete(node);nodes.forEach(n=>n.disconnect());};
   // Integrate the linear playback-rate bend so seeking resumes the correct sample offset.
   const rampElapsed=Math.min(offset,ramp),sampleOffset=rate*(rampElapsed+(bendRate-1)*rampElapsed*rampElapsed/(2*ramp)+Math.max(0,offset-ramp)*bendRate);
   node.start(t,Math.min(buffer.duration-.001,sampleOffset));node.stop(t+remaining);
  }
 },
 stop(){for(const v of this.voices)try{v.stop();}catch{}this.voices.clear();}
};
