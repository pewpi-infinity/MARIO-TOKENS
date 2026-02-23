/* ============================================================
   character-builder.js — Pixel Art Canvas Builder
   Synch Pipe Arcade Hub · pewpi-infinity
   ============================================================ */
var CharacterBuilder = (function () {
  'use strict';

  var STORAGE_KEY = 'characterBuilder_save';
  var _canvas    = null;
  var _ctx       = null;
  var _gridSize  = 16;       // cells per side
  var _cellSize  = 24;       // px per cell
  var _grid      = [];       // flat array of hex colors or null
  var _color     = '#ff0000';
  var _tool      = 'draw';   // 'draw' | 'erase' | 'fill'
  var _drawing   = false;

  var ALLOWED_GRID_SIZES = [8, 16, 32];

  function init(canvasId, size) {
    try {
      _canvas = document.getElementById(canvasId);
      if (!_canvas) { console.error('[CharacterBuilder] canvas not found:', canvasId); return; }
      _gridSize = ALLOWED_GRID_SIZES.indexOf(size) !== -1 ? size : 16;
      _cellSize = Math.floor(384 / _gridSize);
      _canvas.width  = _gridSize * _cellSize;
      _canvas.height = _gridSize * _cellSize;
      _ctx = _canvas.getContext('2d');
      _initGrid();
      _bindEvents();
      _render();
    } catch (e) {
      console.error('[CharacterBuilder] init error:', e);
    }
  }

  function setColor(hex) {
    _color = hex || '#ff0000';
    var preview = document.getElementById('current-color-box');
    if (preview) preview.style.background = _color;
    var hexEl = document.getElementById('color-hex');
    if (hexEl) hexEl.textContent = _color.toUpperCase();
  }

  function setTool(tool) {
    _tool = (['draw','erase','fill'].indexOf(tool) !== -1) ? tool : 'draw';
  }

  function clear() {
    _initGrid();
    _render();
  }

  function resize(newSize) {
    try {
      _gridSize = (newSize === 8 || newSize === 16 || newSize === 32) ? newSize : 16;
      _cellSize = Math.floor(384 / _gridSize);
      if (_canvas) {
        _canvas.width  = _gridSize * _cellSize;
        _canvas.height = _gridSize * _cellSize;
      }
      _initGrid();
      _render();
    } catch (e) {
      console.error('[CharacterBuilder] resize error:', e);
    }
  }

  function exportPNG() {
    try {
      if (!_canvas) return;
      var link = document.createElement('a');
      link.download = 'pixel-art-' + Date.now() + '.png';
      link.href = _canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('[CharacterBuilder] exportPNG error:', e);
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ grid: _grid, size: _gridSize }));
      return true;
    } catch (e) {
      console.error('[CharacterBuilder] save error:', e);
      return false;
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      if (data && Array.isArray(data.grid)) {
        _gridSize = data.size || 16;
        _cellSize = Math.floor(384 / _gridSize);
        if (_canvas) {
          _canvas.width  = _gridSize * _cellSize;
          _canvas.height = _gridSize * _cellSize;
        }
        _grid = data.grid;
        _render();
        return true;
      }
      return false;
    } catch (e) {
      console.error('[CharacterBuilder] load error:', e);
      return false;
    }
  }

  function loadTemplate(pixelData) {
    try {
      // pixelData: flat array of hex strings (or null) matching current grid size
      if (!Array.isArray(pixelData)) return;
      _initGrid();
      var len = Math.min(pixelData.length, _gridSize * _gridSize);
      for (var i = 0; i < len; i++) {
        _grid[i] = pixelData[i] || null;
      }
      _render();
    } catch (e) {
      console.error('[CharacterBuilder] loadTemplate error:', e);
    }
  }

  function loadTemplatePattern(name) {
    var patterns = _getTemplatePatterns();
    var pat = patterns[name];
    if (pat) {
      // resize to 16x16 first
      resize(16);
      loadTemplate(pat);
    }
  }

  // ── Private ──────────────────────────────────────────────

  function _initGrid() {
    _grid = new Array(_gridSize * _gridSize).fill(null);
  }

  function _bindEvents() {
    _canvas.addEventListener('mousedown', function (e) { _drawing = true; _applyTool(e); });
    _canvas.addEventListener('mousemove', function (e) { if (_drawing) _applyTool(e); });
    _canvas.addEventListener('mouseup',   function ()  { _drawing = false; });
    _canvas.addEventListener('mouseleave',function ()  { _drawing = false; });

    // Touch support
    _canvas.addEventListener('touchstart', function (e) {
      e.preventDefault(); _drawing = true; _applyTool(e.touches[0]);
    }, { passive: false });
    _canvas.addEventListener('touchmove', function (e) {
      e.preventDefault(); if (_drawing) _applyTool(e.touches[0]);
    }, { passive: false });
    _canvas.addEventListener('touchend', function () { _drawing = false; });
  }

  function _getCell(e) {
    var rect = _canvas.getBoundingClientRect();
    var scaleX = _canvas.width  / rect.width;
    var scaleY = _canvas.height / rect.height;
    var x = Math.floor((e.clientX - rect.left) * scaleX / _cellSize);
    var y = Math.floor((e.clientY - rect.top)  * scaleY / _cellSize);
    if (x < 0 || y < 0 || x >= _gridSize || y >= _gridSize) return null;
    return { x: x, y: y, idx: y * _gridSize + x };
  }

  function _applyTool(e) {
    var cell = _getCell(e);
    if (!cell) return;
    if (_tool === 'draw') {
      _grid[cell.idx] = _color;
      _renderCell(cell.x, cell.y);
    } else if (_tool === 'erase') {
      _grid[cell.idx] = null;
      _renderCell(cell.x, cell.y);
    } else if (_tool === 'fill') {
      _floodFill(cell.x, cell.y, _grid[cell.idx], _color);
      _render();
    }
  }

  function _floodFill(x, y, targetColor, fillColor) {
    if (targetColor === fillColor) return;
    var stack = [{ x: x, y: y }];
    var visited = new Set();
    while (stack.length > 0) {
      var pos = stack.pop();
      var idx = pos.y * _gridSize + pos.x;
      if (pos.x < 0 || pos.y < 0 || pos.x >= _gridSize || pos.y >= _gridSize) continue;
      if (visited.has(idx)) continue;
      if (_grid[idx] !== targetColor) continue;
      visited.add(idx);
      _grid[idx] = fillColor;
      stack.push({ x: pos.x+1, y: pos.y });
      stack.push({ x: pos.x-1, y: pos.y });
      stack.push({ x: pos.x,   y: pos.y+1 });
      stack.push({ x: pos.x,   y: pos.y-1 });
    }
  }

  function _render() {
    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    // Background checkerboard
    for (var row = 0; row < _gridSize; row++) {
      for (var col = 0; col < _gridSize; col++) {
        var idx = row * _gridSize + col;
        _ctx.fillStyle = ((row + col) % 2 === 0) ? '#1a1a2e' : '#0d0d1f';
        _ctx.fillRect(col * _cellSize, row * _cellSize, _cellSize, _cellSize);
        if (_grid[idx]) {
          _ctx.fillStyle = _grid[idx];
          _ctx.fillRect(col * _cellSize, row * _cellSize, _cellSize, _cellSize);
        }
        // Grid line
        _ctx.strokeStyle = 'rgba(255,204,0,0.08)';
        _ctx.strokeRect(col * _cellSize + 0.5, row * _cellSize + 0.5, _cellSize - 1, _cellSize - 1);
      }
    }
  }

  function _renderCell(col, row) {
    if (!_ctx) return;
    var idx = row * _gridSize + col;
    _ctx.fillStyle = ((row + col) % 2 === 0) ? '#1a1a2e' : '#0d0d1f';
    _ctx.fillRect(col * _cellSize, row * _cellSize, _cellSize, _cellSize);
    if (_grid[idx]) {
      _ctx.fillStyle = _grid[idx];
      _ctx.fillRect(col * _cellSize, row * _cellSize, _cellSize, _cellSize);
    }
    _ctx.strokeStyle = 'rgba(255,204,0,0.08)';
    _ctx.strokeRect(col * _cellSize + 0.5, row * _cellSize + 0.5, _cellSize - 1, _cellSize - 1);
  }

  // Simple pre-built 16x16 pixel templates
  function _getTemplatePatterns() {
    var R = '#ff0000', W = '#ffffff', S = '#964b00', B = '#000000',
        G = '#00aa00', Y = '#ffcc00', K = '#0055ff', N = null;
    return {
      mario: [
        N,N,N,N,N,R,R,R,R,R,N,N,N,N,N,N,
        N,N,N,N,R,R,R,R,R,R,R,R,R,N,N,N,
        N,N,N,N,S,S,S,W,W,S,W,N,N,N,N,N,
        N,N,N,S,W,S,W,W,W,S,W,W,W,N,N,N,
        N,N,N,S,W,S,S,W,W,W,S,W,W,W,N,N,
        N,N,N,S,S,W,W,W,W,S,S,S,S,N,N,N,
        N,N,N,N,N,W,W,W,W,W,W,N,N,N,N,N,
        N,N,N,R,R,B,R,R,R,B,R,R,N,N,N,N,
        N,N,R,R,R,B,R,R,R,B,R,R,R,N,N,N,
        N,R,R,R,R,B,B,B,B,B,R,R,R,R,N,N,
        N,W,W,R,B,Y,B,B,Y,B,R,W,W,N,N,N,
        N,W,W,W,B,B,B,B,B,B,W,W,W,N,N,N,
        N,W,W,B,B,B,N,N,B,B,B,W,N,N,N,N,
        N,N,N,S,S,S,N,N,S,S,S,N,N,N,N,N,
        N,N,S,S,S,S,N,N,S,S,S,S,N,N,N,N,
        N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N
      ],
      mushroom: [
        N,N,N,N,R,R,R,R,R,R,R,N,N,N,N,N,
        N,N,N,R,R,R,R,R,R,R,R,R,N,N,N,N,
        N,N,R,R,R,W,W,R,R,R,W,R,R,N,N,N,
        N,R,R,R,W,W,W,R,R,W,W,W,R,R,N,N,
        N,R,R,R,W,W,W,R,R,W,W,W,R,R,N,N,
        N,R,R,R,R,R,R,R,R,R,R,R,R,R,N,N,
        N,N,R,R,R,R,R,R,R,R,R,R,R,N,N,N,
        N,N,N,S,S,S,S,S,S,S,S,N,N,N,N,N,
        N,N,S,S,W,S,S,S,S,W,S,S,N,N,N,N,
        N,N,S,S,W,W,S,S,W,W,S,S,N,N,N,N,
        N,N,S,S,S,S,S,S,S,S,S,S,N,N,N,N,
        N,N,N,S,S,S,S,S,S,S,S,N,N,N,N,N,
        N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
        N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
        N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
        N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N
      ],
      goomba: [
        N,N,N,N,S,S,S,S,S,S,N,N,N,N,N,N,
        N,N,N,S,S,S,S,S,S,S,S,N,N,N,N,N,
        N,N,S,S,S,S,S,S,S,S,S,S,N,N,N,N,
        N,N,S,S,B,B,S,S,B,B,S,S,N,N,N,N,
        N,N,S,B,W,B,S,S,B,W,B,S,N,N,N,N,
        N,N,S,S,B,B,S,S,B,B,S,S,N,N,N,N,
        N,N,S,S,S,S,S,S,S,S,S,S,N,N,N,N,
        N,N,S,S,W,S,S,S,S,W,S,S,N,N,N,N,
        N,N,S,S,S,W,W,W,W,S,S,S,N,N,N,N,
        N,N,S,S,S,S,S,S,S,S,S,S,N,N,N,N,
        N,S,B,S,S,S,S,S,S,S,S,B,S,N,N,N,
        S,B,B,B,S,S,S,S,S,S,B,B,B,S,N,N,
        N,N,N,S,S,S,N,N,S,S,S,N,N,N,N,N,
        N,N,N,S,S,N,N,N,N,S,S,N,N,N,N,N,
        N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
        N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N
      ],
      coin: [
        N,N,N,N,N,Y,Y,Y,Y,N,N,N,N,N,N,N,
        N,N,N,N,Y,Y,Y,Y,Y,Y,N,N,N,N,N,N,
        N,N,N,Y,Y,Y,Y,Y,Y,Y,Y,N,N,N,N,N,
        N,N,Y,Y,Y,W,Y,Y,W,Y,Y,Y,N,N,N,N,
        N,N,Y,Y,W,W,Y,Y,W,W,Y,Y,N,N,N,N,
        N,N,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,N,N,N,N,
        N,N,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,N,N,N,N,
        N,N,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,N,N,N,N,
        N,N,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,N,N,N,N,
        N,N,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,N,N,N,N,
        N,N,N,Y,Y,Y,Y,Y,Y,Y,Y,N,N,N,N,N,
        N,N,N,N,Y,Y,Y,Y,Y,Y,N,N,N,N,N,N,
        N,N,N,N,N,Y,Y,Y,Y,N,N,N,N,N,N,N,
        N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
        N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,
        N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N
      ],
      luigi: [
        N,N,N,N,N,G,G,G,G,G,N,N,N,N,N,N,
        N,N,N,N,G,G,G,G,G,G,G,G,G,N,N,N,
        N,N,N,N,S,S,S,W,W,S,W,N,N,N,N,N,
        N,N,N,S,W,S,W,W,W,S,W,W,W,N,N,N,
        N,N,N,S,W,S,S,W,W,W,S,W,W,W,N,N,
        N,N,N,S,S,W,W,W,W,S,S,S,S,N,N,N,
        N,N,N,N,N,W,W,W,W,W,W,N,N,N,N,N,
        N,N,N,G,G,B,G,G,G,B,G,G,N,N,N,N,
        N,N,G,G,G,B,G,G,G,B,G,G,G,N,N,N,
        N,G,G,G,G,B,B,B,B,B,G,G,G,G,N,N,
        N,W,W,G,B,Y,B,B,Y,B,G,W,W,N,N,N,
        N,W,W,W,B,B,B,B,B,B,W,W,W,N,N,N,
        N,W,W,B,B,B,N,N,B,B,B,W,N,N,N,N,
        N,N,N,S,S,S,N,N,S,S,S,N,N,N,N,N,
        N,N,S,S,S,S,N,N,S,S,S,S,N,N,N,N,
        N,N,N,N,N,N,N,N,N,N,N,N,N,N,N,N
      ]
    };
  }

  return {
    init:             init,
    setColor:         setColor,
    setTool:          setTool,
    clear:            clear,
    resize:           resize,
    exportPNG:        exportPNG,
    save:             save,
    load:             load,
    loadTemplate:     loadTemplate,
    loadTemplatePattern: loadTemplatePattern
  };
}());
