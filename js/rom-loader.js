var RomLoader=(function(){
  'use strict';
  var EJS='https://cdn.emulatorjs.org/stable/data/';
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
    c.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:300px;background:#000;color:#ffcc00;font-family:monospace;text-align:center;padding:24px;gap:12px">'+html+'</div>';
  }
  function startEmu(c,blobUrl,core){
    c.innerHTML='<div id="ejs-target" style="width:100%;height:100%;min-height:300px"></div>';
    window.EJS_player='#ejs-target';
    window.EJS_core=core;
    window.EJS_pathtodata=EJS;
    window.EJS_gameUrl=blobUrl;
    window.EJS_startOnLoaded=true;
    window.EJS_color='#ffcc00';
    window.EJS_adUrl='';window.EJS_adMode=0;
    window.EJS_VirtualGamepad=true;
    window.EJS_GamepadOnLeft=false;
    window.EJS_fullscreenOnLoaded=false;
    window.EJS_cheats=false;
    window.EJS_mute=false;
    window.EJS_volume=0.8;
    window.EJS_hapticFeedback=true;
    if(navigator.vibrate){
      document.addEventListener('touchstart',function(e){
        var t=e.target;
        if(t.closest&&(t.closest('.ejs_virtualGamepad')||t.closest('[class*="gamepad"]')||t.closest('[class*="button"]')||t.closest('[class*="dpad"]'))){
          navigator.vibrate(18);
        }
      },{passive:true});
    }
    var old=document.getElementById('ejs-script');
    if(old)old.remove();
    var s=document.createElement('script');
    s.id='ejs-script';s.src=EJS+'loader.js';
    s.onerror=function(){showMsg(c,'❌ EmulatorJS CDN unreachable.<br><small style="color:#888">Check connection and reload.</small>');};
    document.body.appendChild(s);
  }
  function load(romUrl,core,containerId){
    var c=document.getElementById(containerId||'game');
    if(!c)return;
    unlockAudio();
    showMsg(c,'<span style="font-size:2rem">⏳</span><div>Loading ROM…</div><div id="rl-status" style="font-size:.75rem;color:#aaa">Connecting…</div><div style="width:200px;height:4px;background:#1a1a2e;border-radius:2px;overflow:hidden"><div id="rl-bar" style="height:100%;width:0%;background:#ffcc00;transition:width .3s"></div></div>');
    function status(msg,pct){
      var el=document.getElementById('rl-status');var bar=document.getElementById('rl-bar');
      if(el)el.textContent=msg;if(bar&&pct!==undefined)bar.style.width=pct+'%';
    }
    function fetchRom(i,lastErr){
      if(i>=PROXIES.length)return Promise.reject(lastErr||new Error('All sources failed'));
      var prefix=PROXIES[i];
      var url=prefix?(prefix+encodeURIComponent(romUrl)):romUrl;
      status(prefix?'Trying mirror '+i+'…':'Downloading…',10+i*20);
      return fetch(url).then(function(r){
        if(!r.ok)throw new Error('HTTP '+r.status);
        var kb=r.headers.get('content-length');
        if(kb)status('Downloading '+Math.round(kb/1024)+' KB…',50);else status('Downloading…',40);
        return r.arrayBuffer();
      }).catch(function(err){return fetchRom(i+1,err);});
    }
    fetchRom(0).then(function(buf){
      status('Starting…',90);
      var blob=new Blob([buf]);
      var blobUrl=URL.createObjectURL(blob);
      startEmu(c,blobUrl,core);
    }).catch(function(err){
      showMsg(c,'❌ ROM failed to load.<br><small style="color:#888">'+err.message+'</small><br><button onclick="location.reload()" style="margin-top:12px;padding:8px 18px;background:#ffcc00;color:#000;border:none;border-radius:6px;font-weight:bold;cursor:pointer">↺ Retry</button>');
    });
  }
  return{load:load};
}());
