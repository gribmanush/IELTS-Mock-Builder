/* Turns a saved mock into the same data format the test player uses */
(function(){
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function inline(t){return esc(t).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');}
function para(t){return lines0(t).map(function(l){return '<p>'+inline(l)+'</p>';}).join('');}
function lines0(t){return String(t||'').split(/\n/).map(function(s){return s.trim();}).filter(Boolean);}
function gapInput(n){return '<input class="gap" type="text" data-q="'+n+'" placeholder="'+n+'" autocomplete="off" spellcheck="false">';}
function gapSelect(n,opts){return '<select class="gap drop" data-q="'+n+'"><option value="">'+n+'</option>'+opts.map(function(o){return '<option value="'+o+'">'+o+'</option>';}).join('')+'</select>';}
function qline(n,inner){return '<div class="qitem" data-qi="'+n+'"><span class="qno">'+n+'</span><div class="qbody">'+inner+'</div></div>';}
function radios(n,opts,vals){return '<div class="mcq" data-q="'+n+'">'+opts.map(function(o,i){return '<label class="opt"><input type="radio" name="q'+n+'" value="'+esc(vals[i])+'"><span class="otext">'+o+'</span></label>';}).join('')+'</div>';}
function optbox(title,labels,texts){return '<div class="optbox">'+(title?'<div class="optbox-title">'+inline(title)+'</div>':'')+texts.map(function(t,i){return '<div class="optrow"><b>'+labels[i]+'</b><span>'+inline(t)+'</span></div>';}).join('')+'</div>';}
/* completion text: ___ = answer box; "- " bullet; "|" table row; "# " bold heading; blank line = space */
function completionHTML(g,start,dropOpts){
  var n=start,out='',rows=[],bul=[];
  function gaps(s){return s.replace(/_{3,}/g,function(){var q=n++;return dropOpts?gapSelect(q,dropOpts):gapInput(q);});}
  function flushT(){if(!rows.length)return;out+='<table>'+rows.map(function(r,ri){return '<tr>'+r.map(function(c){return (ri===0&&rows.length>1?'<th>':'<td>')+gaps(inline(c))+(ri===0&&rows.length>1?'</th>':'</td>');}).join('')+'</tr>';}).join('')+'</table>';rows=[];}
  function flushB(){if(!bul.length)return;out+='<ul>'+bul.map(function(b){return '<li>'+gaps(inline(b))+'</li>';}).join('')+'</ul>';bul=[];}
  String(g.content||'').split('\n').forEach(function(raw){
    var l=raw.replace(/\s+$/,'');
    if(/\|/.test(l)){flushB();rows.push(l.replace(/^\s*\|/,'').replace(/\|\s*$/,'').split('|').map(function(c){return c.trim();}));return;}
    flushT();
    if(/^\s*[-•*]\s+/.test(l)){bul.push(l.replace(/^\s*[-•*]\s+/,''));return;}
    flushB();
    if(!l.trim()){return;}
    if(/^\s*#\s*/.test(l)){out+='<p><strong>'+gaps(inline(l.replace(/^\s*#\s*/,'')))+'</strong></p>';return;}
    out+='<p>'+gaps(inline(l))+'</p>';
  });
  flushT();flushB();return out;
}
function groupHTML(g,start,key){
  var c=groupCount(g),end=start+c-1,h='<h3 class="qhead">'+(c>1?'Questions '+start+'–'+end:'Question '+start)+'</h3>';
  h+=para(g.instr);
  if(g.image)h+='<img src="'+g.image+'">';
  if(g.title)h+='<p class="gtitle"><strong>'+inline(g.title)+'</strong></p>';
  var A=g.answers||[];
  function textKey(i,q){var a=A[i]||{};key[q]={a:(a.list||[]).filter(Boolean),cs:!!a.cs};}
  function choiceKey(i,q){var a=A[i]||{};key[q]={a:a.v?[a.v]:[],cs:true};}
  if(g.type==='completion'){
    var drop=g.useList?letters(lines0(g.options).length,'letter'):null;
    if(drop)h+=optbox(g.listTitle||'',drop,lines0(g.options));
    h+=completionHTML(g,start,drop);
    for(var i=0;i<c;i++){if(drop)choiceKey(i,start+i);else textKey(i,start+i);}
  }else if(g.type==='tfng'){
    var o=g.kind==='YNNG'?['YES','NO','NOT GIVEN']:['TRUE','FALSE','NOT GIVEN'];
    lines(g.statements).forEach(function(s,i){h+=qline(start+i,'<div class="stem">'+inline(s)+'</div>'+radios(start+i,o,o));choiceKey(i,start+i);});
  }else if(g.type==='mcq'){
    (g.questions||[]).forEach(function(q,i){var ops=lines0(q.options),L=letters(ops.length,'letter');
      h+=qline(start+i,'<div class="stem">'+inline(q.stem)+'</div>'+radios(start+i,ops.map(function(t,j){return '<b>'+L[j]+'</b>&nbsp; '+inline(t);}),L));choiceKey(i,start+i);});
  }else if(g.type==='mcq_multi'){
    var ops=lines0(g.options),L=letters(ops.length,'letter'),qs=[];for(var k=0;k<c;k++)qs.push(start+k);
    if(g.stem)h+='<p>'+inline(g.stem)+'</p>';
    h+='<div class="cbgroup" data-qs="'+qs.join(',')+'" data-max="'+c+'"><div class="cbhead">'+qs.map(function(q){return '<span class="qno">'+q+'</span>';}).join(' ')+'</div>'+
      ops.map(function(t,j){return '<label class="opt"><input type="checkbox" value="'+L[j]+'"><span class="otext"><b>'+L[j]+'</b>&nbsp; '+inline(t)+'</span></label>';}).join('')+'</div>';
    var set=((g.answers&&g.answers.set)||[]).slice();qs.forEach(function(q){key[q]={a:set,cs:true,multi:true};});
  }else if(g.type==='matching'){
    var ops2=lines0(g.options),L2=letters(ops2.length,g.style==='roman'?'roman':'letter');
    h+=optbox(g.listTitle,L2,ops2);
    if(g.reuse)h+='<p class="note">NB You may use any letter more than once.</p>';
    lines(g.items).forEach(function(it,i){h+=qline(start+i,'<span>'+inline(it)+'</span> '+gapSelect(start+i,L2));choiceKey(i,start+i);});
  }
  return h;
}
function passageHTML(p){
  var h=p.title?'<h2 class="ptitle">'+inline(p.title)+'</h2>':'';
  String(p.text||'').split(/\n\s*\n/).forEach(function(par){par=par.trim();if(!par)return;
    if(/^#\s*/.test(par)){h+='<p><strong>'+inline(par.replace(/^#\s*/,''))+'</strong></p>';return;}
    var m=par.match(/^([A-Z])\s{1,3}(?=[A-Z"'“‘(])/);
    h+=m?'<p><strong>'+m[1]+'</strong>&nbsp; '+inline(par.slice(m[0].length)).replace(/\n/g,' ')+'</p>':'<p>'+inline(par).replace(/\n/g,'<br>')+'</p>';});
  return h;
}
window.compileMock=function(mock,skill){
  var key={},parts=[],n=1;
  if(skill==='writing'){
    mock.writing.tasks.forEach(function(t,i){parts.push({title:'Part '+(i+1),task:i+1,left:(t.prompt?'<p><strong>WRITING TASK '+(i+1)+'</strong></p>'+para(t.prompt):'')+(t.image?'<img src="'+t.image+'">':'')+'<p class="note">Write at least '+(i?250:150)+' words.</p>'});});
    return {parts:parts};
  }
  var secs=skill==='listening'?mock.listening.parts:mock.reading.passages;
  secs.forEach(function(sec,si){
    var html='',qs=[],groups=[];
    (sec.groups||[]).forEach(function(g){var c=groupCount(g);html+=groupHTML(g,n,key);
      for(var i=0;i<c;i++)qs.push(n+i);
      if(g.type==='mcq_multi'&&c>1){var gq=[];for(var j=0;j<c;j++)gq.push(n+j);groups.push(gq);}
      n+=c;});
    var part={title:'Part '+(si+1),right:html,q:qs,groups:groups};
    if(skill==='reading')part.left=passageHTML(sec);
    parts.push(part);
  });
  return {parts:parts,key:key};
};
window.mockHelpers={esc:esc,inline:inline,completionHTML:completionHTML,passageHTML:passageHTML,groupHTML:groupHTML};
})();
