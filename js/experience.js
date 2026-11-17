'use strict';
(()=>{
const canvas=document.createElement('canvas');canvas.id='micro-fireworks';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');let particles=[],raf=0,last=0;
function resize(){const d=Math.min(devicePixelRatio||1,2);canvas.width=innerWidth*d;canvas.height=innerHeight*d;ctx.setTransform(d,0,0,d,0,0);}resize();addEventListener('resize',resize);
const profiles=[
 {count:1,speed:1.25,life:.55,gravity:10,drag:3.8,shape:'dot'},
 {count:1,speed:.8,life:1.15,gravity:0,drag:1.5,shape:'dot'},
 {count:.55,speed:.6,life:.75,gravity:3,drag:3.1,shape:'dot'},
 {count:1.1,speed:1.1,life:1.2,gravity:24,drag:1.7,shape:'streak'},
 {count:.75,speed:1.15,life:1.1,gravity:5,drag:1.8,shape:'streak'},
 {count:1.15,speed:1.35,life:.7,gravity:16,drag:2.6,shape:'streak'}];
function burst(el){if(reduced.matches)return;const b=el.getBoundingClientRect(),v=document.querySelector('#viewport').getBoundingClientRect();if(b.bottom<v.top||b.top>v.bottom)return;
 const color=getComputedStyle(el).getPropertyValue('--color').trim()||'#fff',now=performance.now(),group=Number(el.dataset.instrument||0),profile=profiles[[0,1,2,3,4,5,0,0,0,3,1,2][group]??0],intensity=Jam.state.density/100,accent=Jam.state.notes.find(n=>n.id===el.dataset.note)?.accent?1.25:1;
 for(let i=0;i<Math.round((14+intensity*50)*profile.count*accent);i++){
 let angle=Math.random()*Math.PI*2;if(group===3)angle=-Math.PI*.9+Math.random()*Math.PI*.8;if(group===4)angle=Math.floor(Math.random()*5)*Math.PI*2/5+(Math.random()-.5)*.2;
 const speed=(15+Math.random()*48)*(.7+intensity)*profile.speed;
 particles.push({...profile,x:b.left+b.width/2,y:b.top+b.height/2,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed*(group===2?.25:1),born:now+Math.random()*(group===0?25:85),life:(450+Math.random()*(450+intensity*650))*profile.life,size:.3+Math.random()*(.6+intensity*.5),phase:Math.random()*9,color});
 }
 particles=particles.slice(-850);if(!raf){last=now;raf=requestAnimationFrame(draw);}}
const sprites=new Map();
function sprite(color){if(sprites.has(color))return sprites.get(color);const c=document.createElement('canvas');c.width=c.height=24;const x=c.getContext('2d'),g=x.createRadialGradient(12,12,0,12,12,12);g.addColorStop(0,'#ffffff');g.addColorStop(.12,color);g.addColorStop(.3,color+'80');g.addColorStop(1,color+'00');x.fillStyle=g;x.fillRect(0,0,24,24);sprites.set(color,c);return c;}
function draw(now){const dt=Math.min((now-last)/1000,.035);last=now;ctx.clearRect(0,0,innerWidth,innerHeight);const b=document.querySelector('#viewport').getBoundingClientRect();ctx.save();ctx.beginPath();ctx.rect(b.left,b.top,b.width,b.height);ctx.clip();const paper=Jam.state.theme==='light',retro=Jam.state.theme==='retro';ctx.globalCompositeOperation=paper?'source-over':'lighter';
 particles=particles.filter(p=>now-p.born<p.life);
 for(const p of particles){const age=now-p.born;if(age<0)continue;const t=age/p.life;p.vx*=Math.exp(-p.drag*dt);p.vy=p.vy*Math.exp(-p.drag*dt)+p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;ctx.globalAlpha=Math.sin(Math.min(1,t*5)*Math.PI/2)*Math.pow(1-t,1.6)*(.45+.55*Math.pow(Math.sin(age*.021+p.phase),2));const size=p.size*(1-t*.65);
 if(paper||retro){ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,Math.max(1,size*1.7),Math.max(1,size*1.7));}
 else{const radius=3+size*3;ctx.drawImage(sprite(p.color),p.x-radius,p.y-radius,radius*2,radius*2);if(p.shape==='streak'&&t<.55){ctx.strokeStyle=p.color;ctx.lineWidth=size;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.04,p.y-p.vy*.04);ctx.stroke();}}
 }
 ctx.restore();raf=particles.length?requestAnimationFrame(draw):0;}
const fired=new WeakSet();new MutationObserver(records=>{for(const r of records){const el=r.target;if(!el.matches?.('.note'))continue;const active=el.classList.contains('hit')||el.classList.contains('landing');if(active&&!fired.has(el)){fired.add(el);burst(el);}else if(!active)fired.delete(el);}}).observe(document.querySelector('#pages'),{subtree:true,attributes:true,attributeFilter:['class']});
const guide=document.createElement('div');guide.id='typing-guide';guide.setAttribute('aria-hidden','true');guide.innerHTML='<kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><kbd>F</kbd>';document.querySelector('.workspace').append(guide);let began=false,finished=false;
 document.querySelector('#start').addEventListener('click',()=>{began=true;});
 setInterval(()=>{if(Jam.state.notes.length)finished=true;guide.hidden=!began||finished||!!document.querySelector('dialog[open]')||document.body.classList.contains('shared-view');},160);
 guide.hidden=true;
})();
