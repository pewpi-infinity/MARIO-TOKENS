(function(){
  'use strict';
  function init(){
    var toggle=document.getElementById('nav-toggle');
    var hamburger=document.querySelector('.hamburger');
    var drawer=document.querySelector('.nav-drawer');
    if(!toggle||!hamburger||!drawer)return;
    drawer.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',function(){toggle.checked=false;});
    });
    document.addEventListener('touchstart',function(e){
      if(toggle.checked&&!drawer.contains(e.target)&&!hamburger.contains(e.target)){toggle.checked=false;}
    },{passive:true});
    document.addEventListener('click',function(e){
      if(toggle.checked&&!drawer.contains(e.target)&&!hamburger.contains(e.target)){toggle.checked=false;}
    });
    var cur=window.location.pathname.split('/').pop().split('?')[0]||'index.html';
    drawer.querySelectorAll('a').forEach(function(a){
      var href=(a.getAttribute('href')||'').split('/').pop().split('?')[0];
      if(href===cur){a.classList.add('nav-active');a.setAttribute('aria-current','page');}
    });
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
}());
