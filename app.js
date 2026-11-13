'use strict';
(() => {
 const $=id=>document.getElementById(id),data=window.COURSE_DATA;
 if(!data||!Array.isArray(data.lessons)||!data.lessons.length){$('lesson-title').textContent='教材暫時無法載入，請重新整理頁面。';return;}
 const lessons=data.lessons;let current=null,filtered=[];
 const element=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
 function markup(text,root){
  // Original reviewed lesson notation: fractions, radical scope, repeating digits, and emphasis.
  const stack=[root],top=()=>stack[stack.length-1];
  const appendText=ch=>{const last=top().lastChild;if(last&&last.nodeType===Node.TEXT_NODE)last.textContent+=ch;else top().append(document.createTextNode(ch));};
  const open=(cls,key)=>{const span=element('span',cls);span.dataset.key=key;top().append(span);stack.push(span);};
  for(let i=0;i<text.length;i++){
   const ch=text[i];
   if(ch==='|'){top().append(document.createElement('br'));continue;}
   if(['~','^','$','&','%'].includes(ch)){
    const key={'~':'overline','^':'bold','$':'radical','&':'option','%':'heading'}[ch];
    if(top().dataset.key===key)stack.pop();else open(key,key);
   }else if(ch==='['||ch==='<')open(ch==='['?'emphasis':'answer-ink','emphasis');
   else if(ch===']'||ch==='>'){if(stack.length>1)stack.pop();}
   else if(ch==='{'){
    const j=text.indexOf('}',i),parts=j>=0?text.slice(i+1,j).split('/'):[];
    if(parts.length===2){const f=element('span','fraction'),n=element('span','numerator'),d=element('span','denominator');markup(parts[0],n);markup(parts[1],d);f.append(n,d);top().append(f);i=j;}else appendText(ch);
   }else appendText(ch);
  }
 }
 const unique=items=>[...new Set(items)];
 for(const n of unique(lessons.map(l=>l.paperSet)).sort())$('paper').append(new Option('考卷第'+n+'份',String(n)));
 for(const cat of unique(lessons.map(l=>l.category)))$('category').append(new Option(cat,cat));
 $('paper').value=String(lessons[0].paperSet);$('total-count').textContent=lessons.length+' 題・'+lessons.filter(l=>l.youtubeId).length+' 支影片';
 function normalize(s){return String(s).normalize('NFKC').toLowerCase().replaceAll(' ','');}
 function refreshList(){
  const search=normalize($('search').value);
  filtered=lessons.filter(l=>String(l.paperSet)===$('paper').value&&(!$('category').value||l.category===$('category').value)&&(!search||normalize([l.topic,l.category,'第'+l.number+'題',...l.tags].join(' ')).includes(search)));
  $('question-list').replaceChildren();$('results-count').textContent='找到 '+filtered.length+' 題';$('empty').hidden=filtered.length>0;
  for(const l of filtered){const b=element('button','question-button');b.type='button';b.dataset.lesson=l.id;b.setAttribute('aria-label','第'+l.number+'題 '+l.topic+' '+l.category);b.append(element('span','q-number',String(l.number).padStart(2,'0')));const body=element('span','q-info');body.append(element('strong','',l.topic),element('small','',l.category));b.append(body,element('span','q-arrow','›'));b.addEventListener('click',()=>choose(l.id,true));$('question-list').append(b);}
  markSelected();
 }
 function markSelected(){for(const b of $('question-list').children){const active=b.dataset.lesson===current?.id;b.classList.toggle('selected',active);if(active)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');}}
 function choose(id,scroll=false){
  const l=lessons.find(l=>l.id===id);if(!l)return;current=l;
  $('lesson-category').textContent=l.category;$('lesson-number').textContent='考卷第'+l.paperSet+'份・第'+l.number+'題';$('lesson-title').textContent=l.topic;
  $('question').replaceChildren();markup(l.question,$('question'));$('answer').replaceChildren();markup(String(l.answer),$('answer'));
  $('solution').open=false;$('solution-steps').replaceChildren();
  let section=0;
  l.steps.forEach((step,i)=>{
   if(i===0||step.newSection){section++;const h=element('h3','step-heading',i===0?'從觀念開始':'接著往下解・'+section);$('solution-steps').append(h);}
   const row=element('section','step');row.append(element('span','step-number',String(i+1).padStart(2,'0')));const body=element('div','step-body'),formula=element('div','formula math');markup(step.formula,formula);body.append(formula,element('p','explanation',step.explanation));row.append(body);$('solution-steps').append(row);
  });
  const figure=element('figure','solution-figure'),img=document.createElement('img');img.src=l.figure;img.alt=l.topic+'的解題圖，對照上方逐步詳解';img.width=330;img.height=350;figure.append(img,element('figcaption','',l.topic+'・解題圖'));$('solution-steps').append(figure);
  const seconds=Math.round(l.durationSeconds),min=Math.floor(seconds/60),sec=seconds%60;$('duration').textContent=min+'分'+String(sec).padStart(2,'0')+'秒';
  $('video-slot').replaceChildren();$('youtube-link').hidden=true;
  if(l.youtubeId){const frame=document.createElement('iframe');frame.title=l.title;frame.src='https://www.youtube-nocookie.com/embed/'+l.youtubeId;frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';frame.allowFullscreen=true;frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';$('video-slot').append(frame);$('youtube-link').href='https://www.youtube.com/watch?v='+l.youtubeId;$('youtube-link').hidden=false;}
  else{const placeholder=element('div','video-pending');placeholder.append(element('span','pending-icon','▶'),element('strong','','本題影片尚未上架'),element('p','','目前可先閱讀題目與完整詳解。影片上架後，這裡會顯示播放器與 YouTube 連結。'));$('video-slot').append(placeholder);}
  const i=lessons.indexOf(l);$('previous').disabled=i===0;$('next').disabled=i===lessons.length-1;
  $('action-message').textContent='';document.title=l.topic+'｜考卷第'+l.paperSet+'份第'+l.number+'題｜解題阿福';
  if(location.hash!=='#'+l.id)history.replaceState(null,'','#'+l.id);markSelected();
  if(scroll){$('lesson').scrollIntoView({behavior:'smooth',block:'start'});$('lesson').focus({preventScroll:true});}
 }
 function changeFilter(){refreshList();if(filtered.length&&!filtered.includes(current))choose(filtered[0].id);}
 $('paper').addEventListener('change',changeFilter);$('category').addEventListener('change',changeFilter);$('search').addEventListener('input',refreshList);$('clear-search').addEventListener('click',()=>{$('search').value='';refreshList();$('search').focus();});
 $('show-solution').addEventListener('click',()=>{$('solution').open=true;$('solution').scrollIntoView({behavior:'smooth',block:'start'});});
 $('show-video').addEventListener('click',()=>$('video-section').scrollIntoView({behavior:'smooth',block:'start'}));
 function move(delta){const i=lessons.indexOf(current),next=lessons[i+delta];if(next){$('paper').value=String(next.paperSet);$('category').value='';$('search').value='';refreshList();choose(next.id,true);}}
 $('previous').addEventListener('click',()=>move(-1));$('next').addEventListener('click',()=>move(1));
 $('copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);$('action-message').textContent='已複製本題連結。';}catch{$('action-message').textContent='請複製瀏覽器網址列，即可分享本題。';}});
 $('print').addEventListener('click',()=>{$('solution').open=true;window.print();});
 window.addEventListener('hashchange',()=>{const found=lessons.find(l=>l.id===location.hash.slice(1));if(found){$('paper').value=String(found.paperSet);$('category').value='';$('search').value='';refreshList();choose(found.id);}});
 const initial=lessons.find(l=>l.id===location.hash.slice(1))||lessons[0];$('paper').value=String(initial.paperSet);refreshList();choose(initial.id);
})();
