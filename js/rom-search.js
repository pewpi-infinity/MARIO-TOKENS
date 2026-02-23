/* ============================================================
   rom-search.js — Internet Archive ROM Search
   Synch Pipe Arcade Hub · pewpi-infinity
   ============================================================ */
var RomSearch = (function () {
  'use strict';

  var IA_API = 'https://archive.org/advancedsearch.php';
  var ROM_BASE = 'https://archive.org/download/';

  function search(query, callback) {
    if (!query || !callback) return;
    try {
      var params = new URLSearchParams({
        q:      query + ' AND mediatype:software',
        fl:     'identifier,title,description',
        rows:   20,
        page:   1,
        output: 'json'
      });
      var url = IA_API + '?' + params.toString();

      fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var docs = (data && data.response && data.response.docs) ? data.response.docs : [];
          callback(null, docs);
        })
        .catch(function (err) {
          console.warn('[RomSearch] fetch error:', err);
          callback(err, []);
        });
    } catch (e) {
      console.error('[RomSearch] search error:', e);
      callback(e, []);
    }
  }

  function renderResults(results, container) {
    if (!container) return;
    try {
      container.innerHTML = '';
      if (!results || results.length === 0) {
        container.innerHTML = '<div style="padding:12px;color:var(--text-dim);font-size:0.75rem">No results found.</div>';
        return;
      }
      results.forEach(function (item) {
        var div = document.createElement('div');
        div.className = 'rom-result-item';

        var titleSpan = document.createElement('span');
        titleSpan.className = 'rom-title';
        titleSpan.textContent = item.title || item.identifier;

        var btn = document.createElement('button');
        btn.className = 'rom-load-btn';
        btn.textContent = 'LOAD';
        btn.addEventListener('click', function () {
          loadRom(item.identifier, item.identifier + '.nes');
        });

        div.appendChild(titleSpan);
        div.appendChild(btn);
        container.appendChild(div);
      });
    } catch (e) {
      console.error('[RomSearch] renderResults error:', e);
    }
  }

  function loadRom(identifier, filename) {
    try {
      if (!identifier || !filename) return;
      var url = ROM_BASE + encodeURIComponent(identifier) + '/' + encodeURIComponent(filename);
      if (window.EmulatorManager) {
        EmulatorManager.loadRom(url);
      } else {
        console.warn('[RomSearch] EmulatorManager not available. ROM URL:', url);
      }
    } catch (e) {
      console.error('[RomSearch] loadRom error:', e);
    }
  }

  return { search: search, renderResults: renderResults, loadRom: loadRom };
}());
