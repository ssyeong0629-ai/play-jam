'use strict';
(()=>{
const defs=[['Hi-hat','0-2','#B58AFF','hat'],['Rim','0-3','#7DDCFF','rim'],['Soft snare','0-1','#FF8FB1','snare'],['Acoustic tap','3-1','#FFBE78','3-6'],['Synth pluck','1-2','#8CDACF','1-6'],['Short bass','2-2','#B7D97A','2-6']];
for(const [id,source,gate,filter,trim] of [['3-6','3-0',.12,1800,.7],['1-6','1-0',.22,2400,.8],['2-6','2-0',.18,650,.85]]){const e=structuredClone(JAM_AUDIO_BANK[source]);e.filter=filter;e.drive=0;e.events=e.events.slice(0,1).map(n=>({...n,beat:0,gate,gain:(n.gain??.65)*trim,attack:.005,bend:0}));JAM_AUDIO_BANK[id]=e;}
for(let i=0;i<defs.length;i++){const [name,source,color,sound]=defs[i],original=JAM_ICONS.find(n=>n.id===source);for(let slot=0;slot<6;slot++){const id=(i+6)+'-'+slot;JAM_ICONS.push({...original,id,group:i+6,slot,name,color,svg:original.svg.replace(/#[0-9a-f]{6}/gi,color)});JAM_AUDIO_BANK[id]={...JAM_AUDIO_BANK[sound.includes('-')?sound:'0-0'],name};}}
window.JamVoicePools=[['0-0','7-0','8-0'],['1-0','10-0'],['2-0','11-0'],['3-0','9-0'],['4-0'],['5-0']];
const voiced=n=>n.voice?{...n,icon:n.voice,voice:undefined}:n;
const A=JamAudio,group=n=>Number(n.icon.split('-')[0]),map=n=>{n=voiced(n);const d=defs[group(n)-6];return d?{...n,icon:d[3].includes('-')?d[3]:'0-0'}:n};
const prepare=A.prepare;A.prepare=function(notes){return prepare.call(this,notes.map(map))};
for(const method of ['target','resolve','pitch','eventDuration','shortEvents']){const original=A[method];A[method]=function(n,...args){return original.call(this,map(n),...args)}}
const duration=A.duration;A.duration=function(n,bpm){if(n.percussion)return duration.call(this,n,bpm);n=voiced(n);const g=group(n);return g===6?.045:g===7?.065:g===8?.12:duration.call(this,map(n),bpm)};
function rim(at){const c=A.ctx,g=c.createGain();g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.15,at+.001);g.gain.exponentialRampToValueAtTime(.0001,at+.055);g.connect(A.master);let count=0;for(const hz of [780,1240]){const n=c.createOscillator();n.type='sine';n.frequency.value=hz;n.connect(g);A.voices.add(n);n.onended=()=>{A.voices.delete(n);n.disconnect();if(++count===2)g.disconnect()};n.start(at);n.stop(at+.065)}}
const note=A.note;A.note=function(n,at,bpm=130,elapsed=0){if(n.percussion)return note.call(this,n,at,bpm,elapsed);n=voiced(n);const g=group(n);if(g>=6&&g<=8){if(!this.ctx||elapsed>=.02)return;const t=at??this.ctx.currentTime+.01;if(g===7)rim(t);else this.percussion({voice:g===6?'hat':'snare',gain:(g===6?.07:.12)*(n.accent?1.12:1)},t);return;}return note.call(this,map(n),at,bpm,elapsed)};
})();
