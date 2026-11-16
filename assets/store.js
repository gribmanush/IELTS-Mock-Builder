/* IndexedDB storage for mocks and audio/image blobs (stays in this browser) */
window.Store=(function(){
  var dbp=null;
  function db(){if(dbp)return dbp;dbp=new Promise(function(res,rej){var r=indexedDB.open('ielts-mock-builder',1);
    r.onupgradeneeded=function(){var d=r.result;if(!d.objectStoreNames.contains('mocks'))d.createObjectStore('mocks',{keyPath:'id'});if(!d.objectStoreNames.contains('blobs'))d.createObjectStore('blobs');};
    r.onsuccess=function(){res(r.result);};r.onerror=function(){rej(r.error);};});return dbp;}
  function tx(store,mode,fn){return db().then(function(d){return new Promise(function(res,rej){var t=d.transaction(store,mode),s=t.objectStore(store),out=fn(s);t.oncomplete=function(){res(out&&out.result!==undefined?out.result:out);};t.onerror=function(){rej(t.error);};});});}
  return {
    list:function(){return tx('mocks','readonly',function(s){return s.getAll();}).then(function(a){return (a||[]).sort(function(x,y){return y.updated-x.updated;});});},
    get:function(id){return tx('mocks','readonly',function(s){return s.get(id);});},
    save:function(m){m.updated=Date.now();return tx('mocks','readwrite',function(s){s.put(m);});},
    remove:function(id){return tx('mocks','readwrite',function(s){s.delete(id);});},
    putBlob:function(id,blob){return tx('blobs','readwrite',function(s){s.put(blob,id);});},
    getBlob:function(id){return tx('blobs','readonly',function(s){return s.get(id);});},
    delBlob:function(id){return tx('blobs','readwrite',function(s){s.delete(id);});},
    exportMock:function(m){var self=this;var copy=JSON.parse(JSON.stringify(m));
      var p=m.listening.audioId?self.getBlob(m.listening.audioId).then(function(b){if(!b)return;return new Promise(function(res){var fr=new FileReader();fr.onload=function(){copy.listening.audioData=fr.result;res();};fr.readAsDataURL(b);});}):Promise.resolve();
      return p.then(function(){copy.format='ielts-mock-v1';return new Blob([JSON.stringify(copy)],{type:'application/json'});});},
    importMock:function(obj){var self=this;if(!obj||obj.format!=='ielts-mock-v1'||!obj.listening)return Promise.reject(new Error('This is not a mock test file.'));
      obj.id='m'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);var data=obj.listening.audioData;delete obj.listening.audioData;delete obj.format;
      var p=Promise.resolve();
      if(data){obj.listening.audioId=obj.id+'_audio';p=fetch(data).then(function(r){return r.blob();}).then(function(b){return self.putBlob(obj.listening.audioId,b);});}
      else obj.listening.audioId=null;
      return p.then(function(){return self.save(obj);}).then(function(){return obj;});}
  };
})();
