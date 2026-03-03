/* emulator-fix.js */
(function () {
  'use strict';
  var GAMES = {
    mario1:  { embed: 'https://archive.org/embed/super-mario-bros-nes',       dl: 'https://archive.org/download/super-mario-bros-nes/Super%20Mario%20Bros%20(U).nes',         title: 'Super Mario Bros.' },
    mario3:  { embed: 'https://archive.org/embed/super-mario-bros-3-nes',     dl: 'https://archive.org/download/super-mario-bros-3-nes/Super%20Mario%20Bros%203%20(U).nes',   title: 'Super Mario Bros. 3' },
    zelda:   { embed: 'https://archive.org/embed/the-legend-of-zelda-nes',    dl: 'https://archive.org/download/the-legend-of-zelda-nes/Legend%20of%20Zelda%2C%20The%20(U).nes', title: 'The Legend of Zelda' },
    contra:  { embed: 'https://archive.org/embed/contra-nes',                 dl: 'https://archive.org/download/contra-nes/Contra%20(U).nes',                                  title: 'Contra' },
    metroid: { embed: 'https://archive.org/embed/metroid-nes',                dl: 'https://archive.org/download/metroid-nes/Metroid%20(U).nes',                                title: 'Metroid' }
  };
  var _rom = 'mario1';
  function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
  }
  function seedRomScripts() {
    if (!window.Treasury) return;
    Object.keys(GAMES).forEach(function (id) {
      try { Treasury.registerScriptVersion('rom-' + id, id, 'player1', GAMES[id].title + ' ROM script'); } catch(e){}
    });
  }
  function patch() {
    if (!window.ArcadeHub) { setTimeout(patch, 150); return; }
    if (window.Treasury) { seedRomScripts(); }
    else { window.addEventListener('treasury:event', function onT() { window.removeEventListener('treasury:event', onT); seedRomScripts(); }); }
    var orig = ArcadeHub.selectGame;
    ArcadeHub.selectGame = function (rom, el) { _rom = rom || 'mario1'; return orig.call(this, rom, el); };
    ArcadeHub.launchEmulator = function () {
      var container = document.getElementById('emulator-container');
      if (!container) return;
      var game = GAMES[_rom] || GAMES.mario1;
      var height = isMobile() ? '500px' : '480px';
      container.innerHTML =
        '<iframe src="' + game.embed + '?autoplay=1" style="width:100%;height:' + height + ';border:none;background:#000;display:block;" allowfullscreen allow="autoplay; fullscreen; gamepad *; microphone; pointer-lock" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox" title="NES Emulator" loading="eager"></iframe>' +
        '<div style="display:flex;gap:8px;align-items:center;padding:6px 8px;background:#111;border-top:1px solid rgba(255,204,0,0.18);">' +
        '<span style="font-size:0.72rem;color:#aaa;flex:1">▶ ' + game.title + ' via Internet Archive</span>' +
        '<a href="' + game.dl + '" download target="_blank" style="font-size:0.7rem;padding:4px 10px;background:#ffcc00;color:#000;border-radius:4px;text-decoration:none;font-weight:bold;">⬇ Download ROM</a>' +
        '<a href="' + game.embed.replace('/embed/','/details/') + '" target="_blank" style="font-size:0.7rem;padding:4px 10px;background:rgba(255,204,0,0.12);color:#ffcc00;border-radius:4px;text-decoration:none;">🌐 Archive.org</a>' +
        '</div>';
      if (window.Treasury) Treasury.registerScriptVersion('game-' + _rom, _rom, 'player1', 'loaded: ' + game.title);
      console.log('[EMU] launched:', _rom, game.embed);
    };
    console.log('[EMU] patch ready mobile=' + isMobile());
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', patch); } else { patch(); }
}());
