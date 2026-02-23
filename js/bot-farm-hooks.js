/**
 * bot-farm-hooks.js
 * Bot Farm Integration — Synch Pipe Arcade Hub
 *
 * Provides:
 * - Bot task queue
 * - Scan mechanism (detect problem areas)
 * - Auto-fix logic
 * - Script protection flags
 * - Content egg generation
 * - Audit trail logging
 */

(function (global) {
  'use strict';

  /* ── Task Queue ──────────────────────────────────────── */
  // Each task: { id, type, payload, status, botId, ts, completedAt, result }
  const _taskQueue = [];
  let _taskCounter = 0;
  const _auditLog  = [];
  const _botRegistry = {};
  const _protectedScripts = new Set();

  /* ── Bot Registry ────────────────────────────────────── */
  /**
   * Register a bot in the farm.
   * @param {string} botId
   * @param {string[]} capabilities  e.g. ['scan', 'fix', 'generate']
   */
  function registerBot(botId, capabilities) {
    _botRegistry[botId] = {
      botId,
      capabilities: capabilities || ['scan'],
      status: 'idle',
      tasksCompleted: 0,
      registeredAt: new Date().toISOString(),
    };
    _audit('BOT_REGISTER', botId, { capabilities });
    console.log('[BOT-FARM] Bot registered:', botId, capabilities);
    _emitStatus();
    return _botRegistry[botId];
  }

  /* ── Helpers ─────────────────────────────────────────── */
  function _emit(name, detail) {
    console.log('[BOT-FARM][' + name + ']', detail);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('botfarm:' + name, { detail }));
    }
  }

  function _audit(action, botId, data) {
    const entry = {
      ts: new Date().toISOString(),
      action,
      botId: botId || 'SYSTEM',
      ...data,
    };
    _auditLog.push(entry);
    console.log('[BOT-FARM][AUDIT]', entry);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('treasury:event', {
        detail: { type: 'BOT_ACTION', ...entry },
      }));
    }
    return entry;
  }

  function _emitStatus() {
    _emit('status', {
      bots: Object.values(_botRegistry),
      queueLength: _taskQueue.filter(t => t.status === 'pending').length,
    });
  }

  /* ── Enqueue Task ────────────────────────────────────── */
  /**
   * Add a task to the bot queue.
   * @param {string} type      'scan' | 'fix' | 'generate' | 'protect'
   * @param {object} payload
   * @param {string} [botId]   assign to specific bot; auto-assigns if omitted
   * @returns {object} task
   */
  function enqueueTask(type, payload, botId) {
    const task = {
      id: 'task-' + (++_taskCounter),
      type,
      payload: payload || {},
      status: 'pending',
      botId: botId || _autoAssignBot(type),
      ts: new Date().toISOString(),
      completedAt: null,
      result: null,
    };
    _taskQueue.push(task);
    _audit('TASK_ENQUEUE', task.botId, { taskId: task.id, type, payload });
    console.log('[BOT-FARM] Task enqueued:', task.id, type);
    _emit('task:enqueue', task);
    return task;
  }

  function _autoAssignBot(taskType) {
    const capable = Object.values(_botRegistry)
      .filter(b => b.capabilities.includes(taskType) && b.status === 'idle');
    if (capable.length > 0) return capable[0].botId;
    return 'BOT-AUTO';
  }

  /* ── Run Task ────────────────────────────────────────── */
  /**
   * Execute a pending task immediately (synchronous simulation).
   * @param {string} taskId
   * @returns {object} completed task
   */
  function runTask(taskId) {
    const task = _taskQueue.find(t => t.id === taskId);
    if (!task) throw new Error('[BOT-FARM] Task not found: ' + taskId);
    if (task.status !== 'pending') {
      console.warn('[BOT-FARM] Task not pending:', taskId, task.status);
      return task;
    }

    task.status = 'running';
    const bot = _botRegistry[task.botId];
    if (bot) { bot.status = 'busy'; }

    console.log('[BOT-FARM] Running task:', taskId, task.type);

    try {
      switch (task.type) {
        case 'scan':     task.result = _runScan(task.payload);     break;
        case 'fix':      task.result = _runFix(task.payload);      break;
        case 'generate': task.result = _runGenerate(task.payload); break;
        case 'protect':  task.result = _runProtect(task.payload);  break;
        default:
          task.result = { status: 'unknown-type', type: task.type };
      }
      task.status = 'completed';
    } catch (err) {
      task.status = 'failed';
      task.result = { error: err.message };
      console.error('[BOT-FARM] Task failed:', taskId, err.message);
    }

    task.completedAt = new Date().toISOString();
    if (bot) {
      bot.status = 'idle';
      bot.tasksCompleted++;
    }

    _audit('TASK_COMPLETE', task.botId, {
      taskId, type: task.type, status: task.status, result: task.result,
    });
    _emit('task:complete', task);
    _emitStatus();
    return task;
  }

  /* ── Scan ────────────────────────────────────────────── */
  /**
   * Scan the page/app for problem areas.
   * Returns an array of detected issues.
   */
  function _runScan(payload) {
    const issues = [];

    if (typeof document !== 'undefined') {
      // Detect broken script chunks (elements with data-broken attr)
      const brokenEls = document.querySelectorAll('[data-broken="true"]');
      brokenEls.forEach(el => {
        issues.push({
          type: 'broken-element',
          id: el.id || el.getAttribute('data-chunk-id') || 'unknown',
          selector: el.tagName + (el.id ? '#' + el.id : ''),
        });
      });

      // Detect stuck loaders
      const loaders = document.querySelectorAll('[data-loading="true"]');
      loaders.forEach(el => {
        issues.push({
          type: 'stuck-loader',
          id: el.id || 'unknown',
        });
      });

      // Detect empty panels that should have content
      const panels = document.querySelectorAll('.panel[data-required="true"]');
      panels.forEach(el => {
        if (el.children.length === 0 || el.textContent.trim() === '') {
          issues.push({ type: 'empty-panel', id: el.id || 'unknown' });
        }
      });
    }

    // Also check ScriptRepair chunks
    if (global.ScriptRepair) {
      const broken = global.ScriptRepair.getChunks()
        .filter(c => c.status === 'broken');
      broken.forEach(c => issues.push({ type: 'broken-script', chunkId: c.id }));
    }

    console.log('[BOT-FARM][SCAN] Found', issues.length, 'issues:', issues);
    _emit('scan:result', { issues, target: payload.target || 'page' });
    return { issues };
  }

  /* ── Auto-Fix ────────────────────────────────────────── */
  /**
   * Auto-fix detected issues.
   */
  function _runFix(payload) {
    const fixed = [];
    const issues = (payload && payload.issues) || [];

    issues.forEach(issue => {
      if (_protectedScripts.has(issue.id || issue.chunkId)) {
        console.warn('[BOT-FARM][FIX] Skipping protected:', issue.id || issue.chunkId);
        return;
      }

      switch (issue.type) {
        case 'broken-element': {
          const el = issue.id ? document.getElementById(issue.id) : null;
          if (el) {
            el.removeAttribute('data-broken');
            el.style.opacity = '1';
            fixed.push({ issue, action: 'restored-element' });
          }
          break;
        }
        case 'stuck-loader': {
          const el = issue.id ? document.getElementById(issue.id) : null;
          if (el) {
            el.removeAttribute('data-loading');
            fixed.push({ issue, action: 'cleared-loader' });
          }
          break;
        }
        case 'broken-script': {
          if (global.ScriptRepair) {
            global.ScriptRepair.fixScriptChunk(issue.chunkId);
            fixed.push({ issue, action: 'script-chunk-fixed' });
          }
          break;
        }
        default:
          fixed.push({ issue, action: 'no-handler' });
      }
    });

    console.log('[BOT-FARM][FIX] Fixed', fixed.length, 'issues');
    _emit('fix:result', { fixed });
    return { fixed };
  }

  /* ── Generate Content Egg ────────────────────────────── */
  /**
   * Generate a new content egg based on gameplay patterns.
   * @param {object} payload  { pattern, type }
   */
  function _runGenerate(payload) {
    const pattern = payload.pattern || 'default';
    const type    = payload.type    || 'script';

    const egg = {
      id: 'egg-' + Date.now(),
      type,
      pattern,
      content: _generateEggContent(pattern, type),
      botBuilt: true,
      locked: false,
      generatedAt: new Date().toISOString(),
    };

    console.log('[BOT-FARM][GENERATE] 🥚 Content egg generated:', egg.id);
    _emit('egg:generated', egg);

    // Mint a token for generating content
    if (global.Treasury) {
      global.Treasury.mint(
        payload.userId || 'system',
        'MPT',
        1,
        'bot-generated egg: ' + egg.id
      );
    }

    return { egg };
  }

  function _generateEggContent(pattern, type) {
    const templates = {
      script: [
        'function run_' + pattern + '() { /* bot-generated */ }',
        'const ' + pattern + '_handler = (e) => console.log(e);',
        'export default { pattern: "' + pattern + '", botBuilt: true };',
      ],
      html: [
        '<div class="bot-egg" data-pattern="' + pattern + '"></div>',
        '<section id="bot-' + pattern + '"><!-- generated --></section>',
      ],
    };
    const pool = templates[type] || templates.script;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ── Script Protection ───────────────────────────────── */
  /**
   * Mark a script as bot-built and optionally locked.
   */
  function _runProtect(payload) {
    const id = payload.scriptId;
    if (!id) return { error: 'no scriptId provided' };

    _protectedScripts.add(id);
    console.log('[BOT-FARM][PROTECT] 🔒 Script protected:', id);
    _emit('script:protected', { scriptId: id, locked: true });
    return { scriptId: id, protected: true };
  }

  /**
   * Explicitly protect a script (convenience function).
   */
  function protectScript(scriptId) {
    return enqueueTask('protect', { scriptId });
  }

  /* ── Scan & Fix Pipeline ─────────────────────────────── */
  /**
   * Run a full scan-then-fix cycle.
   * @param {string} [botId]
   * @returns {object} { scanTask, fixTask }
   */
  function scanAndFix(botId) {
    const scanTask = enqueueTask('scan', { target: 'page' }, botId);
    runTask(scanTask.id);

    const issues = (scanTask.result && scanTask.result.issues) || [];
    const fixTask = enqueueTask('fix', { issues }, botId);
    runTask(fixTask.id);

    console.log('[BOT-FARM] Scan-and-fix cycle complete:',
      issues.length, 'issues found,',
      ((fixTask.result && fixTask.result.fixed) || []).length, 'fixed');

    return { scanTask, fixTask };
  }

  /* ── Audit Log ───────────────────────────────────────── */
  function getAuditLog(limit) {
    if (limit && limit > 0) return _auditLog.slice(-limit);
    return [..._auditLog];
  }

  function getBots()  { return Object.values(_botRegistry); }
  function getQueue() { return [..._taskQueue]; }

  /* ── Auto-init: register default bots ───────────────── */
  function initDefaultBots() {
    registerBot('BOT-SCANNER',  ['scan']);
    registerBot('BOT-FIXER',    ['fix']);
    registerBot('BOT-CODEGEN',  ['generate']);
    registerBot('BOT-GUARDIAN', ['scan', 'fix', 'protect']);
    console.log('[BOT-FARM] Default bots initialized.');
  }

  /* ── Public API ──────────────────────────────────────── */
  const BotFarm = {
    registerBot,
    enqueueTask,
    runTask,
    scanAndFix,
    protectScript,
    getAuditLog,
    getBots,
    getQueue,
    initDefaultBots,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BotFarm;
  } else {
    global.BotFarm = BotFarm;
  }

  console.log('[BOT-FARM] bot-farm-hooks.js loaded. Bot farm ready for deployment.');

}(typeof window !== 'undefined' ? window : this));
