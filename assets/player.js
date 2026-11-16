(function(){
'use strict';
var P=new URLSearchParams(location.search);
var B=+P.get('b'),T=+P.get('t'),S=(P.get('s')||'reading').toLowerCase();
var pad=function(n){return (n<10?'0':'')+n;};
var ICON={
 wifi:'<svg viewBox="0 0 24 24"><path d="M12 18.5a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2zm-4.3-3a6.1 6.1 0 0 1 8.6 0l-1.4 1.4a4.1 4.1 0 0 0-5.8 0zm-2.9-2.9a10.2 10.2 0 0 1 14.4 0l-1.4 1.4a8.2 8.2 0 0 0-11.6 0zM1.9 9.7a14.3 14.3 0 0 1 20.2 0l-1.4 1.4a12.3 12.3 0 0 0-17.4 0z"/></svg>',
 bell:'<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.8"><path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z"/><path d="M10 21h4"/></svg>',
 menu:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="2.6"/><rect x="3" y="10.7" width="18" height="2.6"/><rect x="3" y="16.4" width="18" height="2.6"/></svg>',
 note:'<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.8"><path d="M14 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8"/><path d="M18.5 2.5l3 3L12 15l-4 1 1-4z"/></svg>',
 left:'<svg viewBox="0 0 24 24" fill="#fff"><path d="M11 4l1.8 1.8L7.9 10.7H21v2.6H7.9l4.9 4.9L11 20l-8-8z"/></svg>',
 right:'<svg viewBox="0 0 24 24" fill="#fff"><path d="M13 4l-1.8 1.8 4.9 4.9H3v2.6h13.1l-4.9 4.9L13 20l8-8z"/></svg>',
 check:'<svg viewBox="0 0 24 24" fill="#535353"><path d="M9 16.2L4.8 12l-1.6 1.6L9 19.4 21 7.4l-1.6-1.6z"/></svg>',
 phones:'<svg width="104" height="96" viewBox="0 0 24 22" fill="#fff"><path d="M12 1C6 1 2 5.5 2 11v6.5C2 19.4 3.6 21 5.5 21H8v-8H4v-2c0-4.4 3.6-8 8-8s8 3.6 8 8v2h-4v8h2.5c1.9 0 3.5-1.6 3.5-3.5V11C22 5.5 18 1 12 1z"/></svg>',
 play:'<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#fff"/><path d="M9.5 7v10l8-5z" fill="#000"/></svg>',
 spk:'<svg width="14" height="14" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9z"/><path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a8.5 8.5 0 0 1 0 13" fill="none" stroke="#000" stroke-width="2"/></svg>'
};
function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}
function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k));localStorage.setItem(k,JSON.stringify(v));}catch(e){return null;}}
var MOCK=!!window.IELTS_MOCK_LOAD;
var KEYID=MOCK?('mock_'+P.get('id')+'_'+S):('ielts_'+B+'_'+T+'_'+S);

if(MOCK){
  window.IELTS_MOCK_LOAD(function(info){window.MOCK_INFO=info;var tt={};tt[S]=info.data;window.IELTS_BOOK={tests:{}};window.IELTS_BOOK.tests[T]=tt;start();},
    function(msg){document.body.innerHTML='<p style="padding:40px;font:16px Arial">'+msg+' <a href="index.html">Back</a></p>';});
}else{
var s=document.createElement('script');
s.src='data/book'+pad(B)+'.js';
s.onload=start;
s.onerror=function(){document.body.innerHTML='<p style="padding:40px">Could not load the data for Book '+B+'.</p>';};
document.head.appendChild(s);
}

var D,parts,key,cur=0,answers={},activeQ=null,submitted=false,timerEnd=null,audio=null;
function start(){
  var test=(window.IELTS_BOOK.tests||{})[T]||{};
  D=test[S];
  if(!D){document.body.innerHTML='<p style="padding:40px">This book does not have a '+S+' section for Test '+T+'.</p>';return;}
  parts=D.parts;key=D.key||{};
  document.title=(MOCK?window.MOCK_INFO.name:'IELTS '+B+' Test '+T)+' – '+S.charAt(0).toUpperCase()+S.slice(1);
  build();
}
function rubricText(p){
  if(S==='writing') return p.task===1?'You should spend about 20 minutes on this task. Write at least 150 words.':'You should spend about 40 minutes on this task. Write at least 250 words.';
  var q=p.q,a=q[0],b=q[q.length-1];
  return (S==='listening'?'Listen and answer questions ':'Read the text and answer questions ')+a+'–'+b+'.';
}
var hdr,timerEl,statusEl,content,rubric,panes,ftr,navrow,prevB,nextB;
function build(){
  document.body.className='normal';
  hdr=el('div','hdr');
  hdr.innerHTML='<div class="logo">IELTS<sup>™</sup></div><div class="tt"><b>Test taker ID</b><div class="status">'+ICON.spk+'<span>Audio is Playing</span></div></div><div class="timer"></div>'+
    '<div class="hicons"><button title="Connection">'+ICON.wifi+'</button><button title="Notifications">'+ICON.bell+'</button><button class="mbtn" title="Options">'+ICON.menu+'</button><button title="Notes">'+ICON.note+'</button></div>';
  document.body.appendChild(hdr);
  timerEl=hdr.querySelector('.timer');statusEl=hdr.querySelector('.status');
  var menu=el('div','menu','<div data-a="large">Text size: larger / normal</div><div data-a="contrast">Contrast: black on white / yellow on black</div><div data-a="exit">Exit to test list</div>');
  document.body.appendChild(menu);
  hdr.querySelector('.mbtn').onclick=function(e){e.stopPropagation();menu.classList.toggle('on');};
  document.addEventListener('click',function(){menu.classList.remove('on');ctx.style.display='none';});
  menu.onclick=function(e){var a=e.target.dataset.a;if(a==='large')document.body.classList.toggle('large');if(a==='contrast')document.body.classList.toggle('contrast');if(a==='exit'){location.href='index.html';}};
  content=el('div','content');rubric=el('section','rubric');panes=el('div','panes');
  content.appendChild(rubric);content.appendChild(panes);document.body.appendChild(content);
  var ar=el('div','arrows');prevB=el('button','prev',ICON.left);nextB=el('button','next',ICON.right);
  prevB.title='Previous';nextB.title='Next';ar.appendChild(prevB);ar.appendChild(nextB);document.body.appendChild(ar);
  prevB.onclick=function(){step(-1);};nextB.onclick=function(){step(1);};
  ftr=el('footer','ftr');navrow=el('nav','navrow');ftr.appendChild(navrow);
  var sb=el('button','submit',ICON.check);sb.title='Review and submit';sb.onclick=confirmSubmit;ftr.appendChild(sb);
  document.body.appendChild(ftr);
  // restore saved answers (same session)
  var saved=store(KEYID+'_ans');if(saved&&typeof saved==='object')answers=saved;
  // render all parts once (kept in DOM, toggled) so answers persist
  parts.forEach(function(p,i){renderPart(p,i);});
  showPart(0);
  setupContextMenu();
  if(S==='listening') listeningIntro(); else startTimer(60*60);
}
var partEls=[];
function renderPart(p,i){
  var wrap=el('div','pwrap');wrap.style.display='none';wrap.style.cssText+=';flex:1;display:none;min-height:0';
  if(S==='listening'){
    var one=el('div','pane single',p.right);wrap.appendChild(one);
  }else if(S==='writing'){
    var L=el('div','pane left',p.left);
    var R=el('div','pane right');
    var key2='w'+p.task;
    R.innerHTML='<div class="wbox"><textarea spellcheck="false" data-w="'+p.task+'"></textarea><div class="wcount">Word count: 0</div></div>';
    var ta=R.querySelector('textarea'),wc=R.querySelector('.wcount');
    ta.value=answers[key2]||'';
    var upd=function(){var n=(ta.value.trim().match(/\S+/g)||[]).length;wc.textContent='Word count: '+n;answers[key2]=ta.value;save();};
    ta.oninput=upd;upd();
    wrap.appendChild(L);addDivider(wrap,L);wrap.appendChild(R);
  }else{
    var L2=el('div','pane left',p.left||'');var R2=el('div','pane right',p.right);
    wrap.appendChild(L2);addDivider(wrap,L2);wrap.appendChild(R2);
  }
  partEls[i]=wrap;panes.appendChild(wrap);
  wireInputs(wrap);
}
function addDivider(wrap,left){
  var d=el('div','divider','<div class="resize"><svg width="16" height="16" viewBox="0 0 24 24" fill="#535353"><path d="M7 7l-5 5 5 5v-3.5h10V17l5-5-5-5v3.5H7z"/></svg></div>');
  wrap.appendChild(d);
  d.addEventListener('mousedown',function(e){
    e.preventDefault();var rect=wrap.getBoundingClientRect();
    function mv(ev){var w=Math.min(Math.max(ev.clientX-rect.left,200),rect.width-260);left.style.width=w+'px';}
    function up(){document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);}
    document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
  });
}
function wireInputs(root){
  root.querySelectorAll('input.gap').forEach(function(inp){
    var q=+inp.dataset.q;if(answers[q]!=null)inp.value=answers[q];
    inp.addEventListener('input',function(){answers[q]=inp.value;save();refreshFooter();});
    inp.addEventListener('focus',function(){setActive(q);});
  });
  root.querySelectorAll('select.gap').forEach(function(sel){
    var q=+sel.dataset.q;if(answers[q]!=null)sel.value=answers[q];
    sel.addEventListener('change',function(){answers[q]=sel.value;save();refreshFooter();setActive(q);});
    sel.addEventListener('focus',function(){setActive(q);});
  });
  root.querySelectorAll('.mcq').forEach(function(m){
    var q=+m.dataset.q;
    m.querySelectorAll('input[type=radio]').forEach(function(r){
      if(answers[q]===r.value)r.checked=true;
      r.addEventListener('change',function(){answers[q]=r.value;save();refreshFooter();setActive(q);});
    });
  });
  root.querySelectorAll('.cbgroup').forEach(function(g){
    var qs=g.dataset.qs.split(',').map(Number),max=qs.length,k='g'+qs.join('_');
    var sel=answers[k]||[];
    g.querySelectorAll('input[type=checkbox]').forEach(function(c){
      if(sel.indexOf(c.value)>=0)c.checked=true;
      c.addEventListener('change',function(){
        var ch=[].slice.call(g.querySelectorAll('input:checked')).map(function(x){return x.value;});
        if(ch.length>max){c.checked=false;return;}
        answers[k]=ch;save();refreshFooter();setActive(qs[0]);
      });
    });
  });
  root.querySelectorAll('.qitem').forEach(function(it){it.addEventListener('click',function(){setActive(+it.dataset.qi);});});
}
function save(){store(KEYID+'_ans',answers);}
function groupOf(q){var gs=parts[cur]?parts[cur].groups:[];for(var pi=0;pi<parts.length;pi++){var G=parts[pi].groups||[];for(var i=0;i<G.length;i++)if(G[i].indexOf(q)>=0)return G[i];}return null;}
function isAnswered(q){
  var g=groupOf(q);
  if(g){var sel=answers['g'+g.join('_')]||[];return g.indexOf(q)<sel.length;}
  var v=answers[q];return v!=null&&String(v).trim()!=='';
}
function partOf(q){for(var i=0;i<parts.length;i++)if(parts[i].q&&parts[i].q.indexOf(q)>=0)return i;return 0;}
function showPart(i){
  cur=i;partEls.forEach(function(w,j){w.style.display=j===i?'flex':'none';});
  rubric.innerHTML='<h2>'+parts[i].title+'</h2><p>'+rubricText(parts[i])+'</p>';
  if(S==='writing'){activeQ=null;}
  else if(activeQ==null||partOf(activeQ)!==i) activeQ=parts[i].q[0];
  refreshFooter();highlightActive();
}
function refreshFooter(){
  navrow.innerHTML='';
  parts.forEach(function(p,i){
    var w=el('div','pw'+(i===cur?' sel':''));
    if(S==='writing'){
      w.innerHTML='<span class="pl">'+p.title+'</span>'+(i===cur?'':'<span class="cnt">'+((answers['w'+p.task]||'').trim()?'1':'0')+' of 1</span>');
    }else if(i===cur){
      var nums=el('span','nums');
      p.q.forEach(function(q){var sp=el('span',(isAnswered(q)?'ans':'')+(q===activeQ?' cur':''),String(q));sp.onclick=function(e){e.stopPropagation();goQ(q);};nums.appendChild(sp);});
      w.innerHTML='<span class="pl">'+p.title+'</span>';w.appendChild(nums);
    }else{
      var n=p.q.filter(isAnswered).length;
      w.innerHTML='<span class="pl">'+p.title+'</span><span class="cnt">'+n+' of '+p.q.length+'</span>';
    }
    w.onclick=function(){if(i!==cur){activeQ=null;showPart(i);focusQ(activeQ);}};
    navrow.appendChild(w);
  });
  var all=flatQ(),idx=all.indexOf(activeQ);
  if(S==='writing'){prevB.disabled=cur===0;nextB.disabled=cur===parts.length-1;}
  else{prevB.disabled=idx<=0;nextB.disabled=idx>=all.length-1;}
}
function flatQ(){var a=[];parts.forEach(function(p){a=a.concat(p.q||[]);});return a;}
function setActive(q){activeQ=q;refreshFooter();highlightActive();}
function highlightActive(){
  var w=partEls[cur];if(!w)return;
  w.querySelectorAll('.qitem.active').forEach(function(x){x.classList.remove('active');});
  w.querySelectorAll('.qno.cur').forEach(function(x){x.classList.remove('cur');});
  var it=w.querySelector('.qitem[data-qi="'+activeQ+'"]');if(it)it.classList.add('active');
}
function findQ(q){
  var w=partEls[partOf(q)];if(!w)return null;
  return w.querySelector('input.gap[data-q="'+q+'"]')||w.querySelector('select.gap[data-q="'+q+'"]')||w.querySelector('.qitem[data-qi="'+q+'"]')||w.querySelector('.mcq[data-q="'+q+'"]')||
    [].slice.call(w.querySelectorAll('.cbgroup')).filter(function(g){return g.dataset.qs.split(',').indexOf(String(q))>=0;})[0];
}
function focusQ(q){
  var e=findQ(q);if(!e)return;
  e.scrollIntoView({block:'center',behavior:'smooth'});
  var inp=e.matches&&e.matches('input.gap,select.gap')?e:null;
  if(inp)setTimeout(function(){inp.focus({preventScroll:true});},200);
  setActive(q);
}
function goQ(q){var pi=partOf(q);if(pi!==cur){activeQ=q;showPart(pi);}focusQ(q);}
function step(d){
  if(S==='writing'){var n=cur+d;if(n>=0&&n<parts.length)showPart(n);return;}
  var all=flatQ(),i=all.indexOf(activeQ)+d;if(i>=0&&i<all.length)goQ(all[i]);
}
/* ---------- timer ---------- */
var tint=null;
function startTimer(sec){
  var saved=store(KEYID+'_end');
  timerEnd=(saved&&saved>Date.now())?saved:Date.now()+sec*1000;store(KEYID+'_end',timerEnd);
  tick();tint=setInterval(tick,1000);
}
function tick(){
  var left=Math.max(0,Math.round((timerEnd-Date.now())/1000));
  var mm=Math.floor(left/60),ss=left%60;
  timerEl.textContent=mm+':'+(ss<10?'0':'')+ss+' left';
  timerEl.classList.toggle('warn',left<=300);
  if(left<=0&&!submitted){clearInterval(tint);doSubmit(true);}
}
/* ---------- listening ---------- */
function listeningIntro(){
  var src=MOCK?window.MOCK_INFO.audioUrl:('../IELTS Listening Audio/Book '+pad(B)+'/IELTS '+B+' - Test '+T+' Listening.mp3');
  audio=new Audio();audio.preload='auto';audio.src=src;
  var ov=el('div','ov','<div>'+ICON.phones+'</div><div class="msg">You will be listening to an audio clip during this test. You will not be permitted to pause or rewind the audio while answering the questions.<br><br>To continue, click Play.</div>');
  var b=el('button','bigbtn',ICON.play+'<span>Play</span>');ov.appendChild(b);document.body.appendChild(ov);
  var failed=false;
  audio.onerror=function(){failed=true;};
  b.onclick=function(){
    ov.remove();
    if(failed){timerEl.textContent='No audio file for this test';startTimer(40*60);return;}
    audio.play().then(function(){statusEl.classList.add('on');}).catch(function(){statusEl.classList.remove('on');});
    var dur=function(){return isFinite(audio.duration)?audio.duration:30*60;};
    var go=function(){startTimer(Math.round(dur()-audio.currentTime)+120);};
    if(isFinite(audio.duration))go();else audio.addEventListener('loadedmetadata',go,{once:true});
    audio.onended=function(){statusEl.classList.remove('on');};
  };
}
/* ---------- highlighting ---------- */
var ctx;
function setupContextMenu(){
  // popup that appears as soon as text is selected (like the real test)
  ctx=el('div','ctx hlpop','<div data-a="hl">Highlight</div><div data-a="note">Note</div>');document.body.appendChild(ctx);
  var clr=el('div','ctx hlpop','<div data-a="clear">Clear</div><div data-a="edit">Note</div>');document.body.appendChild(clr);
  var noteBox=el('div','notebox','<div class="nb-head">Note</div><textarea spellcheck="false"></textarea><div class="nb-btns"><button class="nb-del">Delete</button><button class="nb-ok">Close</button></div>');document.body.appendChild(noteBox);
  var range=null,curMark=null,gid=0;
  function hideAll(){ctx.style.display='none';clr.style.display='none';}
  function place(box,x,y){box.style.display='block';var w=box.offsetWidth,h=box.offsetHeight;
    x=Math.max(8,Math.min(x,window.innerWidth-w-8));y=Math.min(y,window.innerHeight-80-h);box.style.left=x+'px';box.style.top=y+'px';}
  function textNodesIn(r){
    var root=r.commonAncestorContainer.nodeType===3?r.commonAncestorContainer.parentNode:r.commonAncestorContainer,out=[];
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);var n;
    while((n=w.nextNode())){if(r.intersectsNode(n)&&n.nodeValue.trim()&&!n.parentNode.closest('input,textarea,button,.ctx,.notebox'))out.push(n);}
    return out;
  }
  function wrap(r,cls){
    var nodes=textNodesIn(r);if(!nodes.length)return null;var g='g'+(++gid),first=null;
    nodes.forEach(function(n){
      var st=(n===r.startContainer)?r.startOffset:0,en=(n===r.endContainer)?r.endOffset:n.nodeValue.length;
      if(en<=st)return;
      if(en<n.nodeValue.length)n.splitText(en);
      var t=st>0?n.splitText(st):n;
      var m=document.createElement('mark');m.className=cls;m.dataset.g=g;t.parentNode.insertBefore(m,t);m.appendChild(t);
      if(!first)first=m;
    });
    return first;
  }
  function groupOfMark(m){return [].slice.call(document.querySelectorAll('mark.hl[data-g="'+m.dataset.g+'"]'));}
  function unwrap(m){groupOfMark(m).forEach(function(x){var p=x.parentNode;while(x.firstChild)p.insertBefore(x.firstChild,x);p.removeChild(x);p.normalize();});}
  function openNote(m){
    curMark=m;var ta=noteBox.querySelector('textarea');ta.value=m.dataset.note||'';
    var r=m.getBoundingClientRect();place(noteBox,r.left,r.bottom+8);ta.focus();
  }
  function saveNote(){if(!curMark)return;var v=noteBox.querySelector('textarea').value;
    groupOfMark(curMark).forEach(function(x){x.dataset.note=v;x.classList.toggle('hasnote',!!v.trim());x.title=v;});}
  noteBox.querySelector('textarea').addEventListener('input',saveNote);
  noteBox.querySelector('.nb-ok').onclick=function(){saveNote();noteBox.style.display='none';curMark=null;};
  noteBox.querySelector('.nb-del').onclick=function(){if(curMark)groupOfMark(curMark).forEach(function(x){delete x.dataset.note;x.classList.remove('hasnote');x.removeAttribute('title');});noteBox.style.display='none';curMark=null;};
  panes.addEventListener('mouseup',function(e){
    if(e.button!==0)return;
    if(e.target.closest('input,textarea,label.opt input'))return;
    setTimeout(function(){
      var sel=window.getSelection();
      if(sel&&sel.rangeCount&&!sel.isCollapsed&&panes.contains(sel.getRangeAt(0).commonAncestorContainer)){
        range=sel.getRangeAt(0).cloneRange();var rects=range.getClientRects(),rc=rects[rects.length-1]||range.getBoundingClientRect();
        clr.style.display='none';place(ctx,rc.right-20,rc.bottom+6);return;
      }
      var mk=e.target.closest&&e.target.closest('mark.hl');
      if(mk){curMark=mk;ctx.style.display='none';place(clr,e.clientX,e.clientY+12);return;}
      hideAll();
    },0);
  });
  panes.addEventListener('contextmenu',function(e){var mk=e.target.closest&&e.target.closest('mark.hl');if(mk){e.preventDefault();curMark=mk;place(clr,e.clientX,e.clientY+8);}});
  document.addEventListener('mousedown',function(e){if(!e.target.closest('.ctx,.notebox'))hideAll();if(!e.target.closest('.notebox,mark.hl')&&noteBox.style.display==='block'){saveNote();noteBox.style.display='none';}});
  ctx.addEventListener('mousedown',function(e){e.preventDefault();});
  clr.addEventListener('mousedown',function(e){e.preventDefault();});
  ctx.addEventListener('click',function(e){
    var a=e.target.dataset.a;if(!range)return;
    var m=wrap(range,'hl');window.getSelection().removeAllRanges();hideAll();
    if(a==='note'&&m)openNote(m);
  });
  clr.addEventListener('click',function(e){
    var a=e.target.dataset.a;hideAll();if(!curMark)return;
    if(a==='clear'){unwrap(curMark);curMark=null;}
    if(a==='edit')openNote(curMark);
  });
  panes.addEventListener('scroll',hideAll,true);
}
/* ---------- marking ---------- */
function normA(s){
  s=String(s==null?'':s).toLowerCase().replace(/[’‘`]/g,"'").replace(/[£$€%]/g,'').replace(/,(?=\d{3})/g,'');
  s=s.replace(/[.;:!?"]+$/,'').replace(/^[.;:!?"]+/,'').replace(/\s*-\s*/g,'-').replace(/\s+/g,' ').trim();
  var map={t:'true',f:'false',ng:'not given','not-given':'not given',y:'yes',n:'no'};
  return map[s]||s;
}
function variants(k){
  k=String(k||'').replace(/\s+or\s+/gi,'/');
  var parts_=k.split('/').map(function(x){return x.trim();}).filter(Boolean);
  // "4/four sides" -> "4 sides","four sides"
  if(parts_.length===2){var a=parts_[0].split(' '),b=parts_[1].split(' ');
    if(a.length===1&&b.length>1)parts_.push([a[0]].concat(b.slice(1)).join(' '));
    if(b.length===1&&a.length>1)parts_.push(a.slice(0,-1).concat([b[0]]).join(' '));}
  var out=[];
  parts_.forEach(function(p){
    var withP=p.replace(/[()]/g,''),without=p.replace(/\([^)]*\)/g,' ');
    [withP,without].forEach(function(v){v=normA(v);if(v&&out.indexOf(v)<0)out.push(v);});
  });
  return out;
}
function letterSet(k){var u=String(k||'').toUpperCase();var m=u.match(/^\s*[A-L](\s*(,|&|AND|OR|\/)\s*[A-L])+\s*$/);if(!m)return null;return u.match(/\b[A-L]\b/g);}
function kA(k){return (k&&typeof k==='object')?(k.a||[]):null;}
function cmpObj(your,k){
  var u=String(your||'').trim();if(!u)return false;
  return (k.a||[]).some(function(v){
    if(k.cs){var a=u.replace(/\s+/g,' ').replace(/[.]+$/,''),vs=String(v).split('/').map(function(x){return x.trim();});
      return vs.some(function(x){var w=x.replace(/\s+/g,' ').replace(/[.]+$/,'');return a===w||a===w.replace(/\([^)]*\)/g,' ').replace(/\s+/g,' ').trim()||a===w.replace(/[()]/g,'');});}
    return variants(v).indexOf(normA(u))>=0;});
}
function corrText(k){return kA(k)?kA(k).join(' / '):String(k||'');}
function mark(){
  var res=[],score=0,doneG={};
  flatQ().forEach(function(q){
    var g=groupOf(q),ok=false,your='',corr=key[q]||'';
    if(g){
      var gk='g'+g.join('_');
      if(!doneG[gk]){
        var pool=[];g.forEach(function(x){var ls=kA(key[x])||letterSet(key[x])||[String(key[x]||'').trim().toUpperCase()];ls.forEach(function(L){if(L&&pool.indexOf(L)<0)pool.push(L);});});
        var sel=(answers[gk]||[]).slice();var hits=sel.filter(function(L){return pool.indexOf(L)>=0;});
        doneG[gk]={pool:pool,sel:sel,hits:hits};
      }
      var G=doneG[gk],idx=g.indexOf(q);
      your=G.sel[idx]||'';ok=idx<G.hits.length;corr=G.pool.join(', ');
      if(ok)your=G.hits[idx];
    }else{
      your=answers[q]==null?'':String(answers[q]);
      if(kA(corr)){ok=cmpObj(your,corr);corr=corrText(corr);if(ok)score++;res.push({q:q,your:your,corr:corr,ok:ok});return;}
      var ls=letterSet(corr);
      if(ls){ok=ls.indexOf(your.trim().toUpperCase())>=0;}
      else{var u=normA(your);ok=!!u&&variants(corr).indexOf(u)>=0;}
    }
    if(ok)score++;
    res.push({q:q,your:your,corr:corr,ok:ok});
  });
  return {score:score,total:res.length,rows:res};
}
function band(sk,sc){
  var L=[[39,9],[37,8.5],[35,8],[32,7.5],[30,7],[26,6.5],[23,6],[18,5.5],[16,5],[13,4.5],[10,4],[8,3.5],[6,3],[4,2.5]];
  var R=[[39,9],[37,8.5],[35,8],[33,7.5],[30,7],[27,6.5],[23,6],[19,5.5],[15,5],[13,4.5],[10,4],[8,3.5],[6,3],[4,2.5]];
  var t=sk==='listening'?L:R;for(var i=0;i<t.length;i++)if(sc>=t[i][0])return t[i][1];return 0;
}
function confirmSubmit(){
  var unans=S==='writing'?0:flatQ().filter(function(q){return !isAnswered(q);}).length;
  var m=el('div','modal','<div class="mbox"><h3>Submit your answers?</h3><p>'+(S==='writing'?'You will not be able to change your writing after you submit.':(unans?('You have <b>'+unans+'</b> unanswered question'+(unans>1?'s':'')+'. '):'')+'Once you submit, you cannot change your answers.')+'</p><div class="btns"><button class="c">Cancel</button><button class="pri s">Submit</button></div></div>');
  document.body.appendChild(m);
  m.querySelector('.c').onclick=function(){m.remove();};
  m.querySelector('.s').onclick=function(){m.remove();doSubmit(false);};
}
function esc(t){return String(t).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
function doSubmit(timeUp){
  submitted=true;if(tint)clearInterval(tint);if(audio){try{audio.pause();}catch(e){}}statusEl.classList.remove('on');
  store(KEYID+'_end',null);
  var r=el('div','res');
  if(S==='writing'){
    var w1=(answers.w1||'').trim(),w2=(answers.w2||'').trim();
    var c=function(t){return (t.match(/\S+/g)||[]).length;};
    r.innerHTML='<div class="wrap"><h2>'+(timeUp?'Time is up. ':'')+'Writing submitted</h2><p>Task 1: <b>'+c(w1)+'</b> words &nbsp; | &nbsp; Task 2: <b>'+c(w2)+'</b> words</p><p>Your writing is not marked automatically. Copy it and send it to Claude for a band score.</p><textarea style="width:100%;height:300px;font:15px Arial" readonly>TASK 1\n\n'+esc(w1)+'\n\nTASK 2\n\n'+esc(w2)+'</textarea><div class="acts"><a href="index.html">Back to test list</a></div></div>';
    document.body.appendChild(r);return;
  }
  var M=mark();
  if(MOCK){var mh=store('mock_scores')||{};mh[P.get('id')+'_'+S]={score:M.score,total:M.total,at:Date.now()};store('mock_scores',mh);}
  else{var hist=store('ielts_scores')||{};hist[B+'_'+T+'_'+S]={score:M.score,total:M.total,at:Date.now()};store('ielts_scores',hist);}
  store(KEYID+'_ans',null);
  var rows=M.rows.map(function(x){return '<tr><td>'+x.q+'</td><td>'+(esc(x.your)||'<span style="color:#999">—</span>')+'</td><td>'+esc(x.corr)+'</td><td class="'+(x.ok?'ok':'no')+'">'+(x.ok?'✓':'✗')+'</td></tr>';}).join('');
  r.innerHTML='<div class="wrap"><div>'+(timeUp?'Time is up. ':'')+(MOCK?esc(window.MOCK_INFO.name):'IELTS '+B+' · Test '+T)+' · '+(S==='listening'?'Listening':'Academic Reading')+'</div><div class="score">'+M.score+' / '+M.total+' correct</div><div class="band">Approximate band: <b>'+band(S,M.score)+'</b></div>'+
    '<div class="acts"><button class="rev">Review answers on the test screen</button><a class="sec" href="index.html">Back to test list</a><button class="sec again">Try again</button></div>'+
    '<table><thead><tr><th>Q</th><th>Your answer</th><th>Correct answer</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  document.body.appendChild(r);
  r.querySelector('.again').onclick=function(){store(KEYID+'_ans',null);location.reload();};
  r.querySelector('.rev').onclick=function(){r.style.display='none';if(!document.body.classList.contains('review'))review(M,r);};
}
function review(M,r){
  document.body.classList.add('review');timerEl.textContent='Review mode';
  M.rows.forEach(function(x){
    var e=findQ(x.q);if(!e)return;
    var inp=document.querySelector('input.gap[data-q="'+x.q+'"],select.gap[data-q="'+x.q+'"]');
    if(inp){inp.classList.add(x.ok?'right':'wrong');inp.readOnly=true;if(inp.tagName==='SELECT')inp.disabled=true;if(!x.ok)inp.insertAdjacentHTML('afterend','<span class="corr">'+esc(x.corr)+'</span>');return;}
    var m=document.querySelector('.mcq[data-q="'+x.q+'"]');
    if(m){m.querySelectorAll('input').forEach(function(i){i.disabled=true;var lab=i.closest('.opt');var c=normA(i.value)===normA(x.corr)||(letterSet(x.corr)||[]).indexOf(i.value)>=0||String(x.corr).split(' / ').indexOf(i.value)>=0;if(c)lab.classList.add('right');else if(i.checked)lab.classList.add('wrong');});}
  });
  document.querySelectorAll('.cbgroup').forEach(function(g){
    var qs=g.dataset.qs.split(',').map(Number);var pool=[];qs.forEach(function(q){(kA(key[q])||letterSet(key[q])||[String(key[q]||'').trim().toUpperCase()]).forEach(function(L){pool.push(L);});});
    g.querySelectorAll('input').forEach(function(i){i.disabled=true;var lab=i.closest('.opt');if(pool.indexOf(i.value)>=0)lab.classList.add('right');else if(i.checked)lab.classList.add('wrong');});
  });
  var back=el('div','arrows');back.style.bottom='160px';
  var bb=el('button','next','<span style="color:#fff;font:13px Arial;padding:0 6px">Score</span>');bb.style.width='70px';
  bb.onclick=function(){r.style.display='block';};back.appendChild(bb);document.body.appendChild(back);
}
})();
