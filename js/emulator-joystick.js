(function (global) {
  'use strict';

  function pressKey(key, down) {
    window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { key: key, bubbles: true }));
  }

  function createButton(label, key, cls) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'joy-btn ' + (cls || '');
    btn.textContent = label;
    if (!key) {
      btn.disabled = true;
      return btn;
    }
    function down(e) {
      e.preventDefault();
      pressKey(key, true);
      if (navigator.vibrate) navigator.vibrate(50);
    }
    function up(e) {
      e.preventDefault();
      pressKey(key, false);
    }
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
    return btn;
  }

  function ensureStyle() {
    if (document.getElementById('emu-joy-style')) return;
    var s = document.createElement('style');
    s.id = 'emu-joy-style';
    s.textContent =
      '.emu-joy{position:fixed;left:12px;bottom:12px;display:flex;gap:12px;z-index:60;user-select:none}' +
      '.emu-joy .joy-dpad{display:grid;grid-template-columns:38px 38px 38px;grid-template-rows:38px 38px 38px;gap:4px}' +
      '.emu-joy .joy-actions{display:flex;gap:8px;align-items:flex-end}' +
      '.emu-joy .joy-btn{border:1px solid rgba(255,204,0,.35);background:rgba(0,0,0,.75);color:#ffcc00;border-radius:8px;font:700 12px/1 sans-serif;min-width:38px;min-height:38px}' +
      '.emu-joy .joy-btn:active{background:#ffcc00;color:#000}' +
      '.emu-joy .joy-empty{visibility:hidden}' +
      '@media (min-width: 980px){.emu-joy{display:none}}';
    document.head.appendChild(s);
  }

  function init() {
    if (document.getElementById('emu-joy')) return;
    ensureStyle();
    var wrap = document.createElement('div');
    wrap.id = 'emu-joy';
    wrap.className = 'emu-joy';
    var dpad = document.createElement('div');
    dpad.className = 'joy-dpad';
    dpad.appendChild(createButton('', '', 'joy-empty'));
    dpad.appendChild(createButton('▲', 'ArrowUp'));
    dpad.appendChild(createButton('', '', 'joy-empty'));
    dpad.appendChild(createButton('◀', 'ArrowLeft'));
    dpad.appendChild(createButton('START', 'Enter'));
    dpad.appendChild(createButton('▶', 'ArrowRight'));
    dpad.appendChild(createButton('', '', 'joy-empty'));
    dpad.appendChild(createButton('▼', 'ArrowDown'));
    dpad.appendChild(createButton('', '', 'joy-empty'));
    var actions = document.createElement('div');
    actions.className = 'joy-actions';
    actions.appendChild(createButton('B', 'z'));
    actions.appendChild(createButton('A', 'x'));
    wrap.appendChild(dpad);
    wrap.appendChild(actions);
    document.body.appendChild(wrap);
  }

  global.EmulatorJoystick = { init: init };
}(typeof window !== 'undefined' ? window : this));
