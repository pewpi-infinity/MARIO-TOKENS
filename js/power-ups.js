/**
 * power-ups.js
 * ⭐ Star · 🍄 Mushroom · 🧱 Brick
 * Power-Up Mechanics — Synch Pipe Arcade Hub
 */

(function (global) {
  'use strict';

  /* ── State ──────────────────────────────────────────── */
  const state = {
    star:     { active: false, timer: null, duration: 15000 },  // 15s invincibility
    mushroom: { active: false, timer: null, multiplier: 2 },
    brick:    { active: false, breaking: false },
  };

  /* ── Helper: event emitter ───────────────────────────── */
  function _emit(name, detail) {
    console.log('[POWER-UPS][' + name + ']', detail);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('powerup:' + name, { detail }));
    }
  }

  /* ── ⭐ STAR — Invincibility ─────────────────────────── */
  /**
   * Activate Star power-up.
   * - Clears enemies / obstacles (emits star:clear)
   * - Opens a temporary protection window (duration ms)
   * - Triggers rainbow overlay
   */
  function activateStar(duration) {
    const ms = duration || state.star.duration;

    if (state.star.active) {
      // Extend duration if already active
      clearTimeout(state.star.timer);
      console.log('[POWER-UPS][STAR] Extended invincibility by', ms, 'ms');
    } else {
      state.star.active = true;
      console.log('[POWER-UPS][STAR] ⭐ INVINCIBILITY ACTIVATED — protection for', ms, 'ms');
    }

    // Show overlay
    const overlay = document.getElementById('star-overlay');
    if (overlay) overlay.classList.add('active');

    // Mark active button
    const btn = document.getElementById('btn-star');
    if (btn) btn.classList.add('active-star');

    _emit('star:activate', { duration: ms, ts: Date.now() });

    // Clear enemies / obstacles from the current page context
    _clearEnemiesAndObstacles();

    // Set deactivation timer
    state.star.timer = setTimeout(() => deactivateStar(), ms);
  }

  function deactivateStar() {
    state.star.active = false;
    clearTimeout(state.star.timer);
    state.star.timer = null;

    const overlay = document.getElementById('star-overlay');
    if (overlay) overlay.classList.remove('active');

    const btn = document.getElementById('btn-star');
    if (btn) btn.classList.remove('active-star');

    console.log('[POWER-UPS][STAR] ⭐ Invincibility expired');
    _emit('star:deactivate', { ts: Date.now() });
  }

  function _clearEnemiesAndObstacles() {
    // Remove any elements marked as enemies or obstacles in the DOM
    const targets = document.querySelectorAll('.enemy, .obstacle, [data-enemy], [data-obstacle]');
    targets.forEach(el => {
      el.style.transition = 'opacity 0.3s';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 350);
    });
    console.log('[POWER-UPS][STAR] Cleared', targets.length, 'enemies/obstacles from DOM');
    _emit('star:clear', { cleared: targets.length });
  }

  /* ── 🍄 MUSHROOM — Growth Mode ───────────────────────── */
  /**
   * Activate Mushroom power-up.
   * - Doubles visual scale of character element
   * - Increases jump height via CSS var
   * - Multiplies token generation rate (emits event for Treasury to pick up)
   * - Expands script capacity marker
   */
  function activateMushroom() {
    if (state.mushroom.active) {
      console.log('[POWER-UPS][MUSH] 🍄 Already active — ignoring');
      return;
    }

    state.mushroom.active = true;
    const multiplier = state.mushroom.multiplier;

    console.log('[POWER-UPS][MUSH] 🍄 MUSHROOM ACTIVATED — multiplier x' + multiplier);

    // Visual scale
    const character = document.getElementById('mario-character');
    if (character) {
      character.style.transform = 'scale(' + multiplier + ')';
      character.style.transition = 'transform 0.4s ease';
    }

    // Jump height CSS variable
    document.documentElement.style.setProperty('--jump-height', (multiplier * 80) + 'px');

    // Script capacity marker
    const capEl = document.getElementById('script-capacity');
    if (capEl) capEl.textContent = 'EXPANDED (x' + multiplier + ')';

    // Button state
    const btn = document.getElementById('btn-mushroom');
    if (btn) btn.classList.add('active-mush');

    _emit('mushroom:activate', {
      multiplier,
      tokenRateMultiplier: multiplier,
      ts: Date.now(),
    });

    // Auto-deactivate after 30 s
    state.mushroom.timer = setTimeout(() => deactivateMushroom(), 30000);
  }

  function deactivateMushroom() {
    state.mushroom.active = false;
    clearTimeout(state.mushroom.timer);
    state.mushroom.timer = null;

    const character = document.getElementById('mario-character');
    if (character) {
      character.style.transform = 'scale(1)';
    }

    document.documentElement.style.setProperty('--jump-height', '80px');

    const capEl = document.getElementById('script-capacity');
    if (capEl) capEl.textContent = 'NORMAL';

    const btn = document.getElementById('btn-mushroom');
    if (btn) btn.classList.remove('active-mush');

    console.log('[POWER-UPS][MUSH] 🍄 Mushroom expired');
    _emit('mushroom:deactivate', { ts: Date.now() });
  }

  /* ── 🧱 BRICK — Script Restructure ──────────────────── */
  /**
   * Break a brick.
   * - Triggers observable script modification
   * - Emits brick:break with restructured script payload
   * - Calls ScriptRepair.breakBrick if available
   * @param {string} [brickId]
   */
  function breakBrick(brickId) {
    if (state.brick.breaking) return;
    state.brick.breaking = true;

    const id = brickId || 'brick-' + Date.now();
    console.log('[POWER-UPS][BRICK] 🧱 BRICK BREAK:', id);

    // Visual feedback
    const brickEl = document.getElementById(id) ||
                    document.querySelector('[data-brick]');
    if (brickEl) {
      brickEl.classList.add('breaking');
      brickEl.style.animation = 'gold-pulse 0.3s ease 3';
      setTimeout(() => {
        brickEl.classList.remove('breaking');
        brickEl.setAttribute('data-broken', 'true');
      }, 900);
    }

    // Restructure script — hand off to ScriptRepair if loaded
    if (global.ScriptRepair && typeof global.ScriptRepair.breakBrick === 'function') {
      global.ScriptRepair.breakBrick(id);
    }

    // Emit observable script modification event
    const restructuredScript = _generateRestructuredScript(id);
    _emit('brick:break', {
      brickId: id,
      restructuredScript,
      ts: Date.now(),
    });

    setTimeout(() => { state.brick.breaking = false; }, 1000);
  }

  function _generateRestructuredScript(brickId) {
    // Produce a minimal observable script diff string
    const variants = [
      'if (mario.canFly) { mario.fly(); }',
      'enemy.health -= mario.strength * 2;',
      'world.unlockPath(' + JSON.stringify(brickId) + ');',
      'token.mint("MPT", 1, "brick-reveal");',
    ];
    return variants[Math.floor(Math.random() * variants.length)];
  }

  /* ── Status Queries ──────────────────────────────────── */
  function isStarActive()     { return state.star.active; }
  function isMushroomActive() { return state.mushroom.active; }

  /**
   * Get current token rate multiplier (accounts for mushroom).
   */
  function getTokenRateMultiplier() {
    return state.mushroom.active ? state.mushroom.multiplier : 1;
  }

  /* ── Public API ──────────────────────────────────────── */
  const PowerUps = {
    activateStar,
    deactivateStar,
    activateMushroom,
    deactivateMushroom,
    breakBrick,
    isStarActive,
    isMushroomActive,
    getTokenRateMultiplier,
    state,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PowerUps;
  } else {
    global.PowerUps = PowerUps;
  }

  console.log('[POWER-UPS] power-ups.js loaded. ⭐🍄🧱 ready.');

}(typeof window !== 'undefined' ? window : this));
