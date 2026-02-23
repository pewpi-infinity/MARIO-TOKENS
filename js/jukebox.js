/* ============================================================
   jukebox.js — Retro Music Player with Canvas Visualizer
   Synch Pipe Arcade Hub · pewpi-infinity
   ============================================================ */
var Jukebox = (function () {
  'use strict';

  var _playlist      = [];
  var _shuffled      = [];
  var _currentIndex  = 0;
  var _isPlaying     = false;
  var _isShuffled    = false;
  var _volume        = 0.7;
  var _audio         = null;
  var _vizCanvas     = null;
  var _vizCtx        = null;
  var _vizBars       = [];
  var _vizRaf        = null;
  var _onTrackChange = null;

  var IA_STREAM = 'https://archive.org/download/';

  function init(playlist) {
    try {
      _playlist = Array.isArray(playlist) ? playlist : [];
      _shuffled = _playlist.slice();
      _audio    = new Audio();
      _audio.volume = _volume;
      _audio.crossOrigin = 'anonymous';

      _audio.addEventListener('ended',  function () { next(); });
      _audio.addEventListener('error',  function () { _handleAudioError(); });
      _audio.addEventListener('timeupdate', function () { _updateProgress(); });

      _initVizBars();
      _startVizLoop();
    } catch (e) {
      console.error('[Jukebox] init error:', e);
    }
  }

  function play() {
    try {
      if (!_audio || _playlist.length === 0) return;
      var track = _getCurrentTrack();
      if (!track) return;

      if (_audio.src !== _trackUrl(track)) {
        _audio.src = _trackUrl(track);
        _audio.load();
      }
      var promise = _audio.play();
      if (promise && promise.catch) {
        promise.catch(function (err) {
          console.warn('[Jukebox] playback blocked:', err);
        });
      }
      _isPlaying = true;
      _notifyChange();
    } catch (e) {
      console.error('[Jukebox] play error:', e);
    }
  }

  function pause() {
    try {
      if (_audio) { _audio.pause(); }
      _isPlaying = false;
      _notifyChange();
    } catch (e) {
      console.error('[Jukebox] pause error:', e);
    }
  }

  function next() {
    try {
      var list = _isShuffled ? _shuffled : _playlist;
      _currentIndex = (_currentIndex + 1) % list.length;
      if (_isPlaying) { _loadAndPlay(); } else { _updateTrack(); }
      _notifyChange();
    } catch (e) {
      console.error('[Jukebox] next error:', e);
    }
  }

  function prev() {
    try {
      var list = _isShuffled ? _shuffled : _playlist;
      _currentIndex = (_currentIndex - 1 + list.length) % list.length;
      if (_isPlaying) { _loadAndPlay(); } else { _updateTrack(); }
      _notifyChange();
    } catch (e) {
      console.error('[Jukebox] prev error:', e);
    }
  }

  function shuffle() {
    try {
      _isShuffled = !_isShuffled;
      if (_isShuffled) {
        _shuffled = _playlist.slice().sort(function () { return Math.random() - 0.5; });
      }
      return _isShuffled;
    } catch (e) {
      console.error('[Jukebox] shuffle error:', e);
      return false;
    }
  }

  function setVolume(v) {
    try {
      _volume = Math.max(0, Math.min(1, parseFloat(v) || 0));
      if (_audio) _audio.volume = _volume;
    } catch (e) {
      console.error('[Jukebox] setVolume error:', e);
    }
  }

  function selectTrack(index) {
    try {
      var list = _isShuffled ? _shuffled : _playlist;
      if (index < 0 || index >= list.length) return;
      _currentIndex = index;
      _isPlaying = true;
      _loadAndPlay();
      _notifyChange();
    } catch (e) {
      console.error('[Jukebox] selectTrack error:', e);
    }
  }

  function search(query, callback) {
    try {
      var params = new URLSearchParams({
        q:      query + ' AND mediatype:audio',
        fl:     'identifier,title,creator',
        rows:   20,
        page:   1,
        output: 'json'
      });
      fetch('https://archive.org/advancedsearch.php?' + params.toString())
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var docs = (data && data.response && data.response.docs) ? data.response.docs : [];
          callback(null, docs);
        })
        .catch(function (err) { callback(err, []); });
    } catch (e) {
      console.error('[Jukebox] search error:', e);
      if (callback) callback(e, []);
    }
  }

  function setCanvas(canvasEl) {
    try {
      _vizCanvas = canvasEl;
      if (_vizCanvas) {
        _vizCtx = _vizCanvas.getContext('2d');
      }
    } catch (e) { /* ignore */ }
  }

  function onTrackChange(fn) {
    _onTrackChange = fn;
  }

  function getCurrentTrack() {
    return _getCurrentTrack();
  }

  function isPlaying() {
    return _isPlaying;
  }

  function isShuffled() {
    return _isShuffled;
  }

  function getProgress() {
    if (!_audio || isNaN(_audio.duration) || _audio.duration === 0) return 0;
    return (_audio.currentTime / _audio.duration) * 100;
  }

  // ── Private ──────────────────────────────────────────────

  function _getCurrentTrack() {
    var list = _isShuffled ? _shuffled : _playlist;
    return list[_currentIndex] || null;
  }

  function _trackUrl(track) {
    if (!track) return '';
    if (track.url) return track.url;
    if (track.archive_id && track.file) {
      return IA_STREAM + encodeURIComponent(track.archive_id) + '/' + encodeURIComponent(track.file);
    }
    return '';
  }

  function _loadAndPlay() {
    var track = _getCurrentTrack();
    if (!track || !_audio) return;
    var url = _trackUrl(track);
    if (!url) { next(); return; }
    _audio.src = url;
    _audio.load();
    var p = _audio.play();
    if (p && p.catch) {
      p.catch(function (err) {
        console.warn('[Jukebox] autoplay blocked:', err);
        _isPlaying = false;
        _notifyChange();
      });
    }
  }

  function _updateTrack() {
    _notifyChange();
  }

  function _handleAudioError() {
    console.warn('[Jukebox] audio error, skipping to next track');
    setTimeout(function () { next(); }, 1200);
  }

  function _updateProgress() {
    var pct = getProgress();
    var fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = pct + '%';

    // Time display
    var timeEl = document.getElementById('np-time');
    if (timeEl && _audio) {
      var c = _audio.currentTime || 0;
      var d = _audio.duration || 0;
      timeEl.textContent = _fmtTime(c) + ' / ' + _fmtTime(d);
    }
  }

  function _fmtTime(s) {
    if (isNaN(s)) return '0:00';
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function _notifyChange() {
    if (_onTrackChange) {
      try { _onTrackChange(_getCurrentTrack(), _isPlaying, _currentIndex); } catch (e) { /* */ }
    }
  }

  // ── Visualizer ──────────────────────────────────────────

  var VIZ_MAX_HEIGHT  = 0.3;
  var VIZ_MAX_VEL     = 0.05;
  var VIZ_MIN_VEL     = 0.01;

  function _initVizBars() {
    _vizBars = [];
    for (var i = 0; i < 32; i++) {
      _vizBars.push({ height: Math.random() * VIZ_MAX_HEIGHT, velocity: (Math.random() * VIZ_MAX_VEL) + VIZ_MIN_VEL });
    }
  }

  function _startVizLoop() {
    function frame() {
      _vizRaf = requestAnimationFrame(frame);
      _drawViz();
    }
    _vizRaf = requestAnimationFrame(frame);
  }

  function _drawViz() {
    if (!_vizCanvas || !_vizCtx) return;
    var W = _vizCanvas.width  = _vizCanvas.offsetWidth  || 640;
    var H = _vizCanvas.height = _vizCanvas.offsetHeight || 60;
    _vizCtx.clearRect(0, 0, W, H);

    var barW = (W / _vizBars.length) - 2;
    _vizBars.forEach(function (bar, i) {
      if (_isPlaying) {
        bar.height += bar.velocity * (Math.random() > 0.5 ? 1 : -1);
        bar.height = Math.max(0.04, Math.min(1.0, bar.height));
      } else {
        bar.height = Math.max(0.04, bar.height * 0.95);
      }

      var bH = bar.height * H;
      var x  = i * (barW + 2);

      var grad = _vizCtx.createLinearGradient(0, H - bH, 0, H);
      grad.addColorStop(0,   '#ffcc00');
      grad.addColorStop(0.5, '#b89000');
      grad.addColorStop(1,   '#664400');
      _vizCtx.fillStyle = grad;
      _vizCtx.fillRect(x, H - bH, barW, bH);
    });
  }

  return {
    init:         init,
    play:         play,
    pause:        pause,
    next:         next,
    prev:         prev,
    shuffle:      shuffle,
    setVolume:    setVolume,
    selectTrack:  selectTrack,
    search:       search,
    setCanvas:    setCanvas,
    onTrackChange:onTrackChange,
    getCurrentTrack: getCurrentTrack,
    isPlaying:    isPlaying,
    isShuffled:   isShuffled,
    getProgress:  getProgress
  };
}());
