/* rom-loader.js
   Fetches a ROM via CORS proxy into a local Blob URL, then starts EmulatorJS.
   Blob URLs are same-origin — no CORS, no decompression errors.
   EJS_VirtualGamepad = true gives real touch d-pad + A/B/Start/Select on Android.
*/
var RomLoader = (function () {
  'use strict';

  var EJS_PATH = 'https://cdn.emulatorjs.org/stable/data/';
  var PROXY    = 'https://corsproxy.io/?url=';

  function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
           navigator.maxTouchPoints > 1;
  }

  function showMsg(container, html) {
    container.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;' +
      'justify-content:center;height:100%;background:#000;color:#ffcc00;' +
      'font-family:sans-serif;text-align:center;padding:16px">' + html + '</div>';
  }

  function startEmulator(container, blobUrl, core) {
    var mobile = isMobile();

    /* EmulatorJS needs an empty target div */
    container.innerHTML = '<div id="ejs-target" style="width:100%;height:100%"></div>';

    window.EJS_player            = '#ejs-target';
    window.EJS_core              = core;
    window.EJS_pathtodata        = EJS_PATH;
    window.EJS_gameUrl           = blobUrl;
    window.EJS_startOnLoaded     = true;
    window.EJS_color             = '#ffcc00';
    window.EJS_adUrl             = '';
    window.EJS_adMode            = 0;
    /* ── Touch controls: real d-pad + A/B/Start/Select on Android ── */
    window.EJS_VirtualGamepad    = mobile;
    window.EJS_GamepadOnLeft     = false;
    window.EJS_fullscreenOnLoaded = false;
    window.EJS_cheats            = false;

    var old = document.getElementById('ejs-script');
    if (old) old.remove();

    var s   = document.createElement('script');
    s.id    = 'ejs-script';
    s.src   = EJS_PATH + 'loader.js';
    s.onerror = function () {
      showMsg(container,
        '&#x274C; EmulatorJS CDN unreachable.<br>' +
        '<small style="color:#888">Check connection and reload.</small>');
    };
    document.body.appendChild(s);
    console.log('[RomLoader] EmulatorJS starting | core=' + core +
                ' | mobile=' + mobile + ' | gamepad=' + mobile);
  }

  function load(romUrl, core, containerId) {
    var container = document.getElementById(containerId || 'game');
    if (!container) return;

    showMsg(container,
      '<div style="font-size:1.1rem;margin-bottom:12px">&#x23F3; Loading ROM&hellip;</div>' +
      '<div id="rl-status" style="font-size:.8rem;color:#aaa">Connecting&hellip;</div>');

    var status = function (msg) {
      var el = document.getElementById('rl-status');
      if (el) el.textContent = msg;
    };

    var proxyUrl = PROXY + encodeURIComponent(romUrl);
    status('Fetching game data via proxy&hellip;');

    fetch(proxyUrl)
      .then(function (r) {
        if (!r.ok) throw new Error('Server returned ' + r.status);
        var kb = r.headers.get('content-length');
        if (kb) status('Downloading ' + Math.round(kb / 1024) + ' KB&hellip;');
        else    status('Downloading&hellip;');
        return r.arrayBuffer();
      })
      .then(function (buf) {
        status('Starting emulator&hellip;');
        var blob    = new Blob([buf]);
        var blobUrl = URL.createObjectURL(blob);
        startEmulator(container, blobUrl, core);
      })
      .catch(function (err) {
        console.error('[RomLoader]', err);
        showMsg(container,
          '&#x274C; ROM failed to load.<br>' +
          '<small style="color:#888">' + err.message + '</small><br><br>' +
          '<small style="color:#aaa">Try a different game or reload the page.</small>');
      });
  }

  return { load: load, isMobile: isMobile };
}());
