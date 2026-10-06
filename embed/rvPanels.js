/* rvPanels.js — registers every panel on the RUDVENTUR hub (index.html) with
   embed/panel-toggle.js, so they all hide and show the same way and remember
   it on this device (localStorage 'rv_panels').

     header    the RUDVENTUR title            hidden → tab under the top edge
     zones     the "→ The Map …" jump strip   hidden → tab under the top edge
     map, bank, user, social, os, tools, chem, repos
               the tiles                       fold up to their header
                                               (clicking the header itself
                                               still opens full screen)
     taskbar   rvDesk's bottom taskbar         hidden → 🎃 tab at the bottom

   Load after panel-toggle.js (no defer needed: it waits for the page and for
   rvDesk to build the taskbar). Nothing in rvDesk.js itself changes.
*/
(function () {
  'use strict';
  var P = window.sfPanels;
  if (!P) return;

  // a panel that is hidden by a body class (sf-hidden-<id>) rather than folded
  function bodyPanel(id, el, label, side) {
    P.register({
      id: id, el: el, label: label, side: side,
      read: function () { return !document.body.classList.contains('sf-hidden-' + id); },
      apply: function (open) { document.body.classList.toggle('sf-hidden-' + id, !open); }
    });
    P.set(id, P.saved(id, true), { noSave: true });
  }

  var TILES = {
    map: 'The Map', bank: 'The Bank', user: 'The User', social: 'The Social',
    os: 'The OS', tools: 'The Tools', chem: 'ChemVentur', repos: 'The Repos'
  };

  // ── the taskbar comes from embed/rvDesk.js; give it the same toggle ──
  var DESK_CSS = [
    '#rvd-taskbar .sf-ptoggle{margin-left:4px;height:28px;--sf-panel-accent:var(--rvd-neon,#00ff41);',
    '--sf-panel-text:var(--rvd-neon,#00ff41);--sf-panel-ink:#000;text-transform:uppercase;letter-spacing:1px}',
    'body.sf-hidden-taskbar #rvd-taskbar{display:none}',
    'body.sf-hidden-taskbar{padding-bottom:0}',
    'body.sf-hidden-taskbar .rvd-corner{bottom:16px}',
    '#rvd-taskbar-tab{display:none;position:fixed;left:50%;bottom:0;transform:translateX(-50%);z-index:2000001;',
    'padding:3px 14px;border-radius:6px 6px 0 0;--sf-panel-accent:var(--rvd-neon,#00ff41);--sf-panel-ink:#000;',
    'text-transform:uppercase;letter-spacing:1px;box-shadow:0 -2px 12px rgba(0,255,65,.25)}',
    'body.sf-hidden-taskbar #rvd-taskbar-tab{display:flex}',
    'html.rvp-open #rvd-taskbar-tab{display:none}'
  ].join('');

  function deskTaskbar(tries) {
    var bar = document.getElementById('rvd-taskbar');
    if (!bar) {   // rvDesk not on this page (or not built yet)
      if (tries < 20) setTimeout(function () { deskTaskbar(tries + 1); }, 150);
      return;
    }
    if (bar.querySelector('[data-panel-toggle]')) return;
    var st = document.createElement('style');
    st.id = 'rvPanelsDesk';
    st.textContent = DESK_CSS;
    document.head.appendChild(st);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sf-ptoggle';
    btn.dataset.panelToggle = 'taskbar';
    btn.innerHTML = '<span class="sf-pt-icon"></span><span class="sf-pt-label"></span>';
    bar.appendChild(btn);

    var tab = document.createElement('button');
    tab.type = 'button';
    tab.id = 'rvd-taskbar-tab';
    tab.className = 'sf-ptab';
    tab.dataset.panelToggle = 'taskbar';
    tab.innerHTML = '<span class="sf-pt-icon"></span><span class="sf-pt-label" data-closed="🎃 taskbar"></span>';
    document.body.appendChild(tab);

    bodyPanel('taskbar', bar, 'the taskbar', 'bottom');
  }

  function start() {
    if (document.getElementById('siteHeader')) bodyPanel('header', '#siteHeader', 'the RUDVENTUR title', 'top');
    if (document.getElementById('zoneNav')) bodyPanel('zones', '#zoneNav', 'the jump strip', 'top');
    Object.keys(TILES).forEach(function (id) {
      var el = document.querySelector('.panel--' + id);
      if (el) P.register({ id: id, el: el, label: TILES[id], side: 'top' });
    });
    deskTaskbar(0);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
