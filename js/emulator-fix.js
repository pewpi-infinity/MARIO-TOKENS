/* emulator-fix.js
   Reads ROM metadata from data/games.json (already in your repo).
   Tries local roms/ first; falls back to archive.org via CORS proxy.
*/
(function () {
  'use strict';

  var EJS_PATH  = 'https://cdn.emulatorjs.org/stable/data/';
  var PROXY     = 'https://corsproxy.io/?url=';
  var IA_DL     = 'https://archive.org/download/';

  /* Will be populated from data/games.json */
  var _nesGames = [];
  var _trackedRom = 'mario1';
  var _ejsLoaded  = false;

  function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
           navigator.maxTouchPoints > 1;
  }

  /* Build the ROM fetch URL — try local first, then proxied archive.org */
  function buildRomUrl(game) {
    if (!game) return null;
    /* If repo has a roms/ folder with the file, use it (same-origin, no CORS) */
    var local = 'roms/' + game.rom;
    /* Otherwise proxy through corsproxy to bypass archive.org CORS block */
    var remote = PROXY + encodeURIComponent(
      IA_DL + game.archive_id + '/' + game.rom
    );
    return { local: local, remote: remote };
  }

  function findGame(id) {
    for (var i = 0; i < _nesGames.length; i++) {
      if (_nesGames[i].id === id) return _nesGames[i];
    }
    return _nesGames[0] || null;
  }

  function launchWithUrl(romUrl, gameId) {
    var container = document.getElementById('emulator-container');
    if (!container) return;

    var mobile = isMobile();
    container.innerHTML =
      '<div id="ejs-game" style="width:100%;height:' +
      (mobile ? '560px' : '480px') + ';display:block;"></div>';

    window.EJS_player            = '#ejs-game';
    window.EJS_core              = 'nes';
    window.EJS_pathtodata        = EJS_PATH;
    window.EJS_gameUrl           = romUrl;
    window.EJS_startOnLoaded     = true;
    window.EJS_color             = '#ffcc00';
    window.EJS_adUrl             = '';
    window.EJS_adMode            = 0;
    window.EJS_VirtualGamepad    = mobile;   /* touch d-pad on Android */
    window.EJS_GamepadOnLeft     = false;
    window.EJS_fullscreenOnLoaded = false;
    window.EJS_cheats            = false;

    /* Remove any old loader so EmulatorJS reinits cleanly */
    var old = document.getElementById('ejs-loader-fix');
    if (old) old.remove();

    var s = document.createElement('script');
    s.id  = 'ejs-loader-fix';
    s.src = EJS_PATH + 'loader.js';
    s.onerror = function () {
      container.innerHTML =
        '<p style="color:var(--red-alert);padding:20px;text-align:center">' +
        '&#x274C; EmulatorJS CDN failed to load. Check connection.</p>';
    };
    document.body.appendChild(s);
    _ejsLoaded = true;

    if (window.Treasury) {
      Treasury.registerScriptVersion(
        'game-' + gameId, gameId, 'player1', 'loaded: ' + gameId);
    }
    console.log('[EMU] launched', gameId, '| url:', romUrl,
                '| mobile:', mobile);
  }

  function patch() {
    if (!window.ArcadeHub) { setTimeout(patch, 150); return; }

    /* Track which game card is selected */
    var _origSelect = ArcadeHub.selectGame;
    ArcadeHub.selectGame = function (rom, el) {
      _trackedRom = rom || 'mario1';
      return _origSelect.call(this, rom, el);
    };

    /* Override launchEmulator */
    ArcadeHub.launchEmulator = function () {
      var container = document.getElementById('emulator-container');
      if (!container) return;

      if (_ejsLoaded) {
        container.innerHTML =
          '<div style="padding:24px;text-align:center;color:var(--gold)">' +
          '<p>Reload page to switch games.</p>' +
          '<p style="margin-top:14px"><a href="pages/nes-emulator.html"' +
          ' style="color:var(--gold);text-decoration:underline;font-weight:700">' +
          '&#9654; Open Full NES Emulator</a></p></div>';
        return;
      }

      var game = findGame(_trackedRom);
      if (!game) {
        console.warn('[EMU] game not found:', _trackedRom);
        return;
      }

      var urls = buildRomUrl(game);

      /* Try local path first; if it 404s fall back to the proxied URL */
      fetch(urls.local, { method: 'HEAD' })
        .then(function (r) {
          launchWithUrl(r.ok ? urls.local : urls.remote, game.id);
        })
        .catch(function () {
          launchWithUrl(urls.remote, game.id);
        });
    };

    /* Fix placeholder link */
    var ph = document.getElementById('emulator-placeholder');
    if (ph) {
      var old = ph.querySelector('a[href*="Emulator-"]');
      if (old) {
        old.textContent = 'EmulatorJS';
        old.href = 'https://emulatorjs.org';
        old.target = '_blank';
      }
    }
    console.log('[EMU] patch applied, mobile=' + isMobile());
  }

  /* Load games.json so we have the correct archive IDs and filenames */
  function loadGamesJson() {
    fetch('data/games.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _nesGames = (data && data.nes) ? data.nes : [];
        console.log('[EMU] loaded', _nesGames.length, 'NES games from games.json');
      })
      .catch(function (e) {
        console.warn('[EMU] could not load games.json:', e);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      loadGamesJson();
      patch();
    });
  } else {
    loadGamesJson();
    patch();
  }
}());
