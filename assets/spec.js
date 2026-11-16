/* IELTS Academic structure + question group types (from analysis of Books 1-21) */
window.SPEC={
  listening:{parts:4,perPart:10,total:40,minutes:null},
  reading:{passages:3,total:40,minutes:60,suggested:[13,13,14]},
  writing:{tasks:[{n:1,minutes:20,words:150},{n:2,minutes:40,words:250}]},
  types:{
    completion:{label:'Gap completion (notes, form, table, sentence, summary, flow-chart, short answer)',
      instr:'Complete the notes below.\nWrite ONE WORD AND/OR A NUMBER for each answer.'},
    tfng:{label:'TRUE / FALSE / NOT GIVEN  (or YES / NO / NOT GIVEN)',
      instr:'Do the following statements agree with the information given in the text?\nChoose TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.'},
    mcq:{label:'Multiple choice – one answer',instr:'Choose the correct letter, A, B, C or D.'},
    mcq_multi:{label:'Multiple choice – choose TWO / THREE',instr:'Choose TWO letters, A–E.'},
    matching:{label:'Matching (headings, information, features, sentence endings, map/plan/diagram labelling)',
      instr:'Choose the correct letter, A–F, for each question.'}
  },
  allowed:{listening:['completion','mcq','mcq_multi','matching'],reading:['completion','tfng','mcq','mcq_multi','matching']}
};
function groupCount(g){
  if(!g)return 0;
  switch(g.type){
    case 'completion':return ((g.content||'').match(/_{3,}/g)||[]).length;
    case 'tfng':return lines(g.statements).length;
    case 'mcq':return (g.questions||[]).length;
    case 'mcq_multi':return +g.pick||2;
    case 'matching':return lines(g.items).length;
  }return 0;
}
function lines(t){return String(t||'').split('\n').map(function(s){return s.trim();}).filter(Boolean);}
function letters(n,style){var out=[];for(var i=0;i<n;i++)out.push(style==='roman'?ROMAN[i]:String.fromCharCode(65+i));return out;}
var ROMAN=['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii','xiii','xiv','xv','xvi','xvii','xviii','xix','xx'];
function newMock(name){
  var id='m'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  return {id:id,name:name||'My mock test',created:Date.now(),updated:Date.now(),
    listening:{audioId:null,audioName:'',parts:[0,1,2,3].map(function(i){return {groups:[]};})},
    reading:{passages:[0,1,2].map(function(i){return {title:'',text:'',groups:[]};})},
    writing:{tasks:[{prompt:'',image:null},{prompt:'',image:null}]}};
}
function newGroup(type){
  var g={type:type,instr:SPEC.types[type].instr,title:'',image:null,answers:[]};
  if(type==='completion'){g.content='';g.useList=false;g.options='';}
  if(type==='tfng'){g.kind='TFNG';g.statements='';}
  if(type==='mcq'){g.questions=[{stem:'',options:''}];}
  if(type==='mcq_multi'){g.stem='';g.options='';g.pick=2;g.answers={set:[]};}
  if(type==='matching'){g.listTitle='';g.options='';g.style='letter';g.items='';g.reuse=false;}
  return g;
}
/* walk all questions of a skill in order: returns [{num, g, idx}] */
function walkQuestions(mock,skill){
  var out=[],n=1,secs=skill==='listening'?mock.listening.parts:mock.reading.passages;
  secs.forEach(function(sec,si){(sec.groups||[]).forEach(function(g){var c=groupCount(g);for(var i=0;i<c;i++)out.push({num:n++,g:g,idx:i,sec:si});});});
  return out;
}
function sectionCounts(mock,skill){
  var secs=skill==='listening'?mock.listening.parts:mock.reading.passages;
  return secs.map(function(s){return (s.groups||[]).reduce(function(a,g){return a+groupCount(g);},0);});
}
/* checks that the mock follows the IELTS structure and has every answer */
function answerMissing(g,i){
  if(g.type==='mcq_multi')return ((g.answers&&g.answers.set)||[]).length!==groupCount(g);
  var a=(g.answers||[])[i]||{};
  if(g.type==='completion'&&!g.useList)return !(a.list||[]).filter(Boolean).length;
  return !a.v;
}
function groupProblems(g){
  var p=[];
  if(g.type==='completion'&&!groupCount(g))p.push('a gap-completion group has no ___ answer boxes');
  if(g.type==='completion'&&g.useList&&lines(g.options).length<2)p.push('a word-list group needs at least 2 options');
  if(g.type==='mcq')(g.questions||[]).forEach(function(q){if(!q.stem.trim()||lines(q.options).length<3)p.push('a multiple-choice question needs a question and at least 3 options');});
  if(g.type==='mcq_multi'&&lines(g.options).length<=(+g.pick||2))p.push('a choose-TWO/THREE group needs more options than answers');
  if(g.type==='matching'&&lines(g.options).length<2)p.push('a matching group needs at least 2 options in its list');
  return p;
}
function validateMock(m){
  var R={listening:[],reading:[],writing:[]};
  var lc=sectionCounts(m,'listening');
  lc.forEach(function(c,i){if(c!==10)R.listening.push('Part '+(i+1)+' has '+c+' questions (needs exactly 10)');});
  if(!m.listening.audioId)R.listening.push('No audio uploaded');
  var rc=sectionCounts(m,'reading'),tot=rc.reduce(function(a,b){return a+b;},0);
  if(tot!==40)R.reading.push('Reading has '+tot+' questions in total (needs exactly 40)');
  rc.forEach(function(c,i){if(c<1)R.reading.push('Passage '+(i+1)+' has no questions');});
  m.reading.passages.forEach(function(p,i){if((p.text||'').trim().length<200)R.reading.push('Passage '+(i+1)+' text is missing or too short');});
  ['listening','reading'].forEach(function(sk){
    var secs=sk==='listening'?m.listening.parts:m.reading.passages,seen={};
    secs.forEach(function(s){(s.groups||[]).forEach(function(g){groupProblems(g).forEach(function(x){if(!seen[x]){seen[x]=1;R[sk].push(x.charAt(0).toUpperCase()+x.slice(1));}});});});
    var miss=walkQuestions(m,sk).filter(function(x){return answerMissing(x.g,x.idx);}).map(function(x){return x.num;});
    if(miss.length)R[sk].push('Correct answer missing for question'+(miss.length>1?'s ':' ')+miss.slice(0,12).join(', ')+(miss.length>12?'…':''));
  });
  m.writing.tasks.forEach(function(t,i){if(!(t.prompt||'').trim())R.writing.push('Task '+(i+1)+' has no question');});
  return R;
}
