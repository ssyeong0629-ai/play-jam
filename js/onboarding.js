'use strict';
(()=>{
const $=id=>document.getElementById(id);
const welcome=document.createElement('dialog');welcome.className='welcome';welcome.setAttribute('aria-label','PLAY JAM 시작');
welcome.innerHTML=`<div class="welcome-copy"><span class="welcome-label">PLAY JAM</span><h1>모양을 놓고,<br>나만의 합주를 그려요.</h1><p>기호를 자유롭게 조합해 만드는 그래픽 악보.<br>기타, 베이스, 드럼의 소리를 더해 작품을 완성하세요.</p><button class="start-jam">START ↗</button><button class="skip-jam">바로 시작하기</button></div><div class="welcome-art" aria-hidden="true"><span>YOUR SHAPES. YOUR JAM.</span><div class="demo-score"></div><small>PLAY JAM · GRAPHIC SCORE</small></div>`;
document.body.append(welcome);
const score=welcome.querySelector('.demo-score');[1,10,12,4,7,18,13,20,5,11,14,19].forEach((id,i)=>{const shape=document.createElement('i');shape.innerHTML=Jam.art(id);shape.style.setProperty('--delay',`${i*.15}s`);shape.style.setProperty('--turn',`${i%3*12-12}deg`);score.append(shape);});
const tour=document.createElement('dialog');tour.className='tour-card';tour.setAttribute('aria-labelledby','tour-title');tour.innerHTML='<div class="tour-progress"></div><h2 id="tour-title"></h2><p></p><div class="tour-actions"><button class="tour-skip">건너뛰기</button><button class="tour-back">이전</button><button class="tour-next">다음 →</button></div>';document.body.append(tour);
const steps=[['palette-panel','기호 선택하기','원하는 그래픽 기호를 골라보세요. 각 기호에 밴드 악기의 소리가 담겨 있어요.'],['viewport','자유롭게 배치하기','악보를 눌러 기호를 놓고, 드래그해 옮기세요. 선택한 기호의 손잡이로 크기와 각도를 바꿀 수 있어요.'],['play','밴드 합주 들어보기','재생하면 기호와 연결선이 빛나며 합주가 시작돼요. Space로 재생하거나 멈출 수 있어요.'],['share','작품 저장·공유하기','Export에서 이미지를 저장하거나, 다시 재생할 수 있는 작품 링크를 공유하세요.']];
let step=0,previousFocus;
function clear(){document.querySelectorAll('.tour-focus').forEach(el=>el.classList.remove('tour-focus'));}
function show(){clear();const [id,title,description]=steps[step];$(id).classList.add('tour-focus');tour.querySelector('.tour-progress').textContent=`${step+1} / ${steps.length}`;tour.querySelector('h2').textContent=title;tour.querySelector('p').textContent=description;tour.querySelector('.tour-back').disabled=step===0;tour.querySelector('.tour-next').textContent=step===3?'만들기 시작':'다음 →';}
function finish(){clear();tour.close();(previousFocus||$('poster')).focus({preventScroll:true});}
function startTour(){previousFocus=document.activeElement;Jam.pause();step=0;document.body.classList.remove('palette-closed','palette-minimized');show();tour.showModal();}
welcome.querySelector('.start-jam').onclick=()=>{welcome.close();startTour();};welcome.querySelector('.skip-jam').onclick=()=>{welcome.close();$('poster').focus();};welcome.addEventListener('cancel',()=>{$('poster').focus();});
tour.querySelector('.tour-skip').onclick=finish;tour.querySelector('.tour-back').onclick=()=>{if(step>0){step--;show();}};tour.querySelector('.tour-next').onclick=()=>{if(step===3)finish();else{step++;show();}};tour.addEventListener('cancel',clear);
const help=document.createElement('button');help.textContent='사용법';help.title='사용법 다시 보기';help.onclick=startTour;document.querySelector('.top-end').prepend(help);
// Shared scores open directly so recipients can immediately play the artwork.
if(!location.hash.startsWith('#jam='))welcome.showModal();
})();
