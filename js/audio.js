'use strict';
// All voices use bundled recordings. Choose the closest recorded pitch, never a random timbre.
window.JamAudio={
 ctx:null,voices:new Set(),buffers:new Map(),loading:new Map(),
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
 target(n,e){const scale=[0,2,4,7,9,12,14,16,19,21,24,26,28],group=Number(n.icon.split('-')[0]);return (group===2?28:group===1?48:40)+scale[12-n.y]+(e.semitones||0);},
 resolve(n,e){if(!e.samples?.length)return e;const target=this.target(n,e),sample=e.samples.reduce((a,b)=>Math.abs(JAM_AUDIO_SAMPLES[b].rootMidi-target)<Math.abs(JAM_AUDIO_SAMPLES[a].rootMidi-target)?b:a);return {...e,sample};},
 async prepare(notes){
  await this.ready();const required=new Set();
  for(const n of notes){const entry=JAM_AUDIO_BANK[n.icon];if(!entry)throw Error('Missing recording: '+n.icon);for(const e of entry.events)required.add(this.resolve(n,e).sample);}
  await Promise.all([...required].map(async id=>{
   if(this.buffers.has(id))return;
   if(!this.loading.has(id)){const sample=JAM_AUDIO_SAMPLES[id];if(!sample)throw Error('Missing sample: '+id);const bytes=Uint8Array.from(atob(sample.data.split(',')[1]),c=>c.charCodeAt(0));this.loading.set(id,this.ctx.decodeAudioData(bytes.buffer).then(b=>{this.buffers.set(id,b);return b;}).catch(error=>{this.loading.delete(id);throw error;}));}
   await this.loading.get(id);
  }));return 0;
 },
 pitch(n,e){e=this.resolve(n,e);return JAM_AUDIO_BANK[n.icon].drums?2**((e.semitones||0)/12):2**((this.target(n,e)-JAM_AUDIO_SAMPLES[e.sample].rootMidi)/12);},
 eventDuration(n,e,bpm){e=this.resolve(n,e);const available=JAM_AUDIO_SAMPLES[e.sample].duration/(this.pitch(n,e)*Math.max(1,2**((e.bend||0)/12)));return Math.max(.015,Math.min(available,e.gate===undefined?available:e.gate*60/bpm));},
 duration(n,bpm){return Math.max(0,...JAM_AUDIO_BANK[n.icon].events.map(e=>e.beat*60/bpm+this.eventDuration(n,e,bpm)));},
 note(n,at,bpm=100,elapsed=0){
  const entry=JAM_AUDIO_BANK[n.icon];if(!entry||!this.ctx)return;const base=at??this.ctx.currentTime+.01;
  for(const original of entry.events){
   const e=this.resolve(n,original),duration=this.eventDuration(n,e,bpm),offset=Math.max(0,elapsed-e.beat*60/bpm);if(offset>=duration)continue;
   const buffer=this.buffers.get(e.sample);if(!buffer)throw Error('음원이 준비되지 않았어요. PLAY를 다시 눌러 주세요.');
   const t=base+Math.max(0,e.beat*60/bpm-elapsed),remaining=duration-offset,node=this.ctx.createBufferSource(),gain=this.ctx.createGain(),rate=this.pitch(n,e),nodes=[node,gain],bendRate=2**((e.bend||0)/12),ramp=duration*.8,progress=Math.min(offset/ramp,1);
   node.buffer=buffer;node.playbackRate.setValueAtTime(rate*(1+(bendRate-1)*progress),t);
   if(e.bend&&offset<ramp)node.playbackRate.linearRampToValueAtTime(rate*bendRate,t+ramp-offset);

   const amp=(e.gain??.65)/Math.sqrt(Math.max(1,this.voices.size/12)),attack=Math.min(e.attack||.006,remaining*.25),release=Math.min(.045,remaining*.5);
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
