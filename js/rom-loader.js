var RomLoader=(function(){
  'use strict';
  var EJS='https://cdn.emulatorjs.org/stable/data/';
  var EXT={nes:'.nes',snes:'.sfc',segaMD:'.md'};
  var SYS_Q={
    nes:'mediatype:software AND (subject:NES OR subject:"Nintendo Entertainment System")',
    snes:'mediatype:software AND (subject:SNES OR subject:"Super Nintendo")',
    segaMD:'mediatype:software AND (subject:Genesis OR subject:"Mega Drive" OR subject:Sega)'
  };
  var PROXIES=['','https://corsproxy.io/?url=','https://api.allorigins.win/raw?url='];
  function unlockAudio(){
    var ctx;
    function u(){
      if(!ctx){try{ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}
      if(ctx&&ctx.state==='suspended')ctx.resume();
      document.removeEventListener('touchstart',u);
      document.removeEventListener('click',u);
    }
    document.addEventListener('touchstart',u,{passive:true});
    document.addEventListener('click',u);
  }
  function showMsg(c,html){
    c.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;background:#000;color:#ffcc00;font-family:monospace;text-align:center;padding:20px;gap:12px">'+html+'</div>';
  }
  function status(msg,pct){
    var el=document.getElementById('rl-s');var bar=document.getElementById('rl-b');
    if(el)el.textContent=msg;if(bar&&pct!=null)bar.style.width=pct+'%';
  }
  function startEmu(c,blobUrl,core){
    c.innerHTML='<div id="ejs-target" style="width:100%;height:100%;min-height:300px"></div>';
    window.EJS_player='#ejs-target';window.EJS_core=core;
    window.EJS_pathtodata=EJS;window.EJS_gameUrl=blobUrl;
    window.EJS_startOnLoaded=true;window.EJS_color='#ffcc00';
    window.EJS_adUrl='';window.EJS_adMode=0;
    window.EJS_VirtualGamepad=true;
    window.EJS_GamepadOnLeft=false;
    window.EJS_fullscreenOnLoaded=false;
    window.EJS_cheats=false;window.EJS_mute=false;
    window.EJS_volume=0.8;window.EJS_hapticFeedback=true;
    if(navigator.vibrate){
      document.addEventListener('touchstart',function(e){
        var t=e.target;
        if(t.closest&&(t.closest('.ejs_virtualGamepad')||t.closest('[class*="gamepad"]')||t.closest('[class*="dpad"]')||t.closest('[class*="button"]'))){
          navigator.vibrate(18);
        }
      },{passive:true});
    }
    var old=document.getElementById('ejs-script');if(old)old.remove();
    var s=document.createElement('script');
    s.id='ejs-script';s.src=EJS+'loader.js';
    s.onerror=function(){showMsg(c,'❌ EmulatorJS CDN unreachable<br><button onclick="location.reload()" style="margin-top:10px;padding:6px 16px;background:#ffcc00;color:#000;border:none;border-radius:4px;font-weight:bold;cursor:pointer">Retry</button>');};
    document.body.appendChild(s);
  }
  function fetchRom(url,idx){
    if(idx>=PROXIES.length)return Promise.reject(new Error('All download sources failed'));
    var src=PROXIES[idx]?PROXIES[idx]+encodeURIComponent(url):url;
    status('Downloading'+(idx>0?' (mirror '+idx+')':'')+'…',20+idx*20);
    return fetch(src).then(function(r){
      if(!r.ok)throw new Error('HTTP '+r.status);
      return r.arrayBuffer();
    }).catch(function(){return fetchRom(url,idx+1);});
  }
  function findOnArchive(title,core){
    var q='title:("'+title+'") AND '+SYS_Q[core];
    var params=new URLSearchParams({q:q,fl:'identifier,title',rows:5,output:'json'});
    status('Searching Archive.org…',8);
    return fetch('https://archive.org/advancedsearch.php?'+params)
      .then(function(r){return r.json();})
      .then(function(data){
        var docs=(data&&data.response&&data.response.docs)||[];
        if(!docs.length)throw new Error('Not found: '+title);
        var ext=EXT[core]||'.nes';
        function tryDoc(i){
          if(i>=docs.length)throw new Error('No playable ROM found for: '+title);
          var id=docs[i].identifier;
          status('Checking: '+id,12);
          return fetch('https://archive.org/metadata/'+id+'/files')
            .then(function(r){return r.json();})
            .then(function(meta){
              var files=meta.result||[];
              var rom=files.find(function(f){return f.name&&f.name.toLowerCase().endsWith(ext);});
              if(!rom)rom=files.find(function(f){return f.name&&f.name.toLowerCase().endsWith('.zip');});
              if(rom)return 'https://archive.org/download/'+id+'/'+encodeURIComponent(rom.name);
              return tryDoc(i+1);
            });
        }
        return tryDoc(0);
      });
  }
  function load(romUrlOrTitle,core,containerId,isSearch){
    var c=document.getElementById(containerId||'game');
    if(!c)return;
    unlockAudio();
    showMsg(c,'<span style="font-size:2rem">⏳</span><div id="rl-s" style="font-size:.8rem;color:#aaa;max-width:260px">Starting…</div><div style="width:220px;height:5px;background:#111;border-radius:3px;overflow:hidden"><div id="rl-b" style="height:100%;width:0%;background:#ffcc00;transition:width .4s"></div></div>');
    var doLoad=isSearch?findOnArchive(romUrlOrTitle,core):Promise.resolve(romUrlOrTitle);
    doLoad.then(function(url){return fetchRom(url,0);})
      .then(function(buf){
        status('Starting emulator…',92);
        startEmu(c,URL.createObjectURL(new Blob([buf])),core);
      })
      .catch(function(err){
        showMsg(c,'❌ Could not load game<br><small style="color:#888">'+err.message+'</small><br><button onclick="location.reload()" style="margin-top:12px;padding:8px 20px;background:#ffcc00;color:#000;border:none;border-radius:6px;font-weight:bold;cursor:pointer">↺ Retry</button>');
      });
  }
  function search(title,core,containerId){load(title,core,containerId,true);}
  return{load:load,search:search};
}());
