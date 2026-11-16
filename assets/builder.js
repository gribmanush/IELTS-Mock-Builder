(function(){
'use strict';
var P=new URLSearchParams(location.search),M=null,step='name',ansTab='listening',isNew=!!P.get('new');
var main=document.getElementById('main'),stepsEl=document.getElementById('steps'),savedEl=document.getElementById('saved');
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}
var st=null;
function save(){if(!M||isNew)return;clearTimeout(st);savedEl.style.display='block';savedEl.textContent='Saving…';
  st=setTimeout(function(){Store.save(M).then(function(){savedEl.textContent='Saved';});},500);}
function changed(){save();refreshCounts();}


var STEPS=[['name','1. Name'],['listening','2. Listening'],['reading','3. Reading'],['writing','4. Writing'],['answers','5. Answers'],['review','6. Check & take']];
function render(){
  document.getElementById('mname').textContent=M.name||'New mock';
  var v=validateMock(M);
  stepsEl.innerHTML='';
  STEPS.forEach(function(s){
    var b=el('button',s[0]===step?'on':'',s[1]),flag='';
    if(!isNew&&(s[0]==='listening'||s[0]==='reading'||s[0]==='writing'))flag=v[s[0]].length?' <span class="bad">•</span>':' <span class="good">✓</span>';
    b.innerHTML=s[1]+flag;
    b.onclick=function(){if(isNew&&s[0]!=='name'){alert('Give your mock a name first.');return;}step=s[0];render();window.scrollTo(0,0);};
    stepsEl.appendChild(b);
  });
  main.innerHTML='';reg=[];
  ({name:stepName,listening:stepListening,reading:stepReading,writing:stepWriting,answers:stepAnswers,review:stepReview})[step]();
  refreshCounts();
}
function nextBtn(to,label){var b=el('button','btn',label);b.style.marginTop='18px';b.onclick=function(){step=to;render();window.scrollTo(0,0);};return b;}

/* ---------- step 1: name ---------- */
function stepName(){
  var c=el('div','card');
  c.innerHTML='<h3>Name your mock test</h3><p class="muted">For example "Cambridge 18 – Test 2" or "My practice test 1".</p><input class="t" id="nm" maxlength="80" placeholder="Mock test name" value="'+esc(M.name)+'">';
  main.appendChild(c);
  var nm=c.querySelector('#nm');nm.focus();
  var b=el('button','btn',isNew?'Create and continue to Listening':'Next: Listening');b.style.marginTop='14px';
  nm.oninput=function(){M.name=nm.value;document.getElementById('mname').textContent=M.name||'New mock';if(!isNew)save();};
  b.onclick=function(){if(!nm.value.trim()){nm.focus();return;}M.name=nm.value.trim();
    if(isNew){isNew=false;Store.save(M).then(function(){history.replaceState(null,'','builder.html?id='+M.id);step='listening';render();});}
    else{step='listening';render();}};
  nm.onkeydown=function(e){if(e.key==='Enter')b.click();};
  main.appendChild(b);
}

/* ---------- shared: count badges and numbering ---------- */
var reg=[];
function refreshCounts(){
  ['listening','reading'].forEach(function(sk){
    var secs=sk==='listening'?M.listening.parts:M.reading.passages,n=1;
    secs.forEach(function(sec,si){
      var tot=0;
      (sec.groups||[]).forEach(function(g){var c=groupCount(g);
        reg.filter(function(r){return r.g===g;}).forEach(function(r){r.el.textContent=c?(c>1?'Questions '+n+'–'+(n+c-1):'Question '+n):'No questions yet';});
        n+=c;tot+=c;});
      reg.filter(function(r){return r.sec===sec;}).forEach(function(r){
        if(sk==='listening'){r.el.textContent=tot+' / 10 questions';r.el.className='cnt '+(tot===10?'ok':'no');}
        else{r.el.textContent=tot+' questions';r.el.className='cnt';}
      });
    });
    if(sk==='reading'){var t=sectionCounts(M,'reading').reduce(function(a,b){return a+b;},0);
      reg.filter(function(r){return r.total;}).forEach(function(r){r.el.textContent='Total: '+t+' / 40 questions';r.el.className='cnt '+(t===40?'ok':'no');});}
  });
}

/* ---------- image helper ---------- */
function readImage(file,max){return new Promise(function(res,rej){var fr=new FileReader();fr.onload=function(){var im=new Image();im.onload=function(){
  var s=Math.min(1,(max||1200)/im.width),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);
  var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/png'));};im.onerror=rej;im.src=fr.result;};fr.readAsDataURL(file);});}
function imageField(obj,label){
  var w=el('div');
  w.innerHTML='<label class="f">'+label+'</label><div class="row"><label class="btn sm sec">Choose picture<input type="file" accept="image/*" hidden></label>'+(obj.image?'<button class="btn sm danger">Remove picture</button>':'')+'</div>'+(obj.image?'<img class="thumb" src="'+obj.image+'">':'');
  w.querySelector('input').onchange=function(e){var f=e.target.files[0];if(!f)return;readImage(f,1200).then(function(d){obj.image=d;save();render();});};
  var rm=w.querySelector('.danger');if(rm)rm.onclick=function(){obj.image=null;save();render();};
  return w;
}
function ta(label,val,rows,onIn,hint,ph){
  var w=el('div');w.innerHTML='<label class="f">'+label+'</label><textarea class="t" rows="'+(rows||3)+'" placeholder="'+esc(ph||'')+'"></textarea>'+(hint?'<div class="hint">'+hint+'</div>':'');
  var t=w.querySelector('textarea');t.value=val||'';t.oninput=function(){onIn(t.value);changed();};return w;
}
function inp(label,val,onIn,ph){
  var w=el('div');w.innerHTML='<label class="f">'+label+'</label><input class="t" placeholder="'+esc(ph||'')+'">';
  var t=w.querySelector('input');t.value=val||'';t.oninput=function(){onIn(t.value);changed();};return w;
}
function scanBtn(target,append){
  var b=el('button','btn sm sec','📷 Scan from photo');b.type='button';
  b.onclick=function(){OCR.open(function(text,mode){target.value=(mode==='append'&&target.value.trim()?target.value.replace(/\s+$/,'')+'\n\n':'')+text;target.dispatchEvent(new Event('input'));});};
  return b;
}

/* ---------- group editor ---------- */
function groupEditor(sec,g,gi,sk){
  var box=el('div','grp'),T=SPEC.types[g.type];
  var head=el('div','gh');var qh=el('b');reg.push({g:g,el:qh});
  head.appendChild(el('span','',''));head.firstChild.appendChild(qh);head.firstChild.insertAdjacentHTML('beforeend',' <span class="muted">· '+esc(T.label.split(' (')[0])+'</span>');
  var tools=el('div','row');
  [['↑','up'],['↓','down'],['Preview','prev'],['Delete group','del']].forEach(function(x){var b=el('button','btn sm '+(x[1]==='del'?'danger':'sec'),x[0]);b.type='button';b.dataset.a=x[1];tools.appendChild(b);});
  head.appendChild(tools);box.appendChild(head);
  var pv=el('div','preview');pv.style.display='none';
  tools.onclick=function(e){var a=e.target.dataset.a;if(!a)return;var G=sec.groups,i=G.indexOf(g);
    if(a==='up'&&i>0){G.splice(i-1,0,G.splice(i,1)[0]);save();render();}
    if(a==='down'&&i<G.length-1){G.splice(i+1,0,G.splice(i,1)[0]);save();render();}
    if(a==='del'&&confirm('Delete this question group?')){G.splice(i,1);save();render();}
    if(a==='prev'){if(pv.style.display==='none'){var start=walkQuestions(M,sk).filter(function(x){return x.g===g;})[0];pv.innerHTML=mockHelpers.groupHTML(g,start?start.num:1,{});pv.style.display='block';}else pv.style.display='none';}
  };
  box.appendChild(ta('Instructions (shown above the questions)',g.instr,2,function(v){g.instr=v;}));
  if(g.type==='completion'){
    box.appendChild(inp('Heading (optional), e.g. "Phone call about second-hand furniture"',g.title,function(v){g.title=v;}));
    var c=ta('Text with answer boxes',g.content,8,function(v){g.content=v;},
      'Type <b>___</b> (three underscores) wherever an answer box goes. They are numbered automatically.<br>Start a line with <b>- </b> for a bullet point, <b># </b> for a bold sub-heading, and separate table cells with <b>|</b> (first row = column headings).',
      'Example:\n# Items\n- Dining table: ___ shape\n- Price: £___\n\nCourse | Cost | Notes\nTaster day | £120 | max ___ people');
    var srow=el('div','addrow');srow.appendChild(scanBtn(c.querySelector('textarea'),true));c.appendChild(srow);box.appendChild(c);
    var ul=el('label','chk','<input type="checkbox"'+(g.useList?' checked':'')+'> Answers are chosen from a list of words/phrases (A, B, C…) – shows a drop-down in each box');
    ul.querySelector('input').onchange=function(e){g.useList=e.target.checked;g.answers=[];save();render();};box.appendChild(ul);
    if(g.useList){box.appendChild(inp('List heading (optional)',g.listTitle,function(v){g.listTitle=v;}));
      box.appendChild(ta('Options – one per line (lettered A, B, C… automatically)',g.options,5,function(v){g.options=v;}));}
  }
  if(g.type==='tfng'){
    var kd=el('div','','<label class="f">Answer type</label><select class="t"><option value="TFNG">TRUE / FALSE / NOT GIVEN (facts)</option><option value="YNNG">YES / NO / NOT GIVEN (writer\'s views)</option></select>');
    var sel=kd.querySelector('select');sel.value=g.kind;sel.onchange=function(){g.kind=sel.value;g.answers=[];g.instr=(g.kind==='YNNG'?'Do the following statements agree with the views of the writer?\nChoose YES if the statement agrees with the views of the writer, NO if the statement contradicts the views of the writer, or NOT GIVEN if it is impossible to say what the writer thinks about this.':SPEC.types.tfng.instr);save();render();};
    box.appendChild(kd);
    var s2=ta('Statements – one per line (each line is one question)',g.statements,6,function(v){g.statements=v;});
    var r2=el('div','addrow');r2.appendChild(scanBtn(s2.querySelector('textarea'),true));s2.appendChild(r2);box.appendChild(s2);
  }
  if(g.type==='mcq'){
    (g.questions||[]).forEach(function(q,qi){
      var mq=el('div','mq');
      mq.appendChild(inp('Question '+(qi+1)+' of this group',q.stem,function(v){q.stem=v;}));
      mq.appendChild(ta('Options – one per line (lettered A, B, C… automatically)',q.options,4,function(v){q.options=v;}));
      if(g.questions.length>1){var rm=el('button','btn sm danger','Remove this question');rm.type='button';rm.onclick=function(){g.questions.splice(qi,1);(g.answers||[]).splice(qi,1);save();render();};mq.appendChild(rm);}
      box.appendChild(mq);
    });
    var add=el('button','btn sm sec','+ Add another multiple-choice question');add.type='button';add.onclick=function(){g.questions.push({stem:'',options:''});save();render();};
    var ar=el('div','addrow');ar.appendChild(add);box.appendChild(ar);
  }
  if(g.type==='mcq_multi'){
    var pk=el('div','','<label class="f">How many answers?</label><select class="t" style="max-width:220px"><option value="2">TWO (counts as 2 questions)</option><option value="3">THREE (counts as 3 questions)</option></select>');
    var ps=pk.querySelector('select');ps.value=String(g.pick||2);ps.onchange=function(){g.pick=+ps.value;g.answers={set:[]};g.instr='Choose '+(g.pick===3?'THREE':'TWO')+' letters, A–'+String.fromCharCode(64+Math.max(lines(g.options).length,5))+'.';save();render();};
    box.appendChild(pk);
    box.appendChild(inp('Question',g.stem,function(v){g.stem=v;},'e.g. Which TWO things are included in the price of the tour?'));
    box.appendChild(ta('Options – one per line (lettered A, B, C… automatically)',g.options,5,function(v){g.options=v;}));
  }
  if(g.type==='matching'){
    var stl=el('div','','<label class="f">Labels for the list</label><select class="t" style="max-width:320px"><option value="letter">A, B, C… (features, information, endings, map/plan)</option><option value="roman">i, ii, iii… (list of headings)</option></select>');
    var ss=stl.querySelector('select');ss.value=g.style;ss.onchange=function(){g.style=ss.value;g.answers=[];save();render();};box.appendChild(stl);
    box.appendChild(inp('List heading (optional), e.g. "List of Headings"',g.listTitle,function(v){g.listTitle=v;}));
    var o=ta('List options – one per line',g.options,6,function(v){g.options=v;});var orow=el('div','addrow');orow.appendChild(scanBtn(o.querySelector('textarea'),true));o.appendChild(orow);box.appendChild(o);
    var it=ta('Questions – one per line (each line gets a drop-down to pick a letter)',g.items,5,function(v){g.items=v;},'For map or plan labelling, add the picture below and list the places here (e.g. "Café", "Ticket office").');
    var irow=el('div','addrow');irow.appendChild(scanBtn(it.querySelector('textarea'),true));it.appendChild(irow);box.appendChild(it);
    var ru=el('label','chk','<input type="checkbox"'+(g.reuse?' checked':'')+'> Options can be used more than once (shows the "NB" note)');
    ru.querySelector('input').onchange=function(e){g.reuse=e.target.checked;save();};box.appendChild(ru);
  }
  box.appendChild(imageField(g,'Picture (optional): map, plan, diagram, chart'));
  box.appendChild(pv);
  return box;
}
function addGroupRow(sec,sk){
  var r=el('div','addrow'),s=el('select','t');s.style.maxWidth='520px';
  SPEC.allowed[sk].forEach(function(t){var o=el('option','',SPEC.types[t].label);o.value=t;s.appendChild(o);});
  var b=el('button','btn sm','+ Add question group');b.type='button';
  b.onclick=function(){sec.groups.push(newGroup(s.value));save();render();};
  r.appendChild(s);r.appendChild(b);return r;
}

/* ---------- step 2: listening ---------- */
function stepListening(){
  var c=el('div','card');
  c.innerHTML='<h3>Listening audio</h3><p class="muted">Upload one recording that covers all 4 parts (MP3, M4A, WAV…). In the test it plays once, without pausing, like the real exam.</p>';
  var row=el('div','row');var up=el('label','btn sm sec',(M.listening.audioId?'Replace audio':'Upload audio')+'<input type="file" accept="audio/*" hidden>');row.appendChild(up);
  if(M.listening.audioName)row.appendChild(el('span','muted',esc(M.listening.audioName)));c.appendChild(row);
  var au=el('audio');au.controls=true;au.style.cssText='width:100%;margin-top:10px;display:none';c.appendChild(au);
  if(M.listening.audioId)Store.getBlob(M.listening.audioId).then(function(b){if(b){au.src=URL.createObjectURL(b);au.style.display='block';}});
  up.querySelector('input').onchange=function(e){var f=e.target.files[0];if(!f)return;var id=M.id+'_audio';
    Store.putBlob(id,f).then(function(){M.listening.audioId=id;M.listening.audioName=f.name;return Store.save(M);}).then(render);};
  main.appendChild(c);
  M.listening.parts.forEach(function(sec,i){
    var pb=el('div','partbox');var ph=el('div','ph','<b>Part '+(i+1)+'</b>');var cnt=el('span','cnt');reg.push({sec:sec,el:cnt});ph.appendChild(cnt);pb.appendChild(ph);
    var bd=el('div','pb');
    if(!sec.groups.length)bd.appendChild(el('p','muted','No questions yet. Choose a question type and press <b>Add question group</b>. Each part needs exactly 10 questions.'));
    sec.groups.forEach(function(g,gi){bd.appendChild(groupEditor(sec,g,gi,'listening'));});
    bd.appendChild(addGroupRow(sec,'listening'));pb.appendChild(bd);main.appendChild(pb);
  });
  main.appendChild(nextBtn('reading','Next: Reading'));
}

/* ---------- step 3: reading ---------- */
function stepReading(){
  var top=el('div','card','<div class="mrow"><div><h3>Reading passages</h3><div class="muted">3 passages, 40 questions in total (usually 13, 13 and 14).</div></div></div>');
  var tot=el('span','cnt');reg.push({total:true,el:tot});top.firstChild.appendChild(tot);main.appendChild(top);
  M.reading.passages.forEach(function(sec,i){
    var pb=el('div','partbox');var ph=el('div','ph','<b>Passage '+(i+1)+'</b>');var cnt=el('span','cnt');reg.push({sec:sec,el:cnt});ph.appendChild(cnt);pb.appendChild(ph);
    var bd=el('div','pb');
    bd.appendChild(inp('Passage title',sec.title,function(v){sec.title=v;},'e.g. Bats to the Rescue'));
    var t=ta('Passage text',sec.text,14,function(v){sec.text=v;},'Leave an empty line between paragraphs. If paragraphs are lettered, start them with the letter, e.g. "A  The first paragraph…". Start a line with <b># </b> for a sub-heading.');
    var tr=el('div','addrow');tr.appendChild(scanBtn(t.querySelector('textarea'),true));tr.appendChild(el('span','hint','Take a photo of the page, then check the text before using it.'));t.appendChild(tr);bd.appendChild(t);
    bd.appendChild(el('h3','','Questions for this passage')).style.cssText='font-size:16px;margin:18px 0 0';
    sec.groups.forEach(function(g,gi){bd.appendChild(groupEditor(sec,g,gi,'reading'));});
    bd.appendChild(addGroupRow(sec,'reading'));pb.appendChild(bd);main.appendChild(pb);
  });
  main.appendChild(nextBtn('writing','Next: Writing'));
}

/* ---------- step 4: writing ---------- */
function stepWriting(){
  M.writing.tasks.forEach(function(t,i){
    var pb=el('div','partbox');pb.appendChild(el('div','ph','<b>Writing Task '+(i+1)+'</b><span class="muted">'+(i?'40 minutes · at least 250 words (essay)':'20 minutes · at least 150 words (chart, graph, table, process or map)')+'</span>'));
    var bd=el('div','pb');
    var q=ta('Question',t.prompt,6,function(v){t.prompt=v;},null,i?'e.g. Some people believe that… To what extent do you agree or disagree?\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.':'e.g. The graph below shows… Summarise the information by selecting and reporting the main features, and make comparisons where relevant.');
    var r=el('div','addrow');r.appendChild(scanBtn(q.querySelector('textarea'),false));q.appendChild(r);bd.appendChild(q);
    bd.appendChild(imageField(t,i?'Picture (optional)':'Chart, graph, table, map or diagram'));
    pb.appendChild(bd);main.appendChild(pb);
  });
  main.appendChild(nextBtn('answers','Next: Answers'));
}

/* ---------- step 5: answers ---------- */
function stepAnswers(){
  var tabs=el('div','row');tabs.style.marginBottom='12px';
  ['listening','reading'].forEach(function(sk){var b=el('button','btn sm'+(ansTab===sk?'':' sec'),sk==='listening'?'Listening answers':'Reading answers');b.onclick=function(){ansTab=sk;render();};tabs.appendChild(b);});
  main.appendChild(tabs);
  main.appendChild(el('div','rub','<p style="margin:0">Set the correct answer for each question. For typed answers you can add <b>several accepted answers</b> (for example "colour" and "color", or "10" and "ten"). Brackets make words optional: <b>(the) museum</b> accepts "museum" and "the museum". Tick <b>Case-sensitive</b> only if capital letters must match exactly.</p>'));
  var Q=walkQuestions(M,ansTab);
  if(!Q.length){main.appendChild(el('p','muted','No '+ansTab+' questions yet.'));}
  var done={};
  Q.forEach(function(x){
    var g=x.g,row=el('div','ans');
    if(g.type==='mcq_multi'){if(done[x.num])return;}
    if(!Array.isArray(g.answers)&&g.type!=='mcq_multi')g.answers=[];
    var num=el('div','n',String(x.num));
    var body=el('div');
    var ctx='';
    if(g.type==='completion'){var parts=String(g.content||'').split(/_{3,}/);var before=(parts[x.idx]||'').split('\n').pop().slice(-60),after=(parts[x.idx+1]||'').split('\n')[0].slice(0,40);ctx='…'+esc(before)+' <b>[ '+x.num+' ]</b> '+esc(after)+'…';}
    if(g.type==='tfng')ctx=esc(lines(g.statements)[x.idx]);
    if(g.type==='mcq')ctx=esc((g.questions[x.idx]||{}).stem);
    if(g.type==='matching')ctx=esc(lines(g.items)[x.idx]);
    if(g.type==='mcq_multi'){var c=groupCount(g),nums=[];for(var k=0;k<c;k++){nums.push(x.num+k);done[x.num+k]=1;}num.textContent=nums.join('–');ctx=esc(g.stem)+' <span class="muted">(choose '+c+')</span>';}
    body.appendChild(el('div','actx',ctx||'<span class="muted">Question '+x.num+'</span>'));
    if(g.type==='completion'&&!g.useList){
      var a=g.answers[x.idx]=g.answers[x.idx]||{list:[],cs:false};
      var chips=el('div','chips');
      function drawChips(){chips.innerHTML='';(a.list||[]).forEach(function(v,i){var ch=el('span','chip',esc(v)+'<button title="Remove">×</button>');ch.querySelector('button').onclick=function(){a.list.splice(i,1);save();drawChips();};chips.appendChild(ch);});
        var t=el('input');t.type='text';t.className='chipin';t.placeholder=a.list.length?'Add another accepted answer':'Type the answer, press Enter';
        function add(){var v=t.value.trim();t.value='';if(!v||a.list.indexOf(v)>=0)return false;a.list.push(v);save();return true;}
        t.onkeydown=function(e){if((e.key==='Enter'||e.key===',')&&t.value.trim()){e.preventDefault();add();drawChips();chips.querySelector('input.chipin').focus();}};
        t.onblur=function(){if(add())drawChips();};
        chips.appendChild(t);
        var cs=el('label','chk','<input type="checkbox"'+(a.cs?' checked':'')+'> Case-sensitive');cs.querySelector('input').onchange=function(e){a.cs=e.target.checked;save();};chips.appendChild(cs);}
      drawChips();body.appendChild(chips);
    }else if(g.type==='mcq_multi'){
      var set=g.answers&&g.answers.set?g.answers.set:(g.answers={set:[]}).set,L=letters(lines(g.options).length,'letter'),w=el('div','row');
      L.forEach(function(l){var cb=el('label','chk','<input type="checkbox" value="'+l+'"'+(set.indexOf(l)>=0?' checked':'')+'> '+l+' <span class="muted">'+esc(lines(g.options)[L.indexOf(l)]).slice(0,40)+'</span>');
        cb.querySelector('input').onchange=function(e){var i=set.indexOf(l);if(e.target.checked&&i<0)set.push(l);if(!e.target.checked&&i>=0)set.splice(i,1);set.sort();save();};w.appendChild(cb);});
      body.appendChild(w);body.appendChild(el('div','hint','Tick exactly '+groupCount(g)+'. The student gets one mark for each correct letter, in any order.'));
    }else{
      var a2=g.answers[x.idx]=g.answers[x.idx]||{v:''},opts=[];
      if(g.type==='tfng')opts=g.kind==='YNNG'?['YES','NO','NOT GIVEN']:['TRUE','FALSE','NOT GIVEN'];
      if(g.type==='mcq')opts=letters(lines((g.questions[x.idx]||{}).options).length,'letter');
      if(g.type==='matching')opts=letters(lines(g.options).length,g.style==='roman'?'roman':'letter');
      if(g.type==='completion')opts=letters(lines(g.options).length,'letter');
      var s=el('select','t');s.style.maxWidth='260px';s.innerHTML='<option value="">— choose the correct answer —</option>'+opts.map(function(o){return '<option'+(a2.v===o?' selected':'')+'>'+o+'</option>';}).join('');
      s.onchange=function(){a2.v=s.value;save();};body.appendChild(s);
    }
    row.appendChild(num);row.appendChild(body);main.appendChild(row);
  });
  main.appendChild(nextBtn('review','Next: Check & take'));
}

/* ---------- step 6: review ---------- */
function stepReview(){
  var v=validateMock(M);
  [['listening','Listening'],['reading','Reading'],['writing','Writing']].forEach(function(s){
    var c=el('div','card'),ok=!v[s[0]].length;
    c.innerHTML='<div class="mrow"><h3>'+s[1]+' '+(ok?'<span class="score">✓ ready</span>':'<span style="color:#c00;font-size:14px">needs work</span>')+'</h3>'+
      (ok?'<a class="btn" style="background:#1b7f3a;border-color:#1b7f3a;font-weight:700" href="take.html?id='+M.id+'&s='+s[0]+'">▶ Start '+s[1]+' test</a>':'<span class="muted">Fix the items below to unlock the test</span>')+'</div>'+
      (ok?'':'<ul class="check">'+v[s[0]].map(function(x){return '<li class="no">'+esc(x)+'</li>';}).join('')+'</ul>');
    main.appendChild(c);
  });
  var r=el('div','row');r.style.marginTop='14px';
  var ex=el('button','btn sec','Export this mock (backup / share)');ex.onclick=function(){Store.exportMock(M).then(function(b){var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=M.name.replace(/[^\w\- ]+/g,'')+'.ielts-mock.json';a.click();});};
  r.appendChild(ex);var h=el('a','btn sec','Back to all mocks');h.href='index.html';r.appendChild(h);main.appendChild(r);
}
/* ---------- load ---------- */
if(P.get('id'))Store.get(P.get('id')).then(function(m){if(!m){main.innerHTML='<p>Mock not found. <a href="index.html">Back</a></p>';return;}M=m;step=P.get('step')||'listening';render();});
else{M=newMock('');render();}
})();
