'use strict';
// Save window (초안10): the ⬇ button opens a preview of page 1 with options, then saves.
//  - format: PNG (one image per page) or PDF (one file with every page)
//  - "발견한 겨울과 함께 저장": the score's found winter pictures as small icons (picture only, no badge),
//    either between the staves like lyrics (under notes, spread over the lines that have notes) or in a row at the very bottom
//    of the last page (only offered when this score has found pictures)
// Choices are remembered in this browser. The PDF is built here from JPEG page images (no library).
(()=>{
const $=id=>document.getElementById(id);
const KEY='playjam.save.options',STICKER_KEY='playjam.eggs.sticker';
const get=k=>{try{return localStorage.getItem(k);}catch{return null;}},put=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
let opts={format:'png',place:'lyrics'};try{Object.assign(opts,JSON.parse(get(KEY)||'{}'));}catch{}if(opts.place!=='bottom')opts.place='lyrics';
const withEggs=()=>get(STICKER_KEY)!=='0';
const eggsOf=()=>{const s=window.Jam?.state,ids=(window.JamEaster?.eggs||[]).map(e=>e.id);return Array.isArray(s?.eggs)?ids.filter(id=>s.eggs.includes(id)):[];};
const pageCount=()=>window.JamModel.pages(window.Jam.state);

// one page → canvas (1588×2246, 2× A4 at 794×1123)
async function renderPage(p,eggs){
 const url=URL.createObjectURL(new Blob([window.Jam.svgPage(p)],{type:'image/svg+xml'}));
 try{const im=new Image();im.src=url;await im.decode();const c=document.createElement('canvas');c.width=1588;c.height=2246;const g=c.getContext('2d');g.drawImage(im,0,0,1588,2246);
  if(eggs)drawEggs(g,p,opts.place);return c;}finally{URL.revokeObjectURL(url);}}
// Where each icon goes (page coordinates ×2 on the 1588-wide canvas).
//  lyrics: spread over the lines that have notes; each icon sits under a note of its line, in the gap below the staff
//  bottom: one row at the bottom of the last page, left-aligned with the title, above the footer text
function eggSpots(){const ids=eggsOf(),s=window.Jam.state,M=window.JamModel,out=[];if(!ids.length)return out;
 if(opts.place==='bottom'){const last=M.pages(s)-1;ids.forEach((id,i)=>out.push({id,page:last,x:(54+11+i*30)*2,y:1052*2}));return out;}
 const rows=[...new Set(s.notes.map(n=>n.row))].sort((a,b)=>a-b);
 ids.forEach((id,i)=>{const r=rows[Math.min(rows.length-1,Math.floor(i*rows.length/ids.length))],same=ids.filter((_,k)=>rows[Math.min(rows.length-1,Math.floor(k*rows.length/ids.length))]===r),j=same.indexOf(id);
  const notes=s.notes.filter(n=>n.row===r).sort((a,b)=>a.x-b.x),n=notes[Math.min(notes.length-1,Math.floor((j+.5)*notes.length/same.length))];
  out.push({id,page:M.pageOf(r),x:(54+M.xOf(n?n.x:.5))*2,y:(M.top(r)+M.yOf(10)+16)*2});});return out;}
// Lyric icons stay no bigger than the score's note symbols (notes are drawn about 17 of their 26-unit box → 15 units); the bottom row is a little larger.
function drawEggs(g,p,place){if(!window.JamEaster)return;const size=(place==='bottom'?22:15)*2;for(const e of eggSpots())if(e.page===p)window.JamEaster.drawIcon(g,e.id,e.x,e.y,size);}

// minimal PDF: each page is a full-page JPEG image on an A4 page
function makePDF(pages){
 const enc=new TextEncoder(),parts=[],offs=[];let len=0;const push=x=>{const b=typeof x==='string'?enc.encode(x):x;parts.push(b);len+=b.length;};
 const obj=(id,fn)=>{offs[id]=len;push(`${id} 0 obj\n`);fn();push('\nendobj\n');};
 const PW=595.28,PH=841.89,n=pages.length;push('%PDF-1.4\n');
 obj(1,()=>push('<< /Type /Catalog /Pages 2 0 R >>'));
 obj(2,()=>push(`<< /Type /Pages /Kids [${pages.map((_,i)=>`${3+3*i} 0 R`).join(' ')}] /Count ${n} >>`));
 pages.forEach((pg,i)=>{const P=3+3*i,I=P+1,C=P+2,draw=`q ${PW} 0 0 ${PH} 0 0 cm /Im${i} Do Q`;
  obj(P,()=>push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im${i} ${I} 0 R >> >> /Contents ${C} 0 R >>`));
  obj(I,()=>{push(`<< /Type /XObject /Subtype /Image /Width ${pg.w} /Height ${pg.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.bytes.length} >>\nstream\n`);push(pg.bytes);push('\nendstream');});
  obj(C,()=>push(`<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`));});
 const xref=len,total=3+3*n;push(`xref\n0 ${total}\n0000000000 65535 f \n`);for(let id=1;id<total;id++)push(String(offs[id]).padStart(10,'0')+' 00000 n \n');
 push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);return new Blob(parts,{type:'application/pdf'});}
const download=(blob,name)=>{const a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),30000);};
const toast=msg=>{const t=$('toast');if(!t)return;t.textContent=msg;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,3500);};

// ---------- the window ----------
let dlg,view=0;
function build(){
 dlg=document.createElement('dialog');dlg.id='save-dialog';dlg.setAttribute('aria-labelledby','save-title');
 dlg.innerHTML=`<header><h2 id="save-title">악보 저장</h2><button type="button" class="save-x" aria-label="닫기">×</button></header>
 <div class="save-body"><div class="save-preview"><canvas width="397" height="562" aria-label="미리보기"></canvas><div class="save-nav"><button type="button" class="save-prev" aria-label="이전 페이지">‹</button><small class="save-pages"></small><button type="button" class="save-next" aria-label="다음 페이지">›</button></div></div>
 <div class="save-options">
  <fieldset><legend>형식</legend>
   <label><input type="radio" name="save-format" value="png"> PNG</label>
   <label><input type="radio" name="save-format" value="pdf"> PDF</label></fieldset>
  <fieldset class="save-eggs"><legend>발견한 겨울</legend>
   <label><input type="checkbox" id="save-with-eggs"> 발견한 겨울과 함께 저장</label>
   <div class="save-place"><label><input type="radio" name="save-place" value="lyrics"> 음표 아래</label><label><input type="radio" name="save-place" value="bottom"> 페이지 아래</label></div>
   <p class="save-none">이 악보에서 발견한 겨울이 아직 없어요.<br>연주하다가 겨울 단어를 찾아보세요.</p></fieldset>
 </div></div>
 <footer><button type="button" class="save-cancel">취소</button><button type="button" class="save-go primary">저장</button></footer>`;
 document.body.append(dlg);
 dlg.querySelector('.save-x').onclick=dlg.querySelector('.save-cancel').onclick=()=>dlg.close();
 dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});
 dlg.addEventListener('change',e=>{const t=e.target;if(t.name==='save-format')opts.format=t.value;if(t.name==='save-place'){opts.place=t.value;const e=eggSpots()[0];if(e)view=e.page;}if(t.id==='save-with-eggs')put(STICKER_KEY,t.checked?'1':'0');put(KEY,JSON.stringify(opts));sync();preview();});
 dlg.querySelector('.save-go').onclick=save;
 dlg.querySelector('.save-prev').onclick=()=>{view=Math.max(0,view-1);sync();preview();};dlg.querySelector('.save-next').onclick=()=>{view=Math.min(pageCount()-1,view+1);sync();preview();};
}
function sync(){const has=eggsOf().length>0,on=has&&withEggs();
 dlg.querySelector(`[name=save-format][value=${opts.format}]`).checked=true;dlg.querySelector(`[name=save-place][value=${opts.place}]`).checked=true;
 const box=$('save-with-eggs');box.checked=on;box.disabled=!has;dlg.querySelector('.save-place').classList.toggle('off',!on);dlg.querySelectorAll('[name=save-place]').forEach(r=>r.disabled=!on);
 dlg.querySelector('.save-none').hidden=has;const n=pageCount();view=Math.min(view,n-1);dlg.querySelector('.save-pages').textContent=n>1?`${view+1} / ${n}페이지`:'1페이지';dlg.querySelector('.save-prev').hidden=dlg.querySelector('.save-next').hidden=n<2;dlg.querySelector('.save-prev').disabled=view===0;dlg.querySelector('.save-next').disabled=view===n-1;
 dlg.querySelector('.save-go').textContent=opts.format==='pdf'?'PDF 저장':(n>1?`PNG ${n}장 저장`:'PNG 저장');}
async function preview(){const cv=dlg.querySelector('.save-preview canvas'),g=cv.getContext('2d'),token=preview.t=(preview.t||0)+1;
 const page=await renderPage(view,eggsOf().length>0&&withEggs());if(token!==preview.t)return;g.clearRect(0,0,cv.width,cv.height);g.drawImage(page,0,0,cv.width,cv.height);}
async function save(){const go=dlg.querySelector('.save-go');go.disabled=true;const eggs=eggsOf().length>0&&withEggs(),n=pageCount();
 try{if(opts.format==='pdf'){const pages=[];for(let p=0;p<n;p++){const c=await renderPage(p,eggs),u=c.toDataURL('image/jpeg',.92),b=atob(u.split(',')[1]),bytes=new Uint8Array(b.length);for(let i=0;i<b.length;i++)bytes[i]=b.charCodeAt(i);pages.push({bytes,w:c.width,h:c.height});}
   download(makePDF(pages),'PLAY-JAM.pdf');toast(n>1?`PDF 한 파일(${n}페이지)로 저장했어요.`:'PDF로 저장했어요.');}
  else{for(let p=0;p<n;p++){const c=await renderPage(p,eggs),blob=await new Promise(r=>c.toBlob(r,'image/png'));if(!blob)throw Error();download(blob,`PLAY-JAM-${p+1}.png`);if(n>1)await new Promise(r=>setTimeout(r,350));}
   if(n>1)toast(`악보 이미지 ${n}장을 저장했어요.`);}
  dlg.close();}catch{toast('저장하지 못했어요.');}finally{go.disabled=false;}}
function open(){if(!window.Jam?.state?.notes?.length){toast('아이콘을 먼저 배치하세요.');return;}if(!dlg)build();view=0;sync();dlg.showModal();preview();}
window.JamSave={open,renderPage,makePDF};
})();
