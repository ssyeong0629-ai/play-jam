'use strict';
/* Based on the original PLAY-JAM.html synthesis engine. No remote samples. */
class JamAudio {
 constructor(){this.ctx=null;this.master=null;this.voices=new Set();}
 async ready(){if(!this.ctx){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Audio is not supported in this browser.');this.ctx=new Audio();const comp=this.ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=5;this.master=this.ctx.createGain();this.master.gain.value=.5;this.master.connect(comp);comp.connect(this.ctx.destination);}if(this.ctx.state!=='running')await this.ctx.resume();}
 envelope(time,duration,volume){const g=this.ctx.createGain();g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(Math.max(.001,volume),time+.008);g.gain.exponentialRampToValueAtTime(.0001,time+duration);g.connect(this.voiceBus||this.master);setTimeout(()=>g.disconnect(),(Math.max(0,time-this.ctx.currentTime)+duration+.2)*1000);return g;}
 track(node,time,duration){this.voices.add(node);node.onended=()=>{this.voices.delete(node);node.disconnect();};node.start(time);node.stop(time+duration);}
 osc(freq,type,time,duration,vol=.16){const o=this.ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(freq,time);o.connect(this.envelope(time,duration,vol));this.track(o,time,duration);return o;}
 noise(time,duration,volume=.13,highpass=0){const b=this.ctx.createBuffer(1,Math.ceil(this.ctx.sampleRate*duration),this.ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const source=this.ctx.createBufferSource();source.buffer=b;const f=this.ctx.createBiquadFilter();f.type=highpass?'highpass':'lowpass';f.frequency.value=highpass||6000;source.connect(f);f.connect(this.envelope(time,duration,volume));this.track(source,time,duration);}
 pluck(freq,time,bright=0.98,vol=.22){const rate=this.ctx.sampleRate,duration=1.35,length=Math.ceil(rate*duration),period=Math.max(2,Math.round(rate/freq)),ring=new Float32Array(period),buffer=this.ctx.createBuffer(1,length,rate),d=buffer.getChannelData(0);for(let i=0;i<period;i++)ring[i]=Math.random()*2-1;for(let i=0;i<length;i++){const k=i%period;d[i]=ring[k];ring[k]=(ring[k]+ring[(k+1)%period])*.5*bright;}const source=this.ctx.createBufferSource();source.buffer=buffer;source.connect(this.envelope(time,duration,vol));this.track(source,time,duration);}
 kick(time){const o=this.osc(140,'sine',time,.38,.4);o.frequency.exponentialRampToValueAtTime(38,time+.24);}
 snare(time){this.noise(time,.2,.19,1400);this.osc(180,'triangle',time,.12,.1);}
 sound(g,y,at){if(!this.ctx)return;const t=at??this.ctx.currentTime+.008;const scale=[0,2,4,7,9,12,14,16,19],midi=48+scale[8-y],freq=440*2**((midi-69)/12);
  if([0,5,10,15].includes(g)){this.pluck(freq*(g===10?2:1),t,g===0?.991:.983,.24);if(g===5)this.pluck(freq*1.5,t+.025,.98,.1);}
  else if([1,2,7].includes(g)){this.pluck(freq*.5,t,.993,.24);this.osc(freq*.5,'sine',t,.55,.16);}
  else if([3,12].includes(g)){[1,2,3].forEach((v,i)=>this.osc(freq*v,'sine',t,.75-i*.12,.19/(v*v)));}
  else if(g===4){this.osc(freq,'triangle',t,.5,.13);this.osc(freq*1.004,'sawtooth',t,.4,.045);}
  else if([6,13,19].includes(g)){this.osc(freq*2,'sine',t,1.1,.18);this.osc(freq*4.02,'sine',t,.65,.055);if(g===19)this.osc(freq*3,'sine',t+.12,.85,.1);}
  else if(g===8){this.osc(freq,'square',t,.22,.075);this.osc(freq/2,'sine',t,.3,.12);}
  else if(g===9){this.pluck(freq,t,.994,.2);this.osc(freq,'sawtooth',t,.3,.06);}
  else if(g===11){this.kick(t);this.snare(t+.15);this.noise(t+.3,.1,.07,7000);}
  else if(g===14){this.osc(freq,'sawtooth',t,.38,.065);this.osc(freq*1.006,'triangle',t,.4,.09);}
  else if(g===16)this.noise(t,.7,.11,7000);
  else if(g===17){this.kick(t);this.snare(t+.3);}
  else if(g===18)this.snare(t);
 }
 stop(){for(const v of this.voices){try{v.stop();}catch{}}this.voices.clear();}
}

window.JamSound = new JamAudio();
const voiceMap=[0,1,2,3,4,5,6,7,8,10,10,11,12,13,14,15,16,17,18,19,13,13,13,13,13,13,8,8,9,8,14,19,19,19,19,19];
JamSound.note = function(note, when, preview=false) {
 if(!this.ctx) return;
 const t=when??this.ctx.currentTime+.01;
 const bus=this.ctx.createGain(), drive=this.ctx.createWaveShaper();
 const fx=note.effects||[];
 const strength=Math.min(1,Math.abs(note.angle||0)/180)+(fx.includes(27)?.3:0);
 const curve=new Float32Array(1024), k=1+strength*35;
 for(let i=0;i<1024;i++){const x=i*2/1023-1;curve[i]=Math.tanh(k*x)/Math.tanh(k);}
 drive.curve=curve;drive.oversample='2x';
 bus.gain.value=Math.min(1.3,Math.max(.12,(note.scale||1)*.62))*(fx.includes(28)||fx.includes(29)?1.2:1);
 bus.connect(drive);drive.connect(this.master);
 if(fx.includes(31)){const delay=this.ctx.createDelay();delay.delayTime.value=.19;const wet=this.ctx.createGain();wet.gain.value=.25;drive.connect(delay);delay.connect(wet);wet.connect(this.master);setTimeout(()=>{delay.disconnect();wet.disconnect();},2500);}
 this.voiceBus=bus;
 this.sound(voiceMap[note.icon-1]??0,note.y??4,t);
 if(fx.includes(30)&&!preview)this.sound(voiceMap[note.icon-1]??0,note.y??4,t+.18);
 this.voiceBus=null;
 if(preview){bus.gain.setValueAtTime(bus.gain.value,t+.4);bus.gain.exponentialRampToValueAtTime(.0001,t+.5);}
 setTimeout(()=>{bus.disconnect();drive.disconnect();},preview?700:2600);
};
JamSound.preview=async function(icon){await this.ready();this.note({icon,y:4,scale:.8,angle:0,effects:[]},undefined,true);};
