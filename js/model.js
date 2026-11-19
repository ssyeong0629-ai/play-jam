'use strict';
(()=>{
const W=794,H=1123,GAP=24,BEATS=8,MAX=63;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const pageOf=r=>r<7?0:1+Math.floor((r-7)/8),start=p=>p?7+(p-1)*8:0,count=p=>p?8:7;
const top=r=>{const p=pageOf(r);return (p?68:155)+(r-start(p))*(p?120:126);};
const yOf=y=>18+y*6.5,xOf=x=>22+x*642;
const fresh=()=>({version:3,title:'Untitled',artist:'',date:new Date().toISOString().slice(0,10),bpm:100,density:50,theme:'dark',visualTheme:'instrument',loop:false,partGroup:0,partCursors:{},notes:[]});
function validate(raw){if(!raw||raw.version!==3||!Array.isArray(raw.notes)||raw.notes.length>5000)throw Error('지원하지 않는 작품 데이터예요.');const s=fresh();for(const k of ['title','artist','date'])s[k]=String(raw[k]??s[k]).slice(0,80);s.bpm=clamp(Number(raw.bpm)||100,40,220);s.density=clamp(Number(raw.density)||0,0,100);s.pitchMode=raw.pitchMode==='fixed'?'fixed':'harmony';s.theme='dark';s.loop=!!raw.loop;s.visualTheme=['instrument','note','circle','mixed'].includes(raw.visualTheme)?raw.visualTheme:'instrument';s.soundTheme=['band','carol','beatbox'].includes(raw.soundTheme)?raw.soundTheme:'band';const ids=new Set();s.notes=raw.notes.filter(n=>JAM_ICONS.some(i=>i.id===n.icon)&&Number.isFinite(n.x)&&Number.isFinite(n.y)&&Number.isInteger(n.row)&&n.row>=0&&n.row<MAX).map((n,i)=>{let id=String(n.id||'n'+i).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80)||'n'+i;if(ids.has(id))id='n'+i+'-'+id;ids.add(id);return {id,icon:n.icon,row:n.row,x:clamp(n.x,0,1),y:clamp(Math.round(n.y),0,12),...(['hat','kick'].includes(n.percussion)?{percussion:n.percussion,partGroup:Number.isInteger(n.partGroup)&&n.partGroup>=0&&n.partGroup<12?n.partGroup:0}:{}),...((window.JamVoicePools||[]).flat().includes(n.voice)?{voice:n.voice}:{}),...(Number.isInteger(n.keyY)&&n.keyY>=0&&n.keyY<=12?{keyY:n.keyY}:{}),...(n.accent===true?{accent:true}:{})};});s.partGroup=Number.isInteger(raw.partGroup)&&raw.partGroup>=0&&raw.partGroup<12?raw.partGroup:0;s.partCursors={};for(let g=0;g<12;g++){const c=raw.partCursors?.[g];if(c&&Number.isInteger(c.row)&&Number.isFinite(c.x)&&Number.isFinite(c.y))s.partCursors[g]={row:clamp(c.row,0,MAX-1),x:clamp(c.x,0,31/32),y:clamp(c.y,0,12)};}const harmony=JamHarmony.validate(raw.harmony);if(harmony)s.harmony=harmony;return s;}
function pages(s){const last=s.notes.reduce((r,n)=>Math.max(r,n.row),0);return pageOf(last)+1;}
function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;}
function decorations(s,row){const notes=s.notes.filter(n=>n.row===row).sort((a,b)=>a.x-b.x),links=[],marks=[];const density=s.density/100;
 for(let i=0;i<notes.length;i++){const a=notes[i],b=notes[i+1];if(b){const d=Math.hypot(xOf(a.x)-xOf(b.x),yOf(a.y)-yOf(b.y));if(d>26&&d<70+130*density&&hash(a.id+b.id)<density){const ax=xOf(a.x),ay=yOf(a.y),bx=xOf(b.x),by=yOf(b.y),dx=bx-ax,dy=by-ay;const sx=ax+dx/d*10,sy=ay+dy/d*10,ex=bx-dx/d*10,ey=by-dy/d*10;const style=Math.floor(hash(a.id+':line:'+b.id)*5);
 const dash=['none','1 4','5 4','none','none'][style];
 let path=`M${sx} ${sy} L${ex} ${ey}`;
 if(style===3)path=`M${sx} ${sy} Q${(sx+ex)/2} ${(sy+ey)/2-12*density} ${ex} ${ey}`;
 if(style===4){
  const steps=Math.max(4,Math.ceil(d/7));
  path=`M${sx} ${sy}`;
  for(let k=1;k<steps;k++){
   const t=k/steps,jitter=(k%2?1:-1)*2.5;
   path+=` L${sx+(ex-sx)*t-jitter*dy/d} ${sy+(ey-sy)*t+jitter*dx/d}`;
  }
  path+=` L${ex} ${ey}`;
 }
 links.push({a:a.id,b:b.id,color:JAM_ICONS.find(i=>i.id===a.icon).color,d:path,dash});}}
 for(let k=0;k<8;k++){if(hash(a.id+':show:'+k)>density*.92)continue;const angle=hash(a.id+':angle:'+k)*Math.PI*2,dist=25+hash(a.id+':dist:'+k)*20,x=xOf(a.x)+Math.cos(angle)*dist,y=yOf(a.y)+Math.sin(angle)*dist;if(x<12||x>680||y<5||y>108||notes.some(n=>Math.hypot(xOf(n.x)-x,yOf(n.y)-y)<15)||marks.some(m=>Math.hypot(m.x-x,m.y-y)<9))continue;marks.push({x,y,type:Math.floor(hash(a.id+':type:'+k)*6),color:JAM_ICONS.find(i=>i.id===a.icon).color});}}
 return {links,marks};}
function move(notes,ids,dx,dy,dr){const chosen=notes.filter(n=>ids.has(n.id));if(!chosen.length)return;dx=clamp(dx,-Math.min(...chosen.map(n=>n.x)),1-Math.max(...chosen.map(n=>n.x)));dy=clamp(dy,-Math.min(...chosen.map(n=>n.y)),12-Math.max(...chosen.map(n=>n.y)));dr=clamp(dr,-Math.min(...chosen.map(n=>n.row)),MAX-1-Math.max(...chosen.map(n=>n.row)));const other=notes.filter(n=>!ids.has(n.id));if(chosen.some(n=>other.some(o=>o.row===n.row+dr&&Math.hypot((o.x-n.x-dx)*642,(o.y-n.y-dy)*6.5)<26)))return;chosen.forEach(n=>{n.x+=dx;n.y+=dy;n.row+=dr;});}
window.JamModel={W,H,GAP,BEATS,MAX,clamp,pageOf,start,count,top,yOf,xOf,fresh,validate,pages,hash,decorations,move};
})();
