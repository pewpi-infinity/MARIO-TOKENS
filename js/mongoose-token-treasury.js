/**
 * mongoose-token-treasury.js
 * Centralized Token Ledger — Synch Pipe Arcade Hub
 * Tracks Gold (MPT), Platinum, and InGame (IGT) tokens.
 * Self-contained, no external dependencies.
 */

(function (global) {
  'use strict';

  /* ── Constants ──────────────────────────────────────── */
  const TOKEN_TYPES = Object.freeze({
    GOLD:     'MPT',      // Mario Power Token — active scripts, value 1.00
    PLATINUM: 'PLAT',     // Retired/versioned scripts, collectible
    IGT:      'IGT',      // In-Game Token — micro currency, value 0.01
  });

  const TOKEN_VALUES = Object.freeze({
    MPT:  1.00,
    PLAT: null,   // market/historical value, no fixed peg
    IGT:  0.01,
  });

  /* ── Internal Ledger (in-memory) ────────────────────── */
  // Structure: ledger[userId][tokenType] = Number
  const _ledger = {};
  // Structure: scriptVersions[scriptId] = { version, type, tokenId, minted, retired }
  const _scriptVersions = {};
  // Event log array
  const _eventLog = [];

  let _nextTokenId = 1;

  /* ── Helpers ────────────────────────────────────────── */
  function _ts() {
    return new Date().toISOString();
  }

  function _ensureUser(userId) {
    if (!_ledger[userId]) {
      _ledger[userId] = { MPT: 0, PLAT: 0, IGT: 0 };
    }
  }

  function _logEvent(type, data) {
    const entry = { ts: _ts(), type, ...data };
    _eventLog.push(entry);
    console.log('[TREASURY][' + type + ']', entry);
    // Emit DOM event so the UI can listen
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('treasury:event', { detail: entry }));
    }
    return entry;
  }

  /* ── Mint ───────────────────────────────────────────── */
  /**
   * Mint tokens for a user.
   * @param {string} userId
   * @param {string} tokenType  'MPT' | 'PLAT' | 'IGT'
   * @param {number} amount
   * @param {string} [reason]
   * @returns {object} log entry
   */
  function mint(userId, tokenType, amount, reason) {
    if (!TOKEN_TYPES[tokenType] && !Object.values(TOKEN_TYPES).includes(tokenType)) {
      throw new Error('[TREASURY] Unknown token type: ' + tokenType);
    }
    const type = Object.values(TOKEN_TYPES).includes(tokenType)
      ? tokenType
      : TOKEN_TYPES[tokenType];

    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('[TREASURY] Amount must be a positive number');
    }

    _ensureUser(userId);
    _ledger[userId][type] = (_ledger[userId][type] || 0) + amount;

    return _logEvent('MINT', {
      tokenId: 'TKN-' + (_nextTokenId++),
      userId,
      tokenType: type,
      amount,
      reason: reason || 'unspecified',
      balance: _ledger[userId][type],
    });
  }

  /* ── Transfer ───────────────────────────────────────── */
  /**
   * Transfer tokens between users.
   * @param {string} fromUserId
   * @param {string} toUserId
   * @param {string} tokenType
   * @param {number} amount
   * @param {string} [reason]
   */
  function transfer(fromUserId, toUserId, tokenType, amount, reason) {
    _ensureUser(fromUserId);
    _ensureUser(toUserId);

    const type = Object.values(TOKEN_TYPES).includes(tokenType)
      ? tokenType
      : TOKEN_TYPES[tokenType];

    if ((_ledger[fromUserId][type] || 0) < amount) {
      throw new Error('[TREASURY] Insufficient balance for ' + fromUserId);
    }

    _ledger[fromUserId][type] -= amount;
    _ledger[toUserId][type]   = (_ledger[toUserId][type] || 0) + amount;

    return _logEvent('TRANSFER', {
      fromUserId,
      toUserId,
      tokenType: type,
      amount,
      reason: reason || 'unspecified',
      fromBalance: _ledger[fromUserId][type],
      toBalance:   _ledger[toUserId][type],
    });
  }

  /* ── Balance ────────────────────────────────────────── */
  /**
   * Get balance(s) for a user.
   * @param {string} userId
   * @param {string} [tokenType]  optional; if omitted returns all balances
   * @returns {number|object}
   */
  function getBalance(userId, tokenType) {
    _ensureUser(userId);
    if (tokenType) {
      const type = Object.values(TOKEN_TYPES).includes(tokenType)
        ? tokenType
        : TOKEN_TYPES[tokenType];
      return _ledger[userId][type] || 0;
    }
    return { ..._ledger[userId] };
  }

  /* ── Script Version Tracking ────────────────────────── */
  /**
   * Register a new script version.
   * When a script is updated (e.g. brick break), the old version
   * is retired to Platinum and a new Gold token is minted.
   *
   * @param {string} scriptId   e.g. 'mario-jump'
   * @param {string} version    e.g. 'mario3'
   * @param {string} userId     owner / author
   * @param {string} [notes]    version notes
   */
  function registerScriptVersion(scriptId, version, userId, notes) {
    const now = _ts();

    // Retire the previous version to Platinum
    if (_scriptVersions[scriptId]) {
      const prev = _scriptVersions[scriptId];
      prev.retired = now;
      prev.retiredTo = version;

      // Mint a Platinum token for the retired version
      mint(userId, TOKEN_TYPES.PLATINUM, 1,
        'script retired: ' + scriptId + '@' + prev.version);

      _logEvent('SCRIPT_RETIRED', {
        scriptId,
        fromVersion: prev.version,
        toVersion: version,
        userId,
      });
    }

    // Register the new active (Gold) version
    _scriptVersions[scriptId] = {
      scriptId,
      version,
      userId,
      notes: notes || '',
      minted: now,
      retired: null,
    };

    // Mint a Gold token for the new active script
    mint(userId, TOKEN_TYPES.GOLD, 1,
      'script activated: ' + scriptId + '@' + version);

    _logEvent('SCRIPT_VERSION', {
      scriptId,
      version,
      userId,
      notes,
    });

    return _scriptVersions[scriptId];
  }

  /**
   * List all script versions.
   */
  function getScriptVersions() {
    return Object.values(_scriptVersions);
  }

  /* ── Event Log ──────────────────────────────────────── */
  /**
   * Get the full event log (or latest N entries).
   * @param {number} [limit]
   */
  function getEventLog(limit) {
    if (limit && limit > 0) {
      return _eventLog.slice(-limit);
    }
    return [..._eventLog];
  }

  /* ── Watch-to-Earn Helper ───────────────────────────── */
  /**
   * Start a watch session. Calls back with accrued tokens each minute.
   * Returns a stop function.
   * @param {string} userId
   * @param {Function} [onTick]   called with mint log entry each tick
   * @returns {Function}  stopWatching
   */
  function startWatchSession(userId, onTick) {
    const RATE_PER_HOUR = 10;     // Gold tokens per hour of watching
    const TICK_MS       = 60000;  // 1 minute (tick interval)
    const PER_TICK      = RATE_PER_HOUR / 60; // tokens earned per 1-minute tick

    console.log('[TREASURY] Watch session started for', userId,
      '— earning', RATE_PER_HOUR, 'MPT/hour');

    const intervalId = setInterval(() => {
      const entry = mint(userId, TOKEN_TYPES.GOLD, PER_TICK,
        'watch-to-earn session');
      if (typeof onTick === 'function') onTick(entry);
    }, TICK_MS);

    return function stopWatching() {
      clearInterval(intervalId);
      console.log('[TREASURY] Watch session stopped for', userId);
    };
  }

  /* ── Public API ─────────────────────────────────────── */
  const Treasury = {
    TOKEN_TYPES,
    TOKEN_VALUES,
    mint,
    transfer,
    getBalance,
    registerScriptVersion,
    getScriptVersions,
    getEventLog,
    startWatchSession,
  };

  // Export for both CommonJS and browser globals
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Treasury;
  } else {
    global.Treasury = Treasury;
  }

  console.log('[TREASURY] mongoose-token-treasury.js loaded. TOKEN_TYPES:', TOKEN_TYPES);

}(typeof window !== 'undefined' ? window : this));
