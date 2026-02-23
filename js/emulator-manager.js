/* ============================================================
   emulator-manager.js — EmulatorJS Integration Manager
   Synch Pipe Arcade Hub · pewpi-infinity
   ============================================================ */
var EmulatorManager = (function () {
  'use strict';

  var EJS_PATH = 'https://cdn.emulatorjs.org/stable/data/';
  var STORAGE_KEY = 'emulator_state';

  var CORE_MAP = {
    nes:     'nes',
    snes:    'snes9x',
    genesis: 'segaMD'
  };

  var _currentSystem = null;
  var _currentRom    = null;

  function init(system, romUrl) {
    try {
      _currentSystem = system || 'nes';
      _currentRom    = romUrl || '';

      var core = CORE_MAP[_currentSystem] || 'nes';

      window.EJS_player      = 1;
      window.EJS_core        = core;
      window.EJS_pathtodata  = EJS_PATH;
      window.EJS_gameUrl     = _currentRom;
      window.EJS_startOnLoad = true;

      _saveState();

      // Load the EmulatorJS loader script
      var existing = document.getElementById('ejs-loader');
      if (!existing) {
        var script = document.createElement('script');
        script.id  = 'ejs-loader';
        script.src = EJS_PATH + 'loader.js';
        document.body.appendChild(script);
      }
    } catch (e) {
      console.error('[EmulatorManager] init error:', e);
    }
  }

  function loadRom(url) {
    try {
      if (!url) return;
      _currentRom = url;
      window.EJS_gameUrl = url;
      _saveState();

      // Reload the emulator with the new ROM
      var loader = document.getElementById('ejs-loader');
      if (loader) loader.remove();

      var gameDiv = document.getElementById('game');
      if (gameDiv) {
        gameDiv.innerHTML = '';
      }

      var script = document.createElement('script');
      script.id  = 'ejs-loader';
      script.src = EJS_PATH + 'loader.js';
      document.body.appendChild(script);
    } catch (e) {
      console.error('[EmulatorManager] loadRom error:', e);
    }
  }

  function _saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        system: _currentSystem,
        rom:    _currentRom,
        ts:     Date.now()
      }));
    } catch (e) { /* quota or private mode */ }
  }

  function getState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  return { init: init, loadRom: loadRom, getState: getState };
}());
