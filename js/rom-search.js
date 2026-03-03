var RomSearch=(function(){
  'use strict';
  var IA='https://archive.org/advancedsearch.php';
  var SYS_Q={
    nes:'mediatype:software AND (subject:NES OR subject:"Nintendo Entertainment System")',
    snes:'mediatype:software AND (subject:SNES OR subject:"Super Nintendo")',
    segaMD:'mediatype:software AND (subject:Genesis OR subject:"Mega Drive" OR subject:Sega)'
  };
  var EXT={nes:'.nes',snes:'.sfc',segaMD:'.md'};
  function search(query,core,callback){
    if(!query||!callback)return;
    var q='('+query+') AND '+(SYS_Q[core]||SYS_Q.nes);
    var params=new URLSearchParams({q:q,fl:'identifier,title',rows:12,page:1,output:'json'});
    fetch(IA+'?'+params)
      .then(function(r){return r.json();})
      .then(function(data){
        var docs=(data&&data.response&&data.response.docs)||[];
        docs=docs.filter(function(d){
          var t=(d.title||d.identifier||'').toLowerCase();
          return !t.includes('manual')&&!t.includes('magazine')&&!t.includes('screenshot');
        });
        callback(null,docs);
      })
      .catch(function(err){callback(err,[]);});
  }
  function renderResults(results,container,core){
    if(!container)return;
    container.innerHTML='';
    if(!results||!results.length){
      container.innerHTML='<div style="padding:12px;color:#888;font-size:.75rem">No ROMs found. Try a different search.</div>';
      return;
    }
    var ext=EXT[core]||'.nes';
    results.forEach(function(item){
      var row=document.createElement('div');
      row.style.cssText='display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid rgba(255,204,0,.08)';
      var title=document.createElement('span');
      title.style.cssText='font-size:.75rem;color:#e0e0e0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      title.textContent=item.title||item.identifier;
      var btn=document.createElement('button');
      btn.textContent='LOAD';
      btn.style.cssText='padding:5px 12px;background:#ffcc00;color:#000;border:none;border-radius:4px;font-size:.7rem;font-weight:bold;cursor:pointer;flex-shrink:0';
      btn.addEventListener('click',function(){
        if(navigator.vibrate)navigator.vibrate(20);
        btn.textContent='…';btn.disabled=true;
        fetch('https://archive.org/metadata/'+item.identifier+'/files')
          .then(function(r){return r.json();})
          .then(function(meta){
            var files=meta.result||[];
            var rom=files.find(function(f){return f.name&&f.name.toLowerCase().endsWith(ext);});
            if(!rom)rom=files.find(function(f){return f.name&&f.name.toLowerCase().endsWith('.zip');});
            if(rom&&window.RomLoader){
              RomLoader.load('https://archive.org/download/'+item.identifier+'/'+encodeURIComponent(rom.name),core,'game');
              container.innerHTML='<div style="padding:10px;color:#ffcc00;font-size:.75rem">✓ Loading: '+(item.title||item.identifier)+'</div>';
            }else{btn.textContent='✗';setTimeout(function(){btn.textContent='LOAD';btn.disabled=false;},2000);}
          })
          .catch(function(){btn.textContent='LOAD';btn.disabled=false;});
      });
      row.appendChild(title);row.appendChild(btn);
      container.appendChild(row);
    });
  }
  return{search:search,renderResults:renderResults};
}());
