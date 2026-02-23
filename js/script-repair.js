/**
 * script-repair.js
 * Gameplay → Code Fix Mapping — Synch Pipe Arcade Hub
 *
 * Gameplay event     → code action
 * ─────────────────────────────────────────────
 * Enemy stomp        → fixScriptChunk()  + mint MPT
 * Coin collection    → mint IGT (0.01)
 * 1-UP mushroom      → mint MPT (1.00)
 * Flag pole complete → unlock scriptwriter tier
 * Brick break        → observable script restructuring
 */

(function (global) {
  'use strict';

  /* ── Script Chunk Registry ───────────────────────────── */
  // Each entry: { id, status: 'broken'|'fixed', code, fixedAt }
  const _chunks = {};
  let _scriptwriterUnlocked = false;
  let _fixCount = 0;

  /* ── Helpers ─────────────────────────────────────────── */
  function _emit(name, detail) {
    console.log('[SCRIPT-REPAIR][' + name + ']', detail);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('repair:' + name, { detail }));
    }
  }

  function _treasury() {
    return (typeof global.Treasury !== 'undefined') ? global.Treasury : null;
  }

  function _userId() {
    // Use the active user set on window, or fall back to a default
    return (typeof global.ARCADE_USER_ID !== 'undefined')
      ? global.ARCADE_USER_ID
      : 'player1';
  }

  /* ── Register a broken script chunk ─────────────────── */
  /**
   * Mark a script chunk as broken (needing repair).
   * @param {string} chunkId
   * @param {string} [code]  optional original code snippet
   */
  function registerBrokenChunk(chunkId, code) {
    _chunks[chunkId] = {
      id: chunkId,
      status: 'broken',
      code: code || '/* broken script chunk: ' + chunkId + ' */',
      brokenAt: new Date().toISOString(),
      fixedAt: null,
    };
    console.log('[SCRIPT-REPAIR] Registered broken chunk:', chunkId);
    _emit('chunk:broken', { chunkId });
  }

  /* ── 👟 Enemy Stomp → fixScriptChunk + mint MPT ─────── */
  /**
   * Called when the player stomps an enemy.
   * @param {string} enemyId
   * @param {string} [chunkId]  associated script chunk to fix
   */
  function onEnemyStomp(enemyId, chunkId) {
    console.log('[SCRIPT-REPAIR] 👟 Enemy stomped:', enemyId);

    const targetChunk = chunkId || ('chunk-enemy-' + enemyId);
    fixScriptChunk(targetChunk);

    // Mint Gold token for the stomp repair
    const t = _treasury();
    if (t) {
      t.mint(_userId(), 'MPT', 1, 'enemy stomp: ' + enemyId);
    }

    _emit('enemy:stomp', { enemyId, chunkId: targetChunk });
  }

  /* ── fixScriptChunk ──────────────────────────────────── */
  /**
   * Fix a broken script chunk.
   * @param {string} chunkId
   * @returns {object|null} fixed chunk or null
   */
  function fixScriptChunk(chunkId) {
    if (!_chunks[chunkId]) {
      // Auto-register if not known
      registerBrokenChunk(chunkId);
    }

    const chunk = _chunks[chunkId];
    if (chunk.status === 'fixed') {
      console.log('[SCRIPT-REPAIR] Chunk already fixed:', chunkId);
      return chunk;
    }

    chunk.status  = 'fixed';
    chunk.fixedAt = new Date().toISOString();
    chunk.code    = _repairCode(chunk.code);
    _fixCount++;

    console.log('[SCRIPT-REPAIR] ✅ Fixed script chunk:', chunkId,
      '— total fixes:', _fixCount);
    _emit('chunk:fixed', { chunkId, fixedCode: chunk.code, fixCount: _fixCount });

    return chunk;
  }

  function _repairCode(original) {
    // Simple observable transformation: remove broken markers, add fixed comment
    return original
      .replace(/\/\* broken/g, '/* fixed')
      .replace(/\/\/ BROKEN/g, '// FIXED')
      + '\n// repaired at ' + new Date().toISOString();
  }

  /* ── 🪙 Coin Collection → mint IGT ──────────────────── */
  /**
   * Called when the player collects a coin.
   * @param {string} [coinId]
   */
  function onCoinCollect(coinId) {
    console.log('[SCRIPT-REPAIR] 🪙 Coin collected:', coinId || 'unknown');

    const t = _treasury();
    if (t) {
      t.mint(_userId(), 'IGT', 0.01, 'coin collect: ' + (coinId || 'coin'));
    }

    _emit('coin:collect', { coinId });
  }

  /* ── 🍄 1-UP → mint MPT ──────────────────────────────── */
  /**
   * Called when the player picks up a 1-UP mushroom.
   */
  function onOneUp() {
    console.log('[SCRIPT-REPAIR] 🍄 1-UP mushroom collected!');

    const t = _treasury();
    if (t) {
      t.mint(_userId(), 'MPT', 1.00, '1-UP mushroom');
    }

    _emit('oneup', { ts: Date.now() });
  }

  /* ── 🚩 Flag Pole → unlock scriptwriter tier ─────────── */
  /**
   * Called when the player reaches the flag pole (level complete).
   * @param {string} [levelId]
   */
  function onFlagPole(levelId) {
    const level = levelId || 'level-unknown';
    console.log('[SCRIPT-REPAIR] 🚩 Flag pole reached:', level);

    if (!_scriptwriterUnlocked) {
      _scriptwriterUnlocked = true;
      console.log('[SCRIPT-REPAIR] 🔓 SCRIPTWRITER TIER UNLOCKED');
      _emit('scriptwriter:unlock', { levelId: level, ts: Date.now() });
    }

    // Mint MPT bonus for completing the level
    const t = _treasury();
    if (t) {
      t.mint(_userId(), 'MPT', 5, 'level complete: ' + level);
    }

    _emit('flagpole', { levelId: level });
  }

  /* ── 🧱 Brick Break → observable script restructuring ── */
  /**
   * Called when a brick is broken (from power-ups.js or direct call).
   * Triggers script restructuring and mints a token.
   * @param {string} brickId
   */
  function breakBrick(brickId) {
    console.log('[SCRIPT-REPAIR] 🧱 Brick break → script restructure:', brickId);

    // Register and fix a chunk named after this brick
    const chunkId = 'chunk-brick-' + brickId;
    registerBrokenChunk(chunkId,
      '// brick script: ' + brickId + '\n// BROKEN — awaiting restructure');
    fixScriptChunk(chunkId);

    // Optionally register as a new script version if Treasury is available
    const t = _treasury();
    if (t) {
      t.registerScriptVersion(
        'brick-' + brickId,
        'v' + Date.now(),
        _userId(),
        'brick break restructure'
      );
    }

    _emit('brick:restructure', { brickId, chunkId });
  }

  /* ── Status ──────────────────────────────────────────── */
  function getFixCount()            { return _fixCount; }
  function isScriptwriterUnlocked() { return _scriptwriterUnlocked; }
  function getChunks()              { return Object.values(_chunks); }

  /* ── Public API ──────────────────────────────────────── */
  const ScriptRepair = {
    registerBrokenChunk,
    fixScriptChunk,
    onEnemyStomp,
    onCoinCollect,
    onOneUp,
    onFlagPole,
    breakBrick,
    getFixCount,
    isScriptwriterUnlocked,
    getChunks,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScriptRepair;
  } else {
    global.ScriptRepair = ScriptRepair;
  }

  console.log('[SCRIPT-REPAIR] script-repair.js loaded. Gameplay→Code mapping active.');

}(typeof window !== 'undefined' ? window : this));
