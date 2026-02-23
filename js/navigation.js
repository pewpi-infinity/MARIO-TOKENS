/* ============================================================
   navigation.js — Client-side navigation helper
   Synch Pipe Arcade Hub · pewpi-infinity
   ============================================================ */
var Navigation = (function () {
  'use strict';

  function init() {
    try {
      _setupHamburger();
      _highlightActivePage();
      _setupBackButton();
    } catch (e) {
      console.warn('[Navigation] init error:', e);
    }
  }

  function _setupHamburger() {
    // Close nav drawer when any nav link is clicked
    var navLinks = document.querySelectorAll('.nav-drawer a');
    var toggle = document.getElementById('nav-toggle');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        if (toggle) toggle.checked = false;
      });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!toggle) return;
      var nav = document.querySelector('.nav-drawer');
      var hamburger = document.querySelector('.hamburger');
      if (toggle.checked && nav && hamburger &&
          !nav.contains(e.target) && !hamburger.contains(e.target)) {
        toggle.checked = false;
      }
    });
  }

  function _highlightActivePage() {
    var currentPath = window.location.pathname;
    var links = document.querySelectorAll('.nav-drawer a');
    links.forEach(function (link) {
      try {
        var href = link.getAttribute('href') || '';
        // Match on filename portion
        var linkFile = href.split('/').pop().split('?')[0];
        var currentFile = currentPath.split('/').pop().split('?')[0];
        if (linkFile && currentFile && linkFile === currentFile) {
          link.classList.add('nav-active');
          link.setAttribute('aria-current', 'page');
        }
      } catch (err) { /* ignore */ }
    });
  }

  function _setupBackButton() {
    var backBtns = document.querySelectorAll('[data-action="back"]');
    backBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = '../index.html';
        }
      });
    });
  }

  return { init: init };
}());

document.addEventListener('DOMContentLoaded', function () {
  Navigation.init();
});
