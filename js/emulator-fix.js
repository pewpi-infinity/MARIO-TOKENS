(function () {
  'use strict';
  var EJS_PATH = 'https://cdn.emulatorjs.org/stable/data/';
  var ROM_URLS = {
    mario1:  'https://archive.org/download/nintendo-usa-set-1/Super%20Mario%20Bros.%20(World).nes',
    mario3:  'https://archive.org/download/nintendo-usa-set-1/Super%20Mario%20Bros.%203%20(USA).nes',
    zelda:   'https://archive.org/download/nintendo-usa-set-1/Legend%20of%20Zelda%2C%20The%20(USA).nes',
    contra:  'https://archive.org/download/nintendo-usa-set-1/Contra%20(USA).nes',
    metroid: 'https://archive.org/download/nintendo-usa-set-1/Metroid%20(USA).nes'
  };
  var _trackedRom = 'mario1';
  var _ejsLoaded  = false;

  function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
           navigator.maxTouchPoints > 1;
  }

  function patch() {
    if (!window.ArcadeHub) { setTimeout(patch, 150); return; }

    var _origSelect = ArcadeHub.selectGame;
    ArcadeHub.selectGame = function (rom, el) {
      _trackedRom = rom || 'mario1';
      return _origSelect.call(this, rom, el);
    };

    ArcadeHub.launchEmulator = function () {
      var container = document.getElementById('emulator-container');
      if (!container) return;

      if (_ejsLoaded) {
        container.innerHTML =
          '<div style="padding:24px;text-align:center;color:var(--gold)">' +
          '<p>Reload page to switch games.</p>' +
          '<p style="margin-top:14px"><a href="pages/nes-emulator.html" ' +
          'style="color:var(--gold);text-decoration:underline;font-weight:700">' +
          '&#9654; Full NES Emulator Page</a></p></div>';
        return;
      }

      var romUrl = ROM_URLS[_trackedRom] || ROM_URLS.mario1;
      var mobile = isMobile();
      container.innerHTML =
        '<div id="ejs-game" style="width:100%;max-width:100%;height:' +
        (mobile ? '540px' : '480px') + ';display:block;"></div>';

      window.EJS_player            = '#ejs-game';
      window.EJS_core              = 'nes';
      window.EJS_pathtodata        = EJS_PATH;
      window.EJS_gameUrl           = romUrl;
      window.EJS_startOnLoaded     = true;
      window.EJS_color             = '#ffcc00';
      window.EJS_adUrl             = '';
      window.EJS_adMode            = 0;
      window.EJS_VirtualGamepad    = mobile;
      window.EJS_GamepadOnLeft     = false;
      window.EJS_fullscreenOnLoaded = false;

      var s = document.createElement('script');
      s.src = EJS_PATH + 'loader.js';
      s.onerror = function () {
        container.innerHTML =
          '<p style="color:var(--red-alert);padding:20px;text-align:center">' +
          '&#x274C; EmulatorJS failed to load.</p>';
      };
      document.body.appendChild(s);
      _ejsLoaded = true;

      if (window.Treasury) {
        Treasury.registerScriptVersion(
          'game-' + _trackedRom, _trackedRom, 'player1', 'loaded: ' + _trackedRom);
      }
      console.log('[EMULATOR-FIX]', _trackedRom, mobile ? '(touch)' : '(keyboard)');
    };

    var ph = document.getElementById('emulator-placeholder');
    if (ph) {
      var old = ph.querySelector('a[href*="Emulator-"]');
      if (old) { old.textContent = 'EmulatorJS'; old.href = 'https://emulatorjs.org'; old.target = '_blank'; }
    }
    console.log('[EMULATOR-FIX] ready, mobile=' + isMobile());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patch);
  } else { patch(); }
}());
