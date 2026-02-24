/* emulator-fix.js — main page emulator via Archive.org embed iframes */
(function () {
  'use strict';

  /* Archive.org game identifiers — match data/games.json archive_id */
  var IA = {
    mario1:  'https://archive.org/embed/super-mario-bros-nes',
    mario3:  'https://archive.org/embed/super-mario-bros-3-nes',
    zelda:   'https://archive.org/embed/the-legend-of-zelda-nes',
    contra:  'https://archive.org/embed/contra-nes',
    metroid: 'https://archive.org/embed/metroid-nes'
  };

  var _rom = 'mario1';

  function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
           navigator.maxTouchPoints > 1;
  }

  function patch() {
    if (!window.ArcadeHub) { setTimeout(patch, 150); return; }

    var orig = ArcadeHub.selectGame;
    ArcadeHub.selectGame = function (rom, el) {
      _rom = rom || 'mario1';
      return orig.call(this, rom, el);
    };

    ArcadeHub.launchEmulator = function () {
      var container = document.getElementById('emulator-container');
      if (!container) return;

      var src    = IA[_rom] || IA.mario1;
      var height = isMobile() ? '500px' : '480px';

      /* Archive.org hosts their own emulator — no CORS, no ROM download */
      container.innerHTML =
        '<iframe src="' + src + '" ' +
        'style="width:100%;height:' + height + ';border:none;background:#000;" ' +
        'allowfullscreen allow="autoplay;fullscreen;gamepad" ' +
        'sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups" ' +
        'title="NES Emulator" loading="lazy"></iframe>';

      if (window.Treasury) {
        Treasury.registerScriptVersion(
          'game-' + _rom, _rom, 'player1', 'loaded: ' + _rom);
      }
      console.log('[EMU] embed launched:', _rom, src);
    };

    var ph = document.getElementById('emulator-placeholder');
    if (ph) {
      var a = ph.querySelector('a[href*="Emulator-"]');
      if (a) { a.textContent = 'Internet Archive'; a.href = 'https://archive.org'; a.target = '_blank'; }
    }
    console.log('[EMU] patch ready, mobile=' + isMobile());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patch);
  } else { patch(); }
}());
