'use strict';
// Winter easter eggs (초안10). Typing a winter word (any sound theme) shows a short full-screen 3D sparkle picture
// that turns once (made of dots with depth, like a light sculpture). Korean words are matched by their 2-set key order
// (Shift doubles like ㅃ use the same key), plus English. 9 words:
//   크리스마스 (wreath, bow, swinging bells, Merry Christmas)  트리  눈사람  산타 (in a sleigh)  루돌프 (sitting baby reindeer)
//   붕어빵 (two fish breads in a paper bag, steam)  선물 (lid pops, stars)  눈송이 (crystal bursts into tiny flakes)
//   스노우볼 (snowy village inside, swirling snow)
// While a picture plays, the background snow sparkles a little more (body.egg-fx → js/staff-sparkles.js).
// Found words: personal collection (n/9) chip + panel; stored with the score (s.eggs) → replay during playback,
// travel inside share links, and can be printed as stickers on the PNG.
(()=>{
const EGGS=[
 {id:'christmas',name:'크리스마스',keys:['ZMFLTMAKTM','CHRISTMAS']},
 {id:'tree',name:'트리',keys:['XMFL','TREE']},
 {id:'snowman',name:'눈사람',keys:['SNSTKFKA','SNOWMAN']},
 {id:'santa',name:'산타',keys:['TKSXK','SANTA']},
 {id:'rudolph',name:'루돌프',keys:['FNEHFVM','RUDOLPH']},
 {id:'bungeoppang',name:'붕어빵',keys:['QNDDJQKD']},
 {id:'gift',name:'선물',keys:['TJSANF','GIFT']},
 {id:'snowflake',name:'눈송이',keys:['SNSTHDDL','SNOWFLAKE']},
 {id:'snowglobe',name:'스노우볼',keys:['TMSHDNQHF','SNOWGLOBE']}
];
const COL_KEY='mobile12.playjam.eggs.found',STICKER_KEY='mobile12.playjam.eggs.sticker';
const $=id=>document.getElementById(id);
const get=k=>{try{return localStorage.getItem(k);}catch{return null;}},put=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
const known=id=>EGGS.some(e=>e.id===id),nameOf=id=>EGGS.find(e=>e.id===id)?.name||'';
const collection=()=>{try{const a=JSON.parse(get(COL_KEY)||'[]');return Array.isArray(a)?a.filter(known):[];}catch{return [];}};
const stickerOn=()=>get(STICKER_KEY)!=='0';
const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const scoreEggs=s=>{s=s||window.Jam?.state;return Array.isArray(s?.eggs)?EGGS.map(e=>e.id).filter(id=>s.eggs.includes(id)):[];};
const esc=v=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let busy=false;

// ---------- typing ----------
let typed='',lastAt=0;
// Window capture runs before the app's own key handlers, which stop the event for mapped keys.
addEventListener('keydown',e=>{
 if(e.metaKey||e.ctrlKey||e.altKey||e.repeat)return;
 if(e.target.closest?.('input,textarea,select,[contenteditable],dialog')||document.querySelector('dialog[open]'))return;
 const m=/^Key([A-Z])$/.exec(e.code||'');if(!m)return;
 const now=performance.now();if(now-lastAt>2500)typed='';lastAt=now;
 typed=(typed+m[1]).slice(-16);
 const egg=EGGS.find(g=>g.keys.some(k=>typed.endsWith(k)));
 if(egg){typed='';discover(egg);}
},true);

// ---------- shape helpers (unit coordinates: the picture is about 1 tall, centered on 0,0) ----------
const P=(pts,x,y,color,r=1.8,extra)=>pts.push({x,y,color,r,...extra});
function seg(pts,x1,y1,x2,y2,n,color,r){for(let k=0;k<=n;k++){const u=k/n;P(pts,x1+(x2-x1)*u,y1+(y2-y1)*u,color,r);}}
function quad(pts,x0,y0,qx,qy,x1,y1,n,color,r){for(let k=0;k<=n;k++){const u=k/n,a=(1-u)**2,b=2*u*(1-u),c=u*u;P(pts,a*x0+b*qx+c*x1,a*y0+b*qy+c*y1,color,r);}}
function ell(pts,cx,cy,rx,ry,n,color,r,a0=0,a1=Math.PI*2){const full=a1-a0>=Math.PI*2-1e-6;for(let k=0;k<(full?n:n+1);k++){const a=a0+(a1-a0)*k/n;P(pts,cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,color,r);}}
function fillEll(pts,cx,cy,rx,ry,step,color,r){for(let y=-ry;y<=ry+1e-9;y+=step)for(let x=-rx;x<=rx+1e-9;x+=step)if((x/rx)**2+(y/ry)**2<=1)P(pts,cx+x,cy+y,color,r);}
function rect(pts,x1,y1,x2,y2,n,color,r){const m=Math.max(2,Math.round(n*Math.abs(y2-y1)/Math.abs(x2-x1)));seg(pts,x1,y1,x2,y1,n,color,r);seg(pts,x2,y1,x2,y2,m,color,r);seg(pts,x2,y2,x1,y2,n,color,r);seg(pts,x1,y2,x1,y1,m,color,r);}
const mirror=(pts,from)=>{const add=pts.slice(from).map(p=>({...p,x:-p.x}));pts.push(...add);};
// Move / rotate / scale a group of points (used to tilt the fish breads).
const place=(src,ox,oy,rot=0,s=1)=>src.map(p=>({...p,x:ox+(p.x*Math.cos(rot)-p.y*Math.sin(rot))*s,y:oy+(p.x*Math.sin(rot)+p.y*Math.cos(rot))*s}));
// Text → points, sampled once on a 600px reference canvas.
const textCache=new Map(),SCRIPT='"Snell Roundhand","Apple Chancery","Brush Script MT","Segoe Script",cursive';
function textPts(str,cy,size,colors,delay,font=SCRIPT,weight=''){const key=str+size+font;if(!textCache.has(key)){const R=600,c=document.createElement('canvas');c.width=R;c.height=Math.ceil(R*size*2);const g=c.getContext('2d');g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.font=`${weight} ${Math.round(R*size)}px ${font}`;g.fillText(str,R/2,c.height/2);const d=g.getImageData(0,0,c.width,c.height).data,out=[];for(let y=0;y<c.height;y+=3)for(let x=0;x<R;x+=3)if(d[(y*R+x)*4+3]>140)out.push([x/R-.5,(y-c.height/2)/R]);textCache.set(key,out);}
 return textCache.get(key).map(([x,y],i)=>({x,y:y+cy,color:colors[i%7===0?1:0]||colors[0],r:1.25,d:delay+(x+.5)*700}));}

const RED='#FF0049',GOLD='#FFE700',GREEN='#00E051',WHITE='#ffffff',SKIN='#FFC9A8',PINK='#FF8FB1',ORANGE='#FF9708',ICE='#7DDCFF',BROWN='#D9925A';
const SHAPES={
 christmas(small){const pts=[],cy=small?0:-.04,R=small?.38:.42,G=[GREEN,'#36D97A','#8BEA9E'];
  for(const [dr,n] of [[-.05,62],[0,76],[.05,90]])for(let k=0;k<n;k++){const a=k/n*Math.PI*2+Math.random()*.05,rr=R+dr+(Math.random()-.5)*.016;P(pts,Math.cos(a)*rr,cy+Math.sin(a)*rr,G[k%3],1.9);}
  for(let k=0;k<20;k++){const a=k/20*Math.PI*2+Math.random()*.25,rr=R+(Math.random()-.5)*.08;P(pts,Math.cos(a)*rr,cy+Math.sin(a)*rr,k%4?RED:GOLD,2.8);}
  const by=cy+R+.01;ell(pts,-.075,by,.07,.04,18,RED,2);ell(pts,.075,by,.07,.04,18,RED,2);P(pts,0,by,RED,3);seg(pts,-.01,by,-.07,by+.12,8,RED,2);seg(pts,.01,by,.07,by+.12,8,RED,2);
  if(!small)pts.push(...textPts('Merry',cy-.085,.15,[WHITE,GOLD],450),...textPts('Christmas',cy+.085,.15,[WHITE,GOLD],800));
  return pts;},
 tree(){const pts=[];
  // three soft, rounded tiers (curved sides, scalloped hems), a short trunk, garlands, ornaments and a star
  for(const [y0,y1,hw] of [[-.42,-.13,.17],[-.24,.09,.27],[-.04,.33,.37]]){
   quad(pts,0,y0,-hw*.28,y0+(y1-y0)*.42,-hw,y1,22,GREEN,1.9);quad(pts,0,y0,hw*.28,y0+(y1-y0)*.42,hw,y1,22,GREEN,1.9);
   const n=hw>.3?5:hw>.2?4:3;for(let i=0;i<n;i++){const a=-hw+2*hw*i/n,r=hw/n;ell(pts,a+r,y1,r,r*.55,12,GREEN,1.9,0,Math.PI);}
   quad(pts,-hw*.62,y1-.07,0,y1-.015,hw*.62,y1-.1,14,GOLD,1.2);
   for(let k=0;k<6;k++){const u=.4+((k*37)%55)/100,x=(((k*53)%100)/100-.5)*1.5*hw*u;P(pts,x,y0+(y1-y0)*u,[RED,ICE,ORANGE,GOLD,'#B58AFF',WHITE][(k+Math.round(hw*10))%6],2.7);}}
  rect(pts,-.045,.37,.045,.43,3,ORANGE,1.7);
  for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,r=k%2?.024:.06;P(pts,Math.cos(a)*r,-.47+Math.sin(a)*r,GOLD,2.4);}
  return pts;},
 snowman(){const pts=[],u=1/7.2,base=.5,c1=base-u*1.6,c2=c1-u*2.6,c3=c2-u*1.9;
  ell(pts,0,c1,u*1.6,u*1.6,46,WHITE);ell(pts,0,c2,u*1.15,u*1.15,36,WHITE);ell(pts,0,c3,u*.85,u*.85,30,WHITE);
  P(pts,-u*.3,c3-u*.18,WHITE,2.6);P(pts,u*.3,c3-u*.18,WHITE,2.6);
  for(let k=0;k<6;k++)P(pts,u*.1+k*u*.12,c3+u*.08,ORANGE,2);
  for(let k=0;k<3;k++)P(pts,0,c2-u*.5+k*u*.5,RED,2.4);
  for(let k=0;k<9;k++)P(pts,-u*.75+k*u*.19,c3+u*.62,RED);
  return pts;},
 santa(){const pts=[];
  quad(pts,-.22,-.12,-.1,-.5,.22,-.46,34,RED,1.9);quad(pts,.22,-.12,.27,-.3,.22,-.46,16,RED,1.9);
  ell(pts,.24,-.47,.05,.05,16,WHITE,1.7);fillEll(pts,.24,-.47,.03,.03,.02,WHITE,1.4);
  rect(pts,-.27,-.15,.27,-.07,26,WHITE,1.8);for(const y of [-.125,-.095])seg(pts,-.25,y,.25,y,22,WHITE,1.3);
  ell(pts,0,.06,.2,.19,30,SKIN,1.8,-.6,Math.PI+.6);
  P(pts,-.07,.02,WHITE,2.8);P(pts,.07,.02,WHITE,2.8);fillEll(pts,-.12,.08,.03,.02,.014,PINK,1.3);fillEll(pts,.12,.08,.03,.02,.014,PINK,1.3);
  ell(pts,0,.085,.03,.025,10,'#FF9A8A',1.8);
  quad(pts,-.005,.13,-.06,.1,-.12,.15,8,WHITE,2);quad(pts,.005,.13,.06,.1,.12,.15,8,WHITE,2);
  for(let k=0;k<=46;k++){const a=k/46*Math.PI,m=1+.08*Math.abs(Math.sin(a*7));P(pts,Math.cos(a)*.25*m,.1+Math.sin(a)*.3*m,WHITE,1.8);}
  return pts;},
 rudolph(){const pts=[],AN='#F2D3A8';
  ell(pts,0,.06,.17,.22,40,BROWN,1.9);ell(pts,-.23,-.1,.07,.035,14,BROWN,1.8);ell(pts,.23,-.1,.07,.035,14,BROWN,1.8);
  const s=pts.length;seg(pts,-.08,-.14,-.2,-.46,14,AN,1.9);seg(pts,-.13,-.27,-.03,-.4,8,AN,1.9);seg(pts,-.17,-.37,-.3,-.42,8,AN,1.9);mirror(pts,s);
  P(pts,-.07,0,WHITE,2.8);P(pts,.07,0,WHITE,2.8);
  ell(pts,0,.2,.1,.07,20,AN,1.6);fillEll(pts,0,.19,.045,.04,.016,RED,2.2);quad(pts,-.04,.28,0,.31,.04,.28,6,AN,1.5);
  return pts;},
 penguin(){const pts=[];
  ell(pts,0,.05,.21,.34,52,ICE,1.9);ell(pts,0,.12,.14,.24,40,WHITE,1.7);
  P(pts,-.065,-.17,WHITE,2.8);P(pts,.065,-.17,WHITE,2.8);
  seg(pts,-.035,-.1,.035,-.1,4,ORANGE,1.8);seg(pts,.035,-.1,0,-.055,4,ORANGE,1.8);seg(pts,0,-.055,-.035,-.1,4,ORANGE,1.8);
  fillEll(pts,-.11,-.1,.025,.016,.012,PINK,1.2);fillEll(pts,.11,-.1,.025,.016,.012,PINK,1.2);
  quad(pts,-.2,-.05,-.33,.1,-.27,.2,10,ICE,1.8);quad(pts,.2,-.05,.33,.1,.27,.2,10,ICE,1.8);
  ell(pts,-.08,.4,.06,.025,12,ORANGE,2);ell(pts,.08,.4,.06,.025,12,ORANGE,2);
  return pts;},
 bungeoppang(){const pts=[],BAG='#E8C9A0',top=.02;
  // two chubby fish breads peeking out of a paper bag (parts inside the bag are hidden)
  const fish=()=>{const f=[],B='#F5B04A',D='#D9822B';
   quad(f,-.24,0,-.07,-.27,.15,-.05,26,B,1.9);quad(f,-.24,0,-.07,.27,.15,.05,26,B,1.9);
   ell(f,.2,-.065,.065,.055,14,B,1.9,-Math.PI*.95,Math.PI*.55);ell(f,.2,.065,.065,.055,14,B,1.9,-Math.PI*.55,Math.PI*.95);
   ell(f,-.12,-.045,.036,.036,12,'#FFE7B0',1.5);P(f,-.12,-.045,'#FFE7B0',2.6);P(f,-.13,-.056,WHITE,1.3);
   fillEll(f,-.1,.04,.026,.015,.012,PINK,1.2);quad(f,-.215,.03,-.195,.058,-.165,.042,4,D,1.4);
   for(const x of [-.02,.045,.105])ell(f,x,0,.04,.1,10,D,1.3,-Math.PI/2,Math.PI/2);
   quad(f,-.05,-.15,.03,-.22,.1,-.11,8,D,1.6);return f;};
  const keep=p=>p.y<top+.005;
  pts.push(...place(fish(),-.085,-.13,Math.PI/2+.28,.95).filter(keep),...place(fish(),.1,-.1,Math.PI/2-.32,.9).filter(keep));
  for(let k=0;k<12;k++)seg(pts,-.27+k*.045,top+(k%2?-.025:.012),-.27+(k+1)*.045,top+(k%2?.012:-.025),3,BAG,1.7);
  seg(pts,-.27,top,-.24,.46,16,BAG,1.8);seg(pts,.27,top,.24,.46,16,BAG,1.8);seg(pts,-.24,.46,.24,.46,22,BAG,1.8);
  for(let k=0;k<26;k++)P(pts,-.2+((k*41)%40)/100,top+.07+((k*29)%33)/100,BAG,1,{a:.35});
  pts.push(...textPts('붕어빵',.27,.075,[RED],600,'"Apple SD Gothic Neo","Malgun Gothic",sans-serif','700').map(p=>({...p,r:1.15})));
  return pts.map(p=>({...p,y:p.y-.03}));},
 aurora(){const pts=[],C=[GREEN,'#3DF5C8',ICE,'#B58AFF','#FF7AD9'];
  for(let k=0;k<5;k++){const y0=-.3+k*.1;for(let i=0;i<=40;i++){const x=-.42+.84*i/40,y=y0+.05*Math.sin(x*7+k*1.3);P(pts,x,y,C[k],1.7);if(i%2===0)for(let j=1;j<=4;j++)P(pts,x,y+j*.04,C[k],1.2,{a:1-j*.2});}}
  for(let k=0;k<9;k++)P(pts,-.35+k*.09,-.4+((k*29)%10)/100,WHITE,1.4);
  return pts;},
 snowglobe(){const pts=[],CR='#BFE9FF',BR='#C8864B';
  ell(pts,0,-.1,.32,.32,64,CR,1.7);ell(pts,0,-.1,.26,.26,14,WHITE,1.4,3.6,4.4);
  seg(pts,-.24,.19,.24,.19,18,BR,1.9);seg(pts,.24,.19,.3,.38,8,BR,1.9);seg(pts,.3,.38,-.3,.38,22,BR,1.9);seg(pts,-.3,.38,-.24,.19,8,BR,1.9);seg(pts,-.27,.28,.27,.28,20,GOLD,1.6);
  quad(pts,-.27,.08,0,.03,.27,.08,20,WHITE,1.6);
  rect(pts,-.1,-.04,.04,.07,7,ORANGE,1.6);seg(pts,-.13,-.04,-.03,-.14,7,RED,1.7);seg(pts,-.03,-.14,.07,-.04,7,RED,1.7);
  rect(pts,-.045,.02,-.01,.07,2,GOLD,1.3);P(pts,.01,0,GOLD,2.4);
  seg(pts,.1,.06,.15,-.08,7,GREEN,1.6);seg(pts,.15,-.08,.2,.06,7,GREEN,1.6);seg(pts,.1,.06,.2,.06,5,GREEN,1.6);
  for(let k=0;k<14;k++){const a=k*2.39,r=.05+((k*37)%20)/100;P(pts,Math.cos(a)*r,-.12+Math.sin(a)*r*.9,WHITE,1.5);}
  return pts;},
 nutcracker(){const pts=[],PURPLE='#B58AFF';
  rect(pts,-.1,-.5,.1,-.3,10,PURPLE,1.8);seg(pts,-.1,-.33,.1,-.33,10,GOLD,2);ell(pts,0,-.54,.03,.04,10,RED,1.8);
  rect(pts,-.085,-.3,.085,-.17,8,SKIN,1.7);P(pts,-.035,-.25,WHITE,2.4);P(pts,.035,-.25,WHITE,2.4);
  fillEll(pts,-.06,-.205,.016,.01,.01,PINK,1.2);fillEll(pts,.06,-.205,.016,.01,.01,PINK,1.2);
  quad(pts,0,-.2,-.04,-.22,-.07,-.19,5,WHITE,1.8);quad(pts,0,-.2,.04,-.22,.07,-.19,5,WHITE,1.8);
  rect(pts,-.085,-.17,.085,-.12,8,WHITE,1.6);
  rect(pts,-.13,-.12,.13,.14,12,RED,1.8);for(const y of [-.06,0,.05])P(pts,0,y,GOLD,2.6);
  seg(pts,-.13,.09,.13,.09,12,WHITE,1.8);P(pts,0,.09,GOLD,2.8);
  fillEll(pts,-.15,-.11,.035,.02,.014,GOLD,1.4);fillEll(pts,.15,-.11,.035,.02,.014,GOLD,1.4);
  rect(pts,-.19,-.1,-.13,.1,6,RED,1.6);rect(pts,.13,-.1,.19,.1,6,RED,1.6);P(pts,-.16,.13,SKIN,2.6);P(pts,.16,.13,SKIN,2.6);
  rect(pts,-.1,.14,-.02,.36,6,WHITE,1.7);rect(pts,.02,.14,.1,.36,6,WHITE,1.7);
  rect(pts,-.11,.36,-.01,.45,6,ICE,1.8);rect(pts,.01,.36,.11,.45,6,ICE,1.8);
  return pts;}
};
// Falling snow behind a picture (heavy for the snowman, light for the others).
function snowfall(n,heavy){const W=innerWidth,H=innerHeight,fl=Array.from({length:n},()=>({x:Math.random()*W,y:-Math.random()*H*(heavy?1:.7),v:(heavy?160:70)+Math.random()*(heavy?220:110),s:.8+Math.random()*(heavy?2.2:1.5),ph:Math.random()*6.28}));
 return (x,t,dt,o)=>{for(const p of fl){p.y+=p.v*dt;p.x+=Math.sin(t*.002+p.ph)*.6;if(p.y>o.H+10)p.y=-10;dot(x,p.x,p.y,p.s,WHITE,(heavy?.75:.55)*o.fade);}};}
// What happens around a picture on screen (motion of the whole picture, extra particles, snow, timing).
const EXTRA={
 christmas:{duration:3800,snow:90},
 tree:{snow:90},
 snowman:{launch:'top',snow:220,heavy:true},
 santa:{snow:90},
 rudolph:{snow:90,make(){return (x,t,dt,o)=>{if(t<700)return;const px=o.cx,py=o.cy+.19*o.S,r=o.S*(.09+.03*Math.sin(t*.012)),g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,'#FF0049cc');g.addColorStop(1,'#FF004900');x.globalAlpha=o.fade;x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2);};}},
 penguin:{snow:90,motion:(t,S)=>t<900?null:{rot:Math.sin((t-900)*.009)*.13,px:0,py:.42*S}},
 bungeoppang:{duration:3200,snow:60,make(){return (x,t,dt,o)=>{if(t<700)return;for(let k=0;k<3;k++)for(let i=0;i<16;i++){const u=i/16,yy=o.cy-.38*o.S-u*.2*o.S,xx=o.cx+(-.1+k*.1)*o.S+Math.sin(u*9-t*.006+k)*.022*o.S;dot(x,xx,yy,1.5,WHITE,o.fade*.5*(1-u)*Math.min(1,(t-700)/500));}};}},
 snowglobe:{make(){const parts=Array.from({length:70},()=>({a:Math.random()*6.28,r:Math.random()*.27,v:.6+Math.random()*1.2,ph:Math.random()*6.28}));
  return (x,t,dt,o)=>{if(t<500)return;for(const p of parts){p.a+=p.v*dt;const rr=p.r*(1+.08*Math.sin(t*.003+p.ph));dot(x,o.cx+Math.cos(p.a)*rr*o.S,o.cy+(-.1+Math.sin(p.a)*rr*.9)*o.S,1.2+.8*Math.sin(p.ph),WHITE,o.fade*.7);}};}},
 nutcracker:{snow:70,motion:(t,S)=>t<800?null:{dy:-Math.abs(Math.sin((t-800)*.008))*.04*S,rot:Math.sin((t-800)*.008)*.04}}
};

// ---------- 3D pictures ----------
const DARK='#8A5A33',AN='#F2D3A8',FAWN='#C98A55',BELLY='#EBC9A0',PURPLE='#B58AFF',CREAM='#E8C9A0',BREAD='#F5B04A',CRUST='#D9822B',BELL='#FFD24A';
const rnd=(a,b)=>a+Math.random()*(b-a);
// The 3D pictures (from 자료/이스터에그_3D시안_v3.html): points with depth, one slow full turn, nearer = brighter.
// ---------- 3D building blocks (unit coordinates, y down, −z faces the viewer) ----------
const add=(p,x,y,z,color,r=1.6,o)=>p.push({x,y,z,color,r,...o});
const norm=v=>{const l=Math.hypot(...v)||1;return v.map(c=>c/l);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function line3(p,a,b,n,color,r=1.7,o){for(let k=0;k<=n;k++){const u=k/n;add(p,a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u,color,r,o);}}
// Organic tube along a smooth path of [x,y,z,radius] (body, neck, legs, antlers, fish…): rings + lengthwise lines.
// flatN squashes the depth-ish side, flatB the other side; paint(nx,ny,nz,x,y,z) can recolor by surface direction/position.
function tube(p,path,color,{n=20,steps=5,lines=10,r=1.5,flatN=1,flatB=1,paint,o}={}){
 const Pt=i=>path[Math.max(0,Math.min(path.length-1,i))],S=[];
 for(let i=0;i<path.length-1;i++)for(let s=0;s<steps;s++){const u=s/steps,p0=Pt(i-1),p1=Pt(i),p2=Pt(i+1),p3=Pt(i+2);S.push([0,1,2,3].map(k=>.5*(2*p1[k]+(-p0[k]+p2[k])*u+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*u*u+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*u*u*u)));}
 S.push(path[path.length-1]);
 const every=Math.max(1,Math.round(n/lines));
 S.forEach((c,i)=>{const a=S[Math.max(0,i-1)],b=S[Math.min(S.length-1,i+1)],T=norm([b[0]-a[0],b[1]-a[1],b[2]-a[2]]),ref=Math.abs(T[2])<.9?[0,0,1]:[1,0,0],B=norm(cross(T,ref)),N=cross(B,T),ring=i%2===0;
  for(let k=0;k<n;k++){if(!ring&&k%every)continue;const ang=k/n*Math.PI*2,cn=Math.cos(ang),sb=Math.sin(ang),rad=Math.max(0,c[3]);
   const x=c[0]+(N[0]*cn*flatN+B[0]*sb*flatB)*rad,y=c[1]+(N[1]*cn*flatN+B[1]*sb*flatB)*rad,z=c[2]+(N[2]*cn*flatN+B[2]*sb*flatB)*rad;
   const nv=[N[0]*cn+B[0]*sb,N[1]*cn+B[1]*sb,N[2]*cn+B[2]*sb];add(p,x,y,z,paint?.(nv[0],nv[1],nv[2],x,y,z)||color,ring?r:r*.9,o);}});}
function ellipsoid(p,[cx,cy,cz],[rx,ry,rz],color,{rings=7,mer=14,n=44,r=1.5,paint,o}={}){
 const put=(x,y,z,rr)=>add(p,x,y,z,paint?.(x-cx,y-cy,z-cz)||color,rr,o);
 for(let i=1;i<rings;i++){const v=i/rings*Math.PI,y=cy-Math.cos(v)*ry,s=Math.sin(v);for(let k=0;k<n;k++){const a=k/n*Math.PI*2;put(cx+Math.cos(a)*rx*s,y,cz+Math.sin(a)*rz*s,r);}}
 for(let m=0;m<mer;m++){const a=m/mer*Math.PI*2;for(let k=1;k<18;k++){const v=k/18*Math.PI;put(cx+Math.sin(v)*Math.cos(a)*rx,cy-Math.cos(v)*ry,cz+Math.sin(v)*Math.sin(a)*rz,r*.9);}}}
function cylinder(p,[cx,cz],rad,y0,y1,color,{rings=3,mer=12,n=32,r=1.5,o}={}){
 for(let i=0;i<=rings;i++){const y=y0+(y1-y0)*i/rings;for(let k=0;k<n;k++){const a=k/n*Math.PI*2;add(p,cx+Math.cos(a)*rad,y,cz+Math.sin(a)*rad,color,r,o);}}
 for(let m=0;m<mer;m++){const a=m/mer*Math.PI*2;line3(p,[cx+Math.cos(a)*rad,y0,cz+Math.sin(a)*rad],[cx+Math.cos(a)*rad,y1,cz+Math.sin(a)*rad],Math.max(3,Math.round(Math.abs(y1-y0)*40)),color,r*.9,o);}}
function torus(p,[cx,cy,cz],R,t,color,{axis='y',n=56,m=8,r=1.5,o,jitter=0,colors}={}){
 for(let i=0;i<n;i++){const a=i/n*Math.PI*2;for(let j=0;j<m;j++){const b=j/m*Math.PI*2,rr=R+Math.cos(b)*t+(jitter?rnd(-jitter,jitter):0),h=Math.sin(b)*t+(jitter?rnd(-jitter,jitter):0),c=colors?colors[(i+j)%colors.length]:color;
  if(axis==='y')add(p,cx+Math.cos(a)*rr,cy+h,cz+Math.sin(a)*rr,c,r,o);else add(p,cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,cz+h,c,r,o);}}}
function box(p,[cx,cy,cz],[w,h,d],color,{n=12,r=1.6,face=.32,o,skipTop=false}={}){
 const X=[cx-w/2,cx+w/2],Y=[cy-h/2,cy+h/2],Z=[cz-d/2,cz+d/2];
 for(const y of Y)for(const z of Z){if(skipTop&&y===Y[0])continue;line3(p,[X[0],y,z],[X[1],y,z],n,color,r,o);}
 for(const x of X)for(const z of Z)line3(p,[x,Y[0],z],[x,Y[1],z],Math.round(n*h/w)||3,color,r,o);
 for(const x of X)for(const y of Y){if(skipTop&&y===Y[0])continue;line3(p,[x,y,Z[0]],[x,y,Z[1]],Math.round(n*d/w)||3,color,r,o);}
 if(face)for(let k=0;k<n*5;k++){const f=k%5,u=Math.random(),v=Math.random();const pt=f===0?[X[0]+u*w,Y[0]+v*h,Z[0]]:f===1?[X[0]+u*w,Y[0]+v*h,Z[1]]:f===2?[X[0],Y[0]+v*h,Z[0]+u*d]:f===3?[X[1],Y[0]+v*h,Z[0]+u*d]:[X[0]+u*w,skipTop?Y[1]:Y[0],Z[0]+v*d];add(p,...pt,color,1.1,{...o,a:face});}}
const blob=(p,[cx,cy,cz],rad,n,color,r=1.6,o)=>{for(let k=0;k<n;k++){const a=Math.random()*Math.PI*2,b=Math.acos(rnd(-1,1)),rr=rad*Math.cbrt(Math.random());add(p,cx+Math.sin(b)*Math.cos(a)*rr,cy+Math.cos(b)*rr,cz+Math.sin(b)*Math.sin(a)*rr,color,r,o);}};
const text3=(str,cy,size,colors,font,weight,z=0)=>textPts(str,cy,size,colors,0,font,weight).map(q=>({x:q.x,y:q.y,z,color:q.color,r:q.r,d:q.d}));
const shift=(pts,dx=0,dy=0,dz=0)=>pts.map(q=>({...q,x:q.x+dx,y:q.y+dy,z:q.z+dz}));

// ---------- the nine 3D pictures ----------
const MAKE={
 christmas(){const p=[],G=[GREEN,'#36D97A','#8BEA9E','#1FB85A'];
  torus(p,[0,-.04,0],.38,.065,GREEN,{axis:'z',n:84,m:9,jitter:.018,colors:G});
  for(let k=0;k<160;k++){const a=Math.random()*Math.PI*2,b=Math.random()*Math.PI*2,rr=.38+Math.cos(b)*.085;add(p,Math.cos(a)*rr,-.04+Math.sin(a)*rr,Math.sin(b)*.085,G[k%4],1.2);}
  for(let k=0;k<16;k++){const a=k/16*Math.PI*2+rnd(-.15,.15);blob(p,[Math.cos(a)*.38,-.04+Math.sin(a)*.38,-.06],.022,9,k%4?RED:GOLD,2);}
  const by=-.43,bz=-.13;
  for(const sg of [-1,1]){tube(p,[[0,by,bz,.02],[sg*.05,by-.055,bz,.03],[sg*.12,by-.065,bz,.034],[sg*.155,by-.02,bz,.032],[sg*.12,by+.03,bz,.028],[sg*.045,by+.018,bz,.022],[0,by,bz,.02]],RED,{n:16,lines:8,flatN:.45,r:1.8});
   for(let k=0;k<40;k++){const u=Math.random(),v=Math.random();const x=sg*(.02+u*.12),y=by-.05*Math.sin(u*Math.PI)*(.4+v*.6)+.012*Math.sin(u*Math.PI)*v;add(p,x,y,bz,RED,1.2,{a:.5});}
   tube(p,[[sg*.012,by+.012,bz+.03,.018],[sg*.06,by+.07,bz+.035,.022],[sg*.095,by+.125,bz+.035,.02],[sg*.085,by+.15,bz+.035,.01]],RED,{n:12,lines:6,flatN:.4,r:1.7});}
  ellipsoid(p,[0,by,bz-.01],[.032,.03,.025],RED,{rings:4,mer:8,n:18,r:1.8});
  for(const [bx,ph,base] of [[-.026,0,.3],[.026,1.1,-.3]]){const T=-.415,top=[bx,T,-.1],bell=[];
   line3(bell,[bx,T,-.1],[bx,T+.012,-.1],2,GOLD,1.5);
   tube(bell,[[bx,T+.01,-.1,.004],[bx,T+.016,-.1,.024],[bx,T+.03,-.1,.042],[bx,T+.052,-.1,.054],[bx,T+.08,-.1,.062],[bx,T+.106,-.1,.07],[bx,T+.124,-.1,.08],[bx,T+.134,-.1,.085],[bx,T+.14,-.1,.083]],BELL,{n:26,lines:13,r:1.6});
   blob(bell,[bx,T+.152,-.1],.018,10,GOLD,1.9);p.push(...bell.map(q=>({...q,bell:{px:top[0],py:top[1],ph,base}})));}
  p.push(...text3('Merry',-.125,.15,[WHITE,GOLD]),...text3('Christmas',.05,.15,[WHITE,GOLD]));return p;},
 tree(){const p=[];
  for(const [y0,y1,rb] of [[-.42,-.13,.17],[-.24,.09,.27],[-.04,.33,.37]]){
   for(let m=0;m<14;m++){const a=m/14*Math.PI*2;for(let k=0;k<=12;k++){const u=k/12,r=rb*Math.pow(u,.8);add(p,Math.cos(a)*r,y0+(y1-y0)*u,Math.sin(a)*r,GREEN,1.6);}}
   for(let k=0;k<64;k++){const a=k/64*Math.PI*2,sc=1+.06*Math.abs(Math.sin(a*7));add(p,Math.cos(a)*rb*sc,y1+.02*Math.abs(Math.sin(a*7)),Math.sin(a)*rb*sc,GREEN,1.8);}
   for(let k=0;k<70;k++){const u=k/70,a=u*Math.PI*4,r=rb*Math.pow(.25+u*.7,.8);add(p,Math.cos(a)*r*1.02,y0+(y1-y0)*(.25+u*.7),Math.sin(a)*r*1.02,GOLD,1.2);}
   for(let k=0;k<9;k++){const u=rnd(.35,.95),a=Math.random()*Math.PI*2,r=rb*Math.pow(u,.8)*1.03;add(p,Math.cos(a)*r,y0+(y1-y0)*u,Math.sin(a)*r,[RED,ICE,ORANGE,PURPLE,WHITE][k%5],3);}}
  cylinder(p,[0,0],.04,.34,.42,ORANGE,{rings:3,mer:8,n:12});
  for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,r=k%2?.024:.06;add(p,Math.cos(a)*r,-.47+Math.sin(a)*r,0,GOLD,2.6,{bill:true});}
  return p;},
 snowman(){const p=[];
  ellipsoid(p,[0,.29,0],[.19,.17,.19],WHITE,{rings:7,mer:14});ellipsoid(p,[0,-.02,0],[.14,.13,.14],WHITE,{rings:6,mer:12,n:38});ellipsoid(p,[0,-.26,0],[.105,.1,.105],WHITE,{rings:6,mer:12,n:32});
  for(const x of [-.04,.04])blob(p,[x,-.29,-.095],.01,6,'#9AA7B8',2.2);
  tube(p,[[0,-.255,-.1,.022],[0,-.252,-.15,.016],[0,-.25,-.2,.009],[0,-.249,-.225,.003]],ORANGE,{n:10,lines:5,r:1.6});
  for(const y of [-.06,.0,.06])blob(p,[0,y,-.135],.012,6,'#9AA7B8',2.2);
  torus(p,[0,-.16,0],.1,.022,RED,{n:40,m:6,r:1.7});tube(p,[[.05,-.15,-.09,.02],[.07,-.08,-.13,.018],[.08,.0,-.15,.016]],RED,{n:10,lines:5,flatN:.4});
  for(const s of [-1,1]){tube(p,[[s*.13,-.04,0,.009],[s*.2,-.09,0,.008],[s*.27,-.13,0,.006],[s*.33,-.17,0,.003]],DARK,{n:8,lines:4,r:1.5});tube(p,[[s*.25,-.12,0,.005],[s*.28,-.19,0,.003]],DARK,{n:6,lines:3,r:1.4});}
  cylinder(p,[0,0],.085,-.47,-.36,PURPLE,{rings:3,mer:10,n:26});torus(p,[0,-.36,0],.12,.012,PURPLE,{n:36,m:4});torus(p,[0,-.38,0],.088,.01,RED,{n:30,m:4,r:1.4});
  return p;},
 santa(){const p=[],GO='#E0A85A',TREE='#2FD06A';
  // red sleigh: curved side panels on both sides (outline + light fill), ribs across, gold trim; gold runners with curled fronts
  const out=[[-.34,-.15],[-.345,.0],[-.34,.1],[-.3,.16],[0,.165],[.26,.16],[.33,.12],[.37,.02],[.36,-.06],[.32,-.075],[.29,-.04],[.27,.0],[.12,.025],[-.12,.02],[-.26,-.02],[-.31,-.08],[-.34,-.15]];
  const smooth=(pts,steps=6)=>{const r=[],Pt=i=>pts[Math.max(0,Math.min(pts.length-1,i))];for(let i=0;i<pts.length-1;i++)for(let s=0;s<steps;s++){const u=s/steps,p0=Pt(i-1),p1=Pt(i),p2=Pt(i+1),p3=Pt(i+2);r.push([0,1].map(k=>.5*(2*p1[k]+(-p0[k]+p2[k])*u+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*u*u+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*u*u*u)));}return r;};
  const edge=smooth(out),inside=(x,y)=>{let c=false;for(let i=0,j=out.length-1;i<out.length;j=i++){const [xi,yi]=out[i],[xj,yj]=out[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;};
  for(const z of [-.17,.17]){edge.forEach(([x,y])=>add(p,x,y,z,RED,1.8));for(let k=0;k<160;k++){const x=rnd(-.34,.37),y=rnd(-.15,.165);if(inside(x,y))add(p,x,y,z,RED,1.1,{a:.32});}
   edge.slice(66,96).forEach(([x,y])=>add(p,x,y-.012,z,GO,1.3));}
  edge.forEach(([x,y],i)=>{if(i%7===0)line3(p,[x,y,-.17],[x,y,.17],10,RED,1.4);});
  for(const z of [-.14,.14]){tube(p,[[-.3,.31,z,.012],[0,.31,z,.012],[.28,.31,z,.012],[.38,.28,z,.012],[.42,.21,z,.012],[.39,.16,z,.011],[.35,.18,z,.01]],GO,{n:8,lines:4,r:1.6});for(const x of [-.22,0,.2])line3(p,[x,.165,z],[x,.31,z],6,GO,1.6);}
  // gifts behind Santa
  box(p,[-.25,-.09,.0],[.13,.13,.13],GREEN,{n:8,face:.28});line3(p,[-.25,-.155,-.066],[-.25,-.025,-.066],6,RED,1.8);line3(p,[-.315,-.09,-.066],[-.185,-.09,-.066],6,RED,1.8);
  box(p,[-.27,-.2,.02],[.1,.09,.1],WHITE,{n:7,face:.28});line3(p,[-.27,-.245,-.031],[-.27,-.155,-.031],5,RED,1.8);for(const s of [-1,1])tube(p,[[-.27,-.245,.02,.006],[-.27+s*.03,-.27,.02,.012],[-.27+s*.05,-.25,.02,.006]],RED,{n:8,lines:4});
  // small tree at the front
  for(const [y0,y1,rb] of [[-.17,-.09,.04],[-.12,-.03,.055],[-.07,.03,.07]])for(let m=0;m<10;m++){const a=m/10*Math.PI*2;line3(p,[.25,y0,.12],[.25+Math.cos(a)*rb,y1,.12+Math.sin(a)*rb],5,TREE,1.4);}
  for(let k=0;k<5;k++)add(p,.25+rnd(-.045,.045),rnd(-.1,.02),.12-rnd(.02,.05),[RED,GOLD,ICE][k%3],2.4);for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,r=k%2?.011:.026;add(p,.25+Math.cos(a)*r,-.19+Math.sin(a)*r,.12,GOLD,2,{bill:true});}
  // turn the sleigh, gifts and tree a quarter so the sleigh is pulled toward the viewer (front = −z)
  for(const q of p){const x0=q.x;q.x=q.z;q.z=-x0;}
  // chubby Santa sitting inside
  ellipsoid(p,[-.03,-.09,0],[.15,.15,.13],RED,{rings:8,mer:14,n:44});line3(p,[-.03,-.2,-.13],[-.03,.03,-.12],10,WHITE,2.2);
  torus(p,[-.03,-.03,0],.15,.016,DARK,{n:44,m:5,r:1.6});for(const [x,y] of [[-.055,-.045],[-.005,-.045],[-.055,-.015],[-.005,-.015]])line3(p,[x,y,-.155],[x+(x<-.03?.05:-.05),y,-.155],4,GOLD,2);
  for(const s of [-1,1]){tube(p,[[-.03+s*.12,-.15,0,.045],[-.03+s*.15,-.08,-.04,.04],[.06+s*.05,-.04,-.1,.038]],RED,{n:14,lines:7});tube(p,[[.06+s*.05,-.04,-.1,.044],[.075+s*.05,-.035,-.11,.044]],WHITE,{n:14,lines:7});ellipsoid(p,[.1+s*.05,-.03,-.12],[.035,.035,.035],RED,{rings:4,mer:8,n:14});}
  tube(p,[[-.03,-.42,0,.01],[-.03,-.4,0,.075],[-.03,-.34,0,.092],[-.03,-.28,0,.088],[-.03,-.24,0,.06]],SKIN,{n:22,lines:10});
  for(let k=0;k<150;k++){const a=rnd(-.95,.95)*Math.PI/2,v=Math.random(),y=-.31+v*.15,w=.09*(1-v*.5);add(p,-.03+Math.sin(a)*w*rnd(.6,1.05),y,-Math.cos(a)*w*rnd(.6,1.05)-.01,WHITE,1.5);}
  tube(p,[[-.09,-.31,-.075,.011],[-.055,-.318,-.09,.016],[-.03,-.322,-.094,.018],[-.005,-.318,-.09,.016],[.03,-.31,-.075,.011]],WHITE,{n:10,lines:5});
  for(const x of [-.062,.002])blob(p,[x,-.355,-.083],.009,6,'#9AA7B8',2.2);blob(p,[-.03,-.335,-.095],.015,10,'#FF9A8A',1.8);for(const x of [-.09,.03])blob(p,[x,-.33,-.075],.013,6,PINK,1.3);
  tube(p,[[-.03,-.395,0,.095],[-.02,-.45,.0,.078],[.01,-.51,.01,.058],[.06,-.54,.02,.04],[.1,-.53,.03,.026],[.12,-.49,.03,.014]],RED,{n:22,lines:10});
  torus(p,[-.03,-.395,0],.098,.024,WHITE,{n:40,m:6});blob(p,[.125,-.47,.03],.032,28,WHITE,1.6);
  return shift(p,-.01,.06);},
 rudolph(){const p=[],FUR='#B9763F',CRM='#F6E3C0',HOOF='#6B4428',ANT='#7A4B2A',EYE='#2b1d14';
  // chibi sitting reindeer: big round head, cream lower face, big shiny eyes, red nose, Y antlers, big ears, red bow, small sitting body
  ellipsoid(p,[0,-.13,0],[.2,.175,.18],FUR,{rings:10,mer:16,n:52,paint:(x,y,z)=>(y>.0&&z<-.03)||(y>-.05&&z<-.13&&Math.abs(x)<.13)?CRM:null});
  for(const s of [-1,1]){blob(p,[s*.065,-.235,-.15],.014,8,CRM,1.8);
   blob(p,[s*.085,-.115,-.168],.03,30,EYE,2);add(p,s*.085+.01,-.128,-.198,WHITE,2.6);
   tube(p,[[s*.16,-.2,-.02,.01],[s*.22,-.235,-.03,.045],[s*.29,-.245,-.03,.04],[s*.345,-.235,-.03,.006]],FUR,{n:16,lines:8,flatN:.35});
   tube(p,[[s*.19,-.215,-.045,.006],[s*.235,-.237,-.05,.025],[s*.29,-.243,-.05,.022],[s*.33,-.236,-.05,.004]],PINK,{n:12,lines:6,flatN:.25});
   tube(p,[[s*.07,-.285,0,.022],[s*.085,-.37,0,.021],[s*.11,-.46,0,.019],[s*.135,-.53,0,.016],[s*.14,-.545,0,.008]],ANT,{n:12,lines:6});
   tube(p,[[s*.098,-.41,0,.017],[s*.17,-.43,0,.015],[s*.2,-.47,0,.013],[s*.205,-.485,0,.006]],ANT,{n:10,lines:5});
   tube(p,[[s*.06,.17,-.09,.036],[s*.068,.25,-.12,.033],[s*.074,.3,-.14,.031]],FUR,{n:14,lines:7});ellipsoid(p,[s*.075,.33,-.15],[.034,.022,.034],HOOF,{rings:4,mer:8,n:16});
   ellipsoid(p,[s*.13,.28,-.02],[.065,.055,.09],FUR,{rings:5,mer:10,n:24});ellipsoid(p,[s*.15,.31,-.12],[.037,.032,.025],HOOF,{rings:4,mer:8,n:16});}
  blob(p,[0,-.05,-.19],.032,34,RED,2.3,{nose:true});add(p,.01,-.062,-.222,WHITE,1.8);
  tube(p,[[-.03,.0,-.17,.004],[0,.01,-.175,.006],[.03,.0,-.17,.004]],'#8A5A33',{n:6,lines:3,r:1.3});
  ellipsoid(p,[0,.2,0],[.14,.13,.12],FUR,{rings:6,mer:12,n:36,paint:(x,y,z)=>z<-.06&&Math.abs(x)<.08?CRM:null});blob(p,[0,.18,.13],.025,12,CRM,1.6);
  const by=.06,bz=-.14;for(const s of [-1,1]){tube(p,[[0,by,bz,.014],[s*.07,by-.04,bz,.026],[s*.13,by,bz,.026],[s*.07,by+.04,bz,.02],[0,by,bz,.014]],RED,{n:12,lines:6,flatN:.5});tube(p,[[s*.015,by+.01,bz,.016],[s*.05,by+.08,bz-.01,.022],[s*.06,by+.115,bz-.01,.012]],RED,{n:10,lines:5,flatN:.5});}
  blob(p,[0,by,bz-.005],.026,18,RED,2);
  return shift(p,0,.05);},
 snowglobe(){const p=[],GL='#CFEFFF',WOOD='#B07A4A',cy=-.1,R=.3;
  // glass sphere (faint), highlight, wooden round stand with gold band, snowy village inside, snow swirling inside
  ellipsoid(p,[0,cy,0],[R,R,R],GL,{rings:8,mer:12,n:60,r:1.2,o:{a:.45}});
  for(let k=0;k<=16;k++){const a=3.5+k/16*.95;add(p,Math.cos(a)*R*.86,cy+Math.sin(a)*R*.86,-R*.45,WHITE,1.7);}
  tube(p,[[0,cy+R*.86,0,.16],[0,.17,0,.2],[0,.24,0,.235],[0,.31,0,.26],[0,.35,0,.255]],WOOD,{n:44,lines:18});torus(p,[0,.27,0],.248,.01,GOLD,{n:56,m:4,r:1.6});
  for(const rr of [.06,.12,.18,.23])for(let k=0;k<Math.round(rr*160);k++){const a=k/Math.round(rr*160)*Math.PI*2;add(p,Math.cos(a)*rr,.115,Math.sin(a)*rr,WHITE,1.3);}
  box(p,[-.05,.06,.02],[.12,.1,.1],ORANGE,{n:8,face:.3});
  for(let k=0;k<=8;k++){const x=-.11+k*.015;line3(p,[x,.01,-.035],[x,-.05,.02],5,RED,1.4);line3(p,[x,.01,.075],[x,-.05,.02],5,RED,1.4);add(p,x,-.055,.02,WHITE,1.8);}
  blob(p,[-.05,.06,-.032],.014,8,GOLD,2);
  for(const [y0,y1,rb] of [[-.09,-.03,.035],[-.05,.02,.05],[-.01,.1,.065]])for(let m=0;m<10;m++){const a=m/10*Math.PI*2;line3(p,[.13,y0,.0],[.13+Math.cos(a)*rb,y1,Math.sin(a)*rb],5,GREEN,1.4);}
  // snow piled on the roof (both slopes, thicker toward the ridge, little drips at the eaves) and on the tree tiers
  for(let k=0;k<70;k++){const x=rnd(-.115,.015),u=Math.sqrt(Math.random()),back=k%2;const y=.01-.06*u-.008,z=back?.075-.055*u:-.035+.055*u;add(p,x,y,z+(back?.004:-.004),WHITE,rnd(1.2,1.8));}
  for(const z of [-.037,.077])for(let k=0;k<12;k++){const x=-.11+k*.011;add(p,x,.012+(k%3===0?.008:0),z,WHITE,1.6);}
  for(let k=0;k<14;k++)add(p,rnd(-.11,.01),-.058,.02+rnd(-.006,.006),WHITE,1.9);
  for(const [y0,y1,rb] of [[-.09,-.03,.035],[-.05,.02,.05],[-.01,.1,.065]]){for(let k=0;k<22;k++){const a=k/22*Math.PI*2+rnd(-.1,.1),u=rnd(.55,1);add(p,.13+Math.cos(a)*rb*u,y0+(y1-y0)*u-.006,Math.sin(a)*rb*u,WHITE,rnd(1.2,1.7));}
   for(let k=0;k<10;k++){const a=k/10*Math.PI*2;add(p,.13+Math.cos(a)*rb,y1-.004,Math.sin(a)*rb,WHITE,1.8);}}
  blob(p,[.13,-.088,0],.008,6,WHITE,1.6);
  add(p,.13,-.1,0,GOLD,2.6,{bill:true});
  for(let k=0;k<110;k++){const rad=Math.sqrt(Math.random())*.25,a=Math.random()*Math.PI*2;add(p,0,0,0,WHITE,rnd(1,1.7),{swirl:{a,rad,y:cy+rnd(-.22,.2),sp:rnd(.6,1.6),ph:Math.random()*6.28}});}
  return p;},
 bungeoppang(){const p=[],W=.46,H=.4,D=.24,top=.04;
  box(p,[0,top+H/2,0],[W,H,D],CREAM,{n:16,skipTop:true,face:.28});
  for(const z of [-D/2,D/2])for(let k=0;k<=46;k++){const x=-W/2+W*k/46;add(p,x,top+Math.sin(k/46*Math.PI*10)*.012,z,CREAM,1.7);}
  p.push(...text3('붕어빵',top+.23,.08,[RED],'"Apple SD Gothic Neo","Malgun Gothic",sans-serif','700',-D/2-.003));
  // round fish bread: lofted body (round mouth, no points), round tail fan, round fins, eyes and scale arcs on both sides
  const fish=(ox,oy,oz,rot)=>{const f=[];
   tube(f,[[0,-.215,0,.012],[0,-.2,0,.06],[0,-.14,0,.105],[0,-.04,0,.122],[0,.06,0,.105],[0,.13,0,.07],[0,.17,0,.05]],BREAD,{n:26,lines:12,flatN:.48,paint:(nx,ny,nz)=>Math.abs(nz)<.25?CRUST:null});
   ellipsoid(f,[0,.225,0],[.095,.06,.02],BREAD,{rings:4,mer:10,n:22});
   ellipsoid(f,[.115,-.03,0],[.03,.06,.012],CRUST,{rings:3,mer:6,n:14});ellipsoid(f,[-.115,.0,0],[.025,.045,.012],CRUST,{rings:3,mer:6,n:14});
   for(const s of [-1,1]){blob(f,[0,-.13,s*.05],.016,10,'#FFE7B0',1.7);add(f,.006,-.136,s*.058,WHITE,1.4);
    for(let row=0;row<3;row++)for(let j=0;j<4;j++){const cx=(j-1.5)*.045,cy=-.04+row*.055;for(let k=0;k<=6;k++){const a=Math.PI*(k/6);add(f,cx+Math.cos(a)*.02,cy+Math.sin(a)*.016,s*.054*(1-((cy)/.2)**2),CRUST,1.15);}}}
   return f.map(q=>{const x=q.x*Math.cos(rot)-q.y*Math.sin(rot),y=q.x*Math.sin(rot)+q.y*Math.cos(rot);return {...q,x:x+ox,y:y+oy,z:q.z+oz};}).filter(q=>q.y<=top+.012);};
  p.push(...fish(-.085,-.06,0,.26),...fish(.095,-.04,.03,-.3));
  return shift(p,0,-.03);},
 gift(){const p=[],S=.36,cy=.17;
  box(p,[0,cy,0],[S,S,S],RED,{n:16,face:.3,skipTop:true});
  for(const z of [-S/2-.002,S/2+.002])line3(p,[0,cy-S/2,z],[0,cy+S/2,z],14,GOLD,2);for(const x of [-S/2-.002,S/2+.002])line3(p,[x,cy-S/2,0],[x,cy+S/2,0],14,GOLD,2);
  const lid={g:'lid'},ly=cy-S/2-.03;box(p,[0,ly,0],[S+.04,.06,S+.04],RED,{n:16,face:.3,o:lid});
  line3(p,[-(S+.04)/2,ly-.031,0],[(S+.04)/2,ly-.031,0],14,GOLD,2,lid);line3(p,[0,ly-.031,-(S+.04)/2],[0,ly-.031,(S+.04)/2],14,GOLD,2,lid);
  const by=ly-.04;for(const s of [-1,1])tube(p,[[0,by,0,.012],[s*.06,by-.05,0,.022],[s*.12,by-.02,0,.022],[s*.07,by+.005,0,.016],[0,by,0,.012]],GOLD,{n:12,lines:6,flatN:.5,o:lid});
  blob(p,[0,by,0],.024,14,GOLD,2,lid);return p;},
 snowflake(){const p=[],C1='#BFE9FF',C2=WHITE;
  // six-armed ice crystal: tapered arms with side branches, small inner arms, a hexagon center; points carry a scatter direction
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2-Math.PI/2,ux=Math.cos(a),uy=Math.sin(a),at=(d,o=0)=>[ux*d-uy*o,uy*d+ux*o];
   tube(p,[[0,0,0,.016],[...at(.2),0,.013],[...at(.36),0,.008],[...at(.44),0,.003]],C1,{n:10,lines:5,r:1.6});
   for(const [d,len] of [[.13,.08],[.24,.1],[.33,.065]])for(const sgn of [-1,1]){const b=a+sgn*Math.PI/3,base=at(d);tube(p,[[base[0],base[1],0,.008],[base[0]+Math.cos(b)*len*.6,base[1]+Math.sin(b)*len*.6,0,.006],[base[0]+Math.cos(b)*len,base[1]+Math.sin(b)*len,0,.002]],C2,{n:8,lines:4,r:1.4});}
   blob(p,[...at(.445),0],.012,8,C2,1.8);
   const a2=a+Math.PI/6;tube(p,[[0,0,0,.01],[Math.cos(a2)*.08,Math.sin(a2)*.08,0,.007],[Math.cos(a2)*.12,Math.sin(a2)*.12,0,.002]],C1,{n:8,lines:4,r:1.4});}
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2,b=(i+1)/6*Math.PI*2;line3(p,[Math.cos(a)*.06,Math.sin(a)*.06,0],[Math.cos(b)*.06,Math.sin(b)*.06,0],5,C2,1.7);}
  blob(p,[0,0,0],.022,14,C2,1.8);
  return p;},
 soldier(){const p=[];
  for(const x of [-.05,.05]){tube(p,[[x,.14,0,.042],[x,.25,0,.038],[x,.35,0,.036]],WHITE,{n:16,lines:8});tube(p,[[x,.35,0,.044],[x,.43,0,.046]],ICE,{n:16,lines:8});ellipsoid(p,[x,.445,-.02],[.045,.018,.065],ICE,{rings:3,mer:8,n:16});}
  tube(p,[[0,-.13,0,.11],[0,-.05,0,.125],[0,.05,0,.125],[0,.14,0,.12]],RED,{n:36,lines:16,flatN:.85});torus(p,[0,.09,0],.125,.012,WHITE,{n:40,m:4,r:1.6});blob(p,[0,.09,-.11],.016,8,GOLD,2.2);
  for(const y of [-.07,-.02,.03])blob(p,[0,y,-.108],.012,6,GOLD,2.4);
  for(const s of [-1,1]){ellipsoid(p,[s*.12,-.115,0],[.045,.02,.04],GOLD,{rings:3,mer:8,n:16});tube(p,[[s*.14,-.11,0,.034],[s*.16,-.02,-.01,.031],[s*.165,.08,-.02,.029]],RED,{n:14,lines:7});ellipsoid(p,[s*.165,.115,-.02],[.026,.03,.026],SKIN,{rings:3,mer:6,n:12});}
  tube(p,[[0,-.12,0,.05],[0,-.16,0,.078],[0,-.24,0,.086],[0,-.3,0,.084]],SKIN,{n:26,lines:12});
  for(const x of [-.034,.034])blob(p,[x,-.25,-.082],.01,6,'#9AA7B8',2.4);for(const x of [-.055,.055])blob(p,[x,-.215,-.075],.012,5,PINK,1.3);
  tube(p,[[-.065,-.2,-.08,.01],[-.03,-.205,-.088,.014],[0,-.207,-.09,.015],[.03,-.205,-.088,.014],[.065,-.2,-.08,.01]],WHITE,{n:10,lines:5});
  for(let k=0;k<70;k++){const a=rnd(-.9,.9)*Math.PI/2,v=Math.random();add(p,Math.sin(a)*.08*(1-v*.4),-.19+v*.06,-Math.cos(a)*.08*(1-v*.4),WHITE,1.4);}
  cylinder(p,[0,0],.09,-.52,-.3,PURPLE,{rings:5,mer:12,n:30});torus(p,[0,-.33,0],.092,.012,GOLD,{n:34,m:4,r:1.8});blob(p,[0,-.56,0],.035,22,RED,1.7);
  return p;}
};
// ---------- 3D player: every picture turns one full round; depth-sorted, nearer = brighter ----------
const MOTION={snowflake:{dur:5200,flakeBurst:true},christmas:{dur:5000,bells:true},bungeoppang:{steam:true},gift:{open:true},snowman:{heavy:true},penguin:{waddle:true},soldier:{bob:true},rudolph:{glowNose:true}};
function play3d(id,soft,o={}){
 const m=MOTION[id]||{},dur=o.dur||m.dur||4600,{c,x,W,H}=stage(),cx=W*(o.fx??.5),cy=H*(o.fy??.5),S=Math.min(H*.7,W*.5)*(o.scale||1),pts=MAKE[id](),start=performance.now(),snow=o.noSnow?null:snowfall(m.heavy?220:90,m.heavy),tilt=-.18,f=2.8,rs=Math.max(.75,S/450);
 pts.forEach(p=>{p.delay=(p.d!=null?p.d*.6:(p.y+.5)*520)+Math.random()*200;});
 const burst=[];let last=start;
 (function frame(now){const t=now-start,dt=Math.min(.05,(now-last)/1000);last=now;x.clearRect(0,0,W,H);x.globalCompositeOperation='lighter';
  const fade=(t>dur-800?Math.max(0,(dur-t)/800):1)*(soft?.7:1),turn=Math.min(1,Math.max(0,(t-500)/((m.flakeBurst?dur-1700:dur-600)-500))),ease=turn<.5?2*turn*turn:1-Math.pow(-2*turn+2,2)/2,th=m.split?(1-Math.min(1,Math.max(0,(t-500)/1900))**.6)*Math.PI*2:ease*Math.PI*2,cs=Math.cos(th),sn=Math.sin(th),ct=Math.cos(tilt),st=Math.sin(tilt);
  snow?.(x,t,dt,{W,H,fade});
  const lidUp=m.open?Math.min(1,Math.max(0,(t-1500)/600)):0,wad=m.waddle&&t>900?Math.sin((t-900)*.009)*.12:0,bob=m.bob&&t>800?-Math.abs(Math.sin((t-800)*.008))*.04:0;
  let nose=null;
  const proj=pts.map(p=>{let X=p.x,Y=p.y,Z=p.z;
    if(p.bell){const a=(p.bell.base||0)+Math.sin(t*.0085+p.bell.ph)*.3*Math.min(1,t/900),dx=X-p.bell.px,dy=Y-p.bell.py;X=p.bell.px+dx*Math.cos(a)-dy*Math.sin(a);Y=p.bell.py+dx*Math.sin(a)+dy*Math.cos(a);}
    if(p.g==='lid'&&lidUp){const e=1-Math.pow(1-lidUp,3);Y-=.22*e;X+=.06*e;const a=-.5*e,yy=Y+.05,zz=Z;Y=yy*Math.cos(a)-zz*Math.sin(a)-.05;Z=yy*Math.sin(a)+zz*Math.cos(a);}
    if(wad){const yy=Y-.4,xx=X;X=xx*Math.cos(wad)-yy*Math.sin(wad);Y=xx*Math.sin(wad)+yy*Math.cos(wad)+.4;}
    Y+=bob;
    if(m.split){const rise=1-Math.pow(1-Math.min(1,Math.max(0,(t-300)/1300)),3);
     if(p.g==='bag')Y+=.12*Math.min(1,Math.max(0,(t-900)/800));
     else{Y+=.3*(1-rise);const sp=Math.min(1,Math.max(0,(t-2700)/800)),e=sp<.5?2*sp*sp:1-Math.pow(-2*sp+2,2)/2;
      if(e&&(p.g==='A'||p.g==='B')){const sg=p.g==='A'?1:-1,th2=1.15*e*sg,tz=-.18*e*sg,px=-.02,py=-.12;let dx=X-px,dy=Y-py,dz=Z;
       const x1=dx*Math.cos(th2)+dz*Math.sin(th2),z1=-dx*Math.sin(th2)+dz*Math.cos(th2);const x2=x1*Math.cos(tz)-dy*Math.sin(tz),y2=x1*Math.sin(tz)+dy*Math.cos(tz);
       X=px+x2-.17*e*sg;Y=py+y2-.04*e;Z=z1;}}}
    if(p.swirl){const w=p.swirl,ang=w.a+t*.0016*w.sp;X=Math.cos(ang)*w.rad;Z=Math.sin(ang)*w.rad;Y=w.y+Math.sin(t*.002+w.ph)*.025;}
    if(!p.bill){const x1=X*cs+Z*sn,z1=-X*sn+Z*cs;X=x1;Z=z1;}const y2=Y*ct-Z*st,z2=Y*st+Z*ct,k=f/(f+z2);return {p,sx:cx+X*S*k,sy:cy+y2*S*k,k,z:z2};}).sort((a,b)=>b.z-a.z);
  for(const q of proj){const p=q.p;if(!p.r)continue;const g=Math.min(1,Math.max(0,(t-p.delay)/500)),e=1-Math.pow(1-g,3);if(!e)continue;
   const depth=Math.max(.22,Math.min(1,.7-q.z*1.2)),a=fade*depth*(p.a??1)*(m.flakeBurst&&t>dur-1650?Math.max(0,1-(t-(dur-1650))/280):1)*(m.split&&p.g==='bag'?Math.max(0,1-(t-900)/700):1)*(m.split&&p.bean?Math.min(1,Math.max(0,(t-2900)/500)):1)*(.72+.28*Math.sin(t*.01+p.x*40)),r=p.r*rs*q.k*(.4+.6*e);
   dot(x,q.sx,q.sy,r,p.color,a);dot(x,q.sx,q.sy,r*3,p.color,a*.1);if(p.nose&&!nose)nose=q;}
  if(m.glowNose&&nose&&t>900){const r=S*(.06+.02*Math.sin(t*.012)),g=x.createRadialGradient(nose.sx,nose.sy,0,nose.sx,nose.sy,r);g.addColorStop(0,'#FF0049bb');g.addColorStop(1,'#FF004900');x.globalAlpha=fade;x.fillStyle=g;x.fillRect(nose.sx-r,nose.sy-r,r*2,r*2);}
  if(m.split&&t>3100)for(let k=0;k<4;k++)for(let i=0;i<18;i++){const u=i/18;dot(x,cx+(-.06+k*.04)*S+Math.sin(u*9-t*.006+k)*.022*S,cy-.2*S-u*.26*S,1.6,WHITE,fade*.55*(1-u)*Math.min(1,(t-3100)/500));}
  if(m.steam&&t>800)for(let k=0;k<3;k++)for(let i=0;i<16;i++){const u=i/16;dot(x,cx+(-.08+k*.08)*S+Math.sin(u*9-t*.006+k)*.02*S,cy-.34*S-u*.2*S,1.5,WHITE,fade*.5*(1-u)*Math.min(1,(t-800)/500));}
  if(m.open&&t>1700&&t<2600&&burst.length<160)for(let k=0;k<10;k++){const a=rnd(-Math.PI*.95,-Math.PI*.05),s=rnd(140,360);burst.push({x:cx,y:cy-.05*S,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0,max:rnd(.8,1.4),c:[GOLD,WHITE,ICE,PINK,GREEN][k%5]});}
  if(m.flakeBurst&&t>dur-1700&&!burst.length)for(let k=0;k<110;k++){const a=Math.random()*Math.PI*2,sp=rnd(90,460);burst.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:0,max:rnd(1,1.6),c:k%3?WHITE:'#BFE9FF',flake:rnd(3,7),spin:rnd(-4,4)});}
  for(const b of burst){b.life+=dt;b.vx*=Math.exp(-1.8*dt);b.vy=b.vy*Math.exp(-1.8*dt)+120*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;const ff=Math.max(0,1-b.life/b.max);if(ff&&b.flake){x.globalAlpha=ff;x.strokeStyle=b.c;x.lineWidth=1.1;x.beginPath();for(let i=0;i<3;i++){const an=b.life*b.spin+i*Math.PI/3,dx=Math.cos(an)*b.flake,dy=Math.sin(an)*b.flake;x.moveTo(b.x-dx,b.y-dy);x.lineTo(b.x+dx,b.y+dy);}x.stroke();dot(x,b.x,b.y,b.flake*1.4,b.c,ff*.08);}else if(ff){dot(x,b.x,b.y,1.4+1.4*ff,b.c,ff*fade);dot(x,b.x,b.y,5*ff,b.c,ff*.12*fade);}}
  x.globalAlpha=1;x.globalCompositeOperation='source-over';
  if(t<dur)requestAnimationFrame(frame);else done(c);
 })(start);}

// ---------- drawing ----------
function stage(){const c=document.createElement('canvas'),x=c.getContext('2d'),d=Math.min(devicePixelRatio||1,2);
 c.setAttribute('aria-hidden','true');c.className='egg-stage';Object.assign(c.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',pointerEvents:'none',zIndex:'90'});
 const W=innerWidth,H=innerHeight;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0);document.body.append(c);return {c,x,W,H};}
function dot(x,px,py,r,color,a){x.globalAlpha=Math.max(0,a);x.fillStyle=color;x.beginPath();x.arc(px,py,r,0,Math.PI*2);x.fill();}
// When an effect ends, a word typed during it plays next (it is not dropped).
let running=0;const queue=[];
const done=c=>{c.remove();running=Math.max(0,running-1);if(running)return;busy=false;const q=queue.shift();if(q)setTimeout(()=>celebrate(q.id,{msg:q.msg}),150);else document.body.classList.remove('egg-fx');};

// Sparks fly to the outline points of a picture, glow there (with optional motion), then fade.
function shapeEffect(id,soft,shapes=SHAPES,extras=EXTRA){
 const def=extras[id]||{},{c,x,W,H}=stage(),cx=W/2,cy=H*.5,S=Math.min(H*.66,W*.5),rs=Math.max(.75,S/450),dur=def.duration||2800,base=soft?.7:1,start=performance.now();
 const launch=def.launch==='top'?{x:cx,y:-10}:{x:cx,y:H+10},extra=def.make?.(),snow=def.snow?snowfall(def.snow,def.heavy):null;
 const sparks=shapes[id](false).map(p=>({tx:cx+p.x*S,ty:cy+p.y*S,color:p.color,r:(p.r||1.8)*rs,a:p.a??1,sx:launch.x+(Math.random()-.5)*40,sy:launch.y,delay:Math.random()*260+(p.d||0),tw:Math.random()*6.28}));
 let last=start;
 (function frame(now){const t=now-start,dt=Math.min(.05,(now-last)/1000);last=now;x.clearRect(0,0,W,H);x.globalCompositeOperation='lighter';
  const fade=(t>dur-700?Math.max(0,(dur-t)/700):1)*base,mo=def.motion?.(t,S),o={W,H,cx,cy,S,fade};
  snow?.(x,t,dt,o);extra?.(x,t,dt,o);
  const pvx=cx+(mo?.px||0),pvy=cy+(mo?.py||0);
  for(const s of sparks){const k=Math.min(1,Math.max(0,(t-s.delay)/650)),e=1-Math.pow(1-k,3);let px=s.sx+(s.tx-s.sx)*e,py=s.sy+(s.ty-s.sy)*e;
   if(mo){const ang=(mo.rot||0)*e,dx=px-pvx,dy=py-pvy;px=pvx+dx*Math.cos(ang)-dy*Math.sin(ang)+(mo.dx||0)*e;py=pvy+dx*Math.sin(ang)+dy*Math.cos(ang)+(mo.dy||0)*e;}
   const a=fade*s.a*(.65+.35*Math.sin(t*.012+s.tw));
   dot(x,px,py,s.r*(k<1?.8:1),s.color,a);dot(x,px,py,s.r*3,s.color,a*.12);}
  x.globalAlpha=1;x.globalCompositeOperation='source-over';
  if(t<dur)requestAnimationFrame(frame);else done(c);
 })(start);
}
// Aurora: colorful light curtains (green, mint, sky, violet, pink) waving from the top, spreading far down.
function auroraEffect(soft){
 const {c,x,W,H}=stage(),start=performance.now(),dur=3800,base=soft?.7:1,bands=[[GREEN,0],['#3DF5C8',1.1],[ICE,2.2],['#B58AFF',3.3],['#FF7AD9',4.4]];
 const stars=Array.from({length:50},()=>({x:Math.random()*W,y:Math.random()*H*.6,p:Math.random()*6.28}));
 (function frame(now){const t=now-start;x.clearRect(0,0,W,H);x.globalCompositeOperation='lighter';
  const f=Math.min(1,t/700)*(t>dur-900?Math.max(0,(dur-t)/900):1)*base;
  for(const [col,ph] of bands)for(let px=0;px<=W;px+=7){const top=H*(.03+.09*Math.sin(px*.0032+t*.0011+ph)+.03*Math.sin(px*.011+ph*2)),len=H*(.48+.16*Math.sin(px*.005-t*.0016+ph)),g=x.createLinearGradient(0,top,0,top+len);
   g.addColorStop(0,col+'00');g.addColorStop(.18,col+'55');g.addColorStop(.55,col+'22');g.addColorStop(1,col+'00');x.globalAlpha=f*(.45+.45*Math.sin(px*.017+t*.003+ph));x.fillStyle=g;x.fillRect(px,top,6,len);}
  for(const s of stars)dot(x,s.x,s.y,1,WHITE,f*(.4+.4*Math.sin(t*.006+s.p)));
  x.globalAlpha=1;x.globalCompositeOperation='source-over';
  if(t<dur)requestAnimationFrame(frame);else done(c);
 })(start);
}
function celebrate(id='christmas',{soft=false,msg}={}){
 if(!known(id))return;
 if(reduce()){if(msg)say(...msg);return;}
 // words typed while an effect plays wait in line, in order, and each brings its own message when it starts
 if(busy){if(!soft&&!queue.some(q=>q.id===id))queue.push({id,msg});return;}
 busy=true;running=1;document.body.classList.add('egg-fx');
 if(msg)say(msg[0],msg[1],{delay:500});
 try{MAKE[id]?play3d(id,soft):shapeEffect(id,soft);}catch(err){busy=false;running=0;document.body.classList.remove('egg-fx');throw err;}
}
// Playback: 1–3 short, small pictures at once (side by side), softer than a discovery.
function celebrateGroup(ids){
 if(busy||reduce()||!ids.length)return;busy=true;running=ids.length;document.body.classList.add('egg-fx');
 const n=ids.length,spots=n===1?[.5]:n===2?[.3,.7]:[.2,.5,.8],scale=n===1?.8:n===2?.55:.42;
 const v=$('viewport')?.getBoundingClientRect(),W=innerWidth,H=innerHeight,fx=k=>v&&v.width?(v.left+v.width*k)/W:k,fy=v&&v.height?(v.top+v.height*.45)/H:.5;
 ids.forEach((id,i)=>play3d(id,true,{fx:fx(spots[i]),fy,scale,dur:2600,noSnow:i>0}));
}

// A round sticker of a found picture (used in the collection panel and on the PNG).
function drawSticker(ctx,id,cx,cy,size,shapes){const make=shapes?.[id]||MAKE[id]||SHAPES[id];if(!make)return;
 ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle='#121212';ctx.beginPath();ctx.arc(cx,cy,size/2,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=Math.max(1,size/60);ctx.stroke();
 const S=size*.74;for(const p of make(true)){ctx.globalAlpha=p.a??1;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(cx+p.x*S,cy+p.y*S,Math.max(.6,(p.r||1.8)*S/170),0,Math.PI*2);ctx.fill();}
 ctx.restore();}
// The picture alone (no round badge, no border) — used as small icons when saving the score.
// Sizes are evened out by eye: each picture is scaled from its own drawn bounds (between its longest side and the
// average of width and height), so wide (sleigh, wreath) and tall (tree, snowman) pictures look about the same size.
function drawIcon(ctx,id,cx,cy,size){const make=MAKE[id]||SHAPES[id];if(!make)return;const pts=make(true).filter(p=>p.r!==0);
 let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const p of pts){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y);}
 const w=x1-x0,h=y1-y0,big=Math.max(w,h),vis=(big+Math.sqrt(w*h))/2;let S=size/vis;if(big*S>size*1.2)S=size*1.2/big;const ox=cx-(x0+x1)/2*S,oy=cy-(y0+y1)/2*S;
 ctx.save();ctx.globalCompositeOperation='source-over';for(const p of pts){ctx.globalAlpha=p.a??1;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(ox+p.x*S,oy+p.y*S,Math.max(.45,(p.r||1.8)*S/190),0,Math.PI*2);ctx.fill();}ctx.restore();}
// PNG: stickers of the score's found pictures at the top right of page 1 (2x canvas, 1588 wide).
function stamp(ctx,s){if(!stickerOn())return;const ids=scoreEggs(s);if(!ids.length)return;const size=108,gap=12,per=5,right=1480;
 ids.forEach((id,i)=>{const row=Math.floor(i/per),col=i%per,n=Math.min(per,ids.length-row*per);drawSticker(ctx,id,right-(n-1-col)*(size+gap)-size/2,70+size/2+row*(size+gap),size);});}

// ---------- message (centered, translucent like the other windows) ----------
function say(a,b,{ms=4200,delay=0}={}){
 clearTimeout(say.t);clearTimeout(say.d);
 say.d=setTimeout(()=>{let m=$('winter-msg');if(!m){m=document.createElement('div');m.id='winter-msg';m.setAttribute('role','status');m.setAttribute('aria-live','polite');document.body.append(m);}
  m.innerHTML=`<strong>${esc(a)}</strong>${b?`<span>${esc(b)}</span>`:''}`;const v=$('viewport')?.getBoundingClientRect();m.style.left=(v&&v.width?v.left+v.width/2:innerWidth/2)+'px';
  m.classList.remove('show');void m.offsetWidth;m.classList.add('show');say.t=setTimeout(()=>m.classList.remove('show'),ms);},delay);}

// ---------- discovery, collection ----------
function discover(egg){
 const col=collection(),isNew=!col.includes(egg.id);if(isNew){col.push(egg.id);put(COL_KEY,JSON.stringify(col));}
 const s=window.Jam?.state,shared=document.body.classList.contains('shared-view');let added=false;
 if(s&&!shared){if(!Array.isArray(s.eggs))s.eggs=[];if(!s.eggs.includes(egg.id)){s.eggs.push(egg.id);added=true;}}
 const tip=added?(stickerOn()?'저장하면 악보와 함께 그려져요':'재생할 때 줄마다 나타나요'):'';
 const msg=isNew?[col.length===EGGS.length?`🎉 겨울을 모두 찾았어요! (${col.length}/${EGGS.length})`:`❄ 겨울을 하나 발견했어요! — ${egg.name} (${col.length}/${EGGS.length})`,tip]:added?[`❄ ${egg.name} — 이 악보에도 담겼어요`,tip]:null;
 celebrate(egg.id,{msg});
 updateChip();
}
function updateChip(){const b=$('egg-chip');if(b)b.innerHTML=`<span><svg class="egg-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5M3.6 10.4l3.4-.9-.9-3.4M20.4 13.6l-3.4.9.9 3.4M3.6 13.6l3.4.9-.9 3.4M20.4 10.4l-3.4-.9.9-3.4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>발견한 겨울</span><b>${collection().length}/${EGGS.length}</b>`;if(board&&!board.hidden)fillBoard();}
let board;
function toggleBoard(){
 if(!board){board=document.createElement('div');board.id='egg-board';board.setAttribute('role','dialog');board.setAttribute('aria-label','발견한 겨울');board.hidden=true;document.body.append(board);
  document.addEventListener('pointerdown',e=>{if(!board.hidden&&!e.target.closest('#egg-board,#egg-chip'))board.hidden=true;});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!board.hidden)board.hidden=true;},true);}
 board.hidden=!board.hidden;if(!board.hidden)fillBoard();
}
function fillBoard(){const col=collection(),mine=scoreEggs();
 board.innerHTML=`<h3>발견한 겨울 <b>${col.length}/${EGGS.length}</b></h3><div class="egg-grid">${EGGS.map(g=>col.includes(g.id)?`<div class="egg-cell${mine.includes(g.id)?' in-score':''}"><canvas data-egg="${g.id}" width="92" height="92"></canvas><span>${g.name}</span></div>`:'<div class="egg-cell"><i class="q">?</i><span>?</span></div>').join('')}</div>`+
  (mine.length?'':'<p class="egg-note">연주하다가 겨울 단어를 찾아보세요.</p>');
 board.querySelectorAll('canvas[data-egg]').forEach(cv=>drawSticker(cv.getContext('2d'),cv.dataset.egg,46,46,88));
 const r=$('egg-chip')?.getBoundingClientRect();if(r){board.style.left=Math.max(12,Math.min(innerWidth-board.offsetWidth-12,r.right-board.offsetWidth))+'px';board.style.top=r.bottom+8+'px';}
}
// The chip sits just under the work header on the right, its edge lined up with the Reset label (same side margin).
function placeChip(){const b=$('egg-chip'),w=document.querySelector('.workspace-header');if(!b||!w)return;if(matchMedia('(max-width:600px)').matches){
 const header=document.querySelector('.global-end');
 if(b.parentElement!==header)header.prepend(b);
 b.style.visibility='';
 return;
}
if(b.parentElement!==document.body)document.body.append(b);
const r=w.getBoundingClientRect();if(!r.width){b.style.visibility='hidden';return;}b.style.visibility='';b.style.top=r.bottom+10+'px';const rs=$('reset')?.getBoundingClientRect(),edge=rs&&rs.width?rs.right-10:r.right-18;b.style.right=Math.max(8,innerWidth-edge)+'px';}
function buildChip(){if($('egg-chip')||!document.querySelector('.workspace-header'))return;const b=document.createElement('button');b.type='button';b.id='egg-chip';b.className='egg-chip';b.setAttribute('aria-haspopup','dialog');document.body.append(b);b.onclick=()=>toggleBoard();updateChip();placeChip();addEventListener('resize',placeChip);setInterval(placeChip,600);}
buildChip();

// ---------- playback & shared links ----------
// While playing, the score's found pictures appear each time the playhead reaches a new line (short 2.6s version).
// If fewer lines are left than pictures still to show in this pass, 2–3 small ones appear side by side so every
// picture shows at least once; with Loop on, the next round carries on in order.
let wasPlaying=false,lastRow=-1,turn=0,shown=0;
setInterval(()=>{const playing=$('play')?.textContent==='Ⅱ';
 if(!playing){wasPlaying=false;lastRow=-1;return;}
 const row=Number(document.querySelector('.playhead')?.parentElement?.dataset.row??-1);
 if(!wasPlaying){wasPlaying=true;shown=0;}
 if(row<0||row===lastRow)return;
 if(row<lastRow)shown=0;lastRow=row;
 const eggs=scoreEggs(),notes=window.Jam?.state?.notes||[];if(!eggs.length||reduce()||busy)return;
 const last=notes.reduce((r,n)=>Math.max(r,n.row),0),linesLeft=Math.max(1,last-row+1),toShow=Math.max(0,eggs.length-shown);
 const per=Math.max(1,Math.min(3,Math.ceil(toShow/linesLeft),eggs.length));
 const ids=[];for(let k=0;k<per;k++)ids.push(eggs[(turn+k)%eggs.length]);
 turn+=per;shown+=per;celebrateGroup(ids);
},200);
// A shared link that carries found pictures says so when it opens.
setTimeout(()=>{if(!document.body.classList.contains('shared-view'))return;const eggs=scoreEggs();if(eggs.length)say(`❄ 친구가 발견한 겨울 ${eggs.length}개가 숨어 있어요`,`${eggs.map(nameOf).join(' · ')} — ▶를 눌러 감상해 보세요`,{ms:5200});},1200);

window.JamEaster={celebrate,stamp,drawSticker,drawIcon,say,eggs:EGGS,
 // for the review page (자료/이스터에그_시안.html): reuse the drawing helpers with new trial shapes
 lab:{P,seg,quad,ell,fillEll,rect,mirror,place,textPts,snowfall,dot,stage,shapeEffect:(id,shapes,extras)=>{if(busy)return;busy=true;shapeEffect(id,false,shapes,extras);},drawSticker,SHAPES,EXTRA,colors:{RED,GOLD,GREEN,WHITE,SKIN,PINK,ORANGE,ICE,BROWN}}};
})();
