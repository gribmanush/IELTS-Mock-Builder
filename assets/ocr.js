/* Photo -> text using Tesseract.js (open-source OCR, runs inside the browser).
   The OCR engine (~10 MB) is downloaded from the jsDelivr CDN the first time, so this needs internet once. */
window.OCR=(function(){
  var LIB='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',worker=null,libP=null;
  function loadLib(){if(window.Tesseract)return Promise.resolve();if(libP)return libP;
    libP=new Promise(function(res,rej){var s=document.createElement('script');s.src=LIB;s.onload=res;s.onerror=function(){libP=null;rej(new Error('Could not download the OCR engine. Check your internet connection.'));};document.head.appendChild(s);});return libP;}
  function getWorker(log){if(worker)return Promise.resolve(worker);
    return loadLib().then(function(){return Tesseract.createWorker('eng',1,{logger:log});}).then(function(w){worker=w;return w;});}
  /* make photos easier to read: upscale, greyscale, stretch contrast, apply rotation */
  function prep(img,rot){
    var w=img.naturalWidth,h=img.naturalHeight,s=Math.min(3000/Math.max(w,h),Math.max(1,2000/w));
    var c=document.createElement('canvas'),sw=Math.round(w*s),sh=Math.round(h*s),r=((rot%360)+360)%360;
    c.width=(r%180)?sh:sw;c.height=(r%180)?sw:sh;var x=c.getContext('2d');
    x.translate(c.width/2,c.height/2);x.rotate(r*Math.PI/180);x.drawImage(img,-sw/2,-sh/2,sw,sh);
    var d=x.getImageData(0,0,c.width,c.height),p=d.data,hist=new Array(256).fill(0),n=p.length/4;
    for(var i=0;i<p.length;i+=4){var g=(p[i]*0.299+p[i+1]*0.587+p[i+2]*0.114)|0;p[i]=g;hist[g]++;}
    var lo=0,hi=255,acc=0;while(acc<n*0.01&&lo<255)acc+=hist[lo++];acc=0;while(acc<n*0.01&&hi>0)acc+=hist[hi--];
    var span=Math.max(1,hi-lo);
    for(i=0;i<p.length;i+=4){var v=Math.max(0,Math.min(255,(p[i]-lo)*255/span));p[i]=p[i+1]=p[i+2]=v;}
    x.setTransform(1,0,0,1,0,0);x.putImageData(d,0,0);return c;
  }
  /* join wrapped lines back into paragraphs */
  function tidy(t,keepLines){
    t=t.replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/—/g,'—').replace(/[‘’]/g,"'").replace(/[“”]/g,'"');
    if(keepLines)return t.split('\n').map(function(l){return l.trim();}).filter(Boolean).join('\n');
    var paras=t.split(/\n\s*\n/);
    return paras.map(function(p){return p.split('\n').map(function(l){return l.trim();}).filter(Boolean)
      .reduce(function(acc,l){if(!acc)return l;if(/-$/.test(acc)&&/^[a-z]/.test(l))return acc.slice(0,-1)+l;return acc+' '+l;},'');})
      .filter(Boolean).join('\n\n');
  }
  function open(onInsert){
    var m=document.createElement('div');m.className='modal';
    m.innerHTML='<div class="mbox"><h3>Scan text from a photo</h3>'+
      '<p class="muted" style="margin-top:0">Take a clear, straight photo of the page in good light. You can pick several photos (for example 2 pages of one passage); they are read in order. Always check the text afterwards, since OCR can misread a few letters.</p>'+
      '<div class="row"><label class="btn sm sec">Choose photo(s)<input type="file" accept="image/*" multiple hidden></label>'+
      '<button class="btn sm sec" data-r="-90">⟲ Rotate left</button><button class="btn sm sec" data-r="90">⟳ Rotate right</button>'+
      '<label class="chk"><input type="checkbox" class="kl"> Keep every line break (for lists of questions or options)</label></div>'+
      '<div class="imgs"></div><div class="prog" style="display:none"><div></div></div><div class="stat muted"></div>'+
      '<label class="f">Text found (you can edit it)</label><textarea class="t out" rows="12" placeholder="The text will appear here."></textarea>'+
      '<div class="row" style="margin-top:12px;justify-content:space-between"><div class="row"><button class="btn go">Read text</button></div>'+
      '<div class="row"><button class="btn sm sec cancel">Cancel</button><button class="btn sm sec app">Add to the end</button><button class="btn sm rep">Replace text</button></div></div></div>';
    document.body.appendChild(m);
    var files=[],imgs=[],rot=0,box=m.querySelector('.imgs'),out=m.querySelector('.out'),bar=m.querySelector('.prog'),stat=m.querySelector('.stat');
    function show(){box.innerHTML='';imgs.forEach(function(im){var c=prep(im,rot);c.className='ocrimg';c.style.maxHeight='260px';c.style.width='auto';box.appendChild(c);});}
    m.querySelector('input[type=file]').onchange=function(e){files=[].slice.call(e.target.files);imgs=[];rot=0;
      Promise.all(files.map(function(f){return new Promise(function(res){var im=new Image();im.onload=function(){res(im);};im.src=URL.createObjectURL(f);});})).then(function(a){imgs=a;show();stat.textContent=a.length+' photo'+(a.length>1?'s':'')+' ready. Press "Read text".';});};
    m.querySelectorAll('[data-r]').forEach(function(b){b.onclick=function(){rot+=+b.dataset.r;show();};});
    m.querySelector('.go').onclick=function(){
      if(!imgs.length){stat.textContent='Choose a photo first.';return;}
      var go=this;go.disabled=true;bar.style.display='block';var fill=bar.firstChild,texts=[],idx=0;
      function log(L){if(L.status==='recognizing text'){fill.style.width=Math.round(((idx+L.progress)/imgs.length)*100)+'%';stat.textContent='Reading photo '+(idx+1)+' of '+imgs.length+'…';}
        else stat.textContent=(L.status||'').replace(/^\w/,function(c){return c.toUpperCase();})+'…';}
      getWorker(log).then(function(w){
        var chain=Promise.resolve();
        imgs.forEach(function(im,i){chain=chain.then(function(){idx=i;return w.recognize(prep(im,rot));}).then(function(r){texts.push(r.data.text);});});
        return chain;
      }).then(function(){out.value=tidy(texts.join('\n\n'),m.querySelector('.kl').checked);fill.style.width='100%';stat.textContent='Done. Check the text, then insert it.';go.disabled=false;})
      .catch(function(err){stat.textContent=err.message||String(err);go.disabled=false;bar.style.display='none';});
    };
    function close(){m.remove();}
    m.querySelector('.cancel').onclick=close;
    m.querySelector('.app').onclick=function(){if(out.value.trim())onInsert(out.value.trim(),'append');close();};
    m.querySelector('.rep').onclick=function(){if(out.value.trim())onInsert(out.value.trim(),'replace');close();};
  }
  return {open:open,tidy:tidy,prep:prep};
})();
