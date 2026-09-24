/* rvDesk.js — the Windows 13 desktop for the RUDVENTUR hub.

   Drop-in (after rvView.js):
     <script src="embed/rvDesk.js" defer></script>

   Puts the Windows 13 layout straight onto the page (no ENTER screen):
     top-left      RUDVENTUR notch menu (maps, tools, social, bank, OS, ChemVentur,
                   view modes, Ko-fi)
     top-right     the R circle + useRbox (embed/useRbox.js; not built here)
     bottom-left   ⌨️ Keyboards, 💬 Global Chat
     bottom-right  🍿 Popcorn Hub
     bottom-middle taskbar: 🎃 start button, one button per open window, clock

   Services open in floating windows (drag the title bar, resize from the
   corner, ⛶ = full screen, _ = minimise to the taskbar, ↗ = real tab, ✕).
   On phones windows open full size. Sites that refuse to be shown inside
   another page (Ko-fi, Zoom Earth) open as a real tab instead.
*/
(function () {
  'use strict';
  if (window.rvDesk) return;

  var scriptEl = document.currentScript;
  // services are listed relative to the hub root (the folder above embed/)
  var HUB = scriptEl ? new URL('..', scriptEl.src).href : new URL('./', location.href).href;
  function url(u) { return new URL(u, HUB).href; }

  var APPS = {
    keyboard:   { icon: '⌨️', title: 'World Keyboards', src: 'windows13/keyboard-realistic.html', w: 860, h: 560 },
    chat:       { icon: '💬', title: 'Global Chat', src: 'global-chat-v5/index.html', w: 480, h: 620 },
    popcorn:    { icon: '🍿', title: 'Popcorn Hub', src: 'bottom-right-popcorn-complete.html', w: 560, h: 700 },
    mapmerger:  { icon: '🗺️', title: 'Map Merger Venti', src: 'map-merger-venti/index.html', w: 1000, h: 680 },
    translator: { icon: '🌐', title: 'Translator v7', src: 'map-merger-venti/translator_v7.html', w: 1000, h: 680 },
    snout:      { icon: '🐾', title: 'Snout First', src: 'map-merger-venti/snout-first.html', w: 900, h: 680 },
    weather:    { icon: '🌦️', title: 'Weather News', src: 'yesterday-today-tomorrow-weather.html', w: 720, h: 640 },
    ventusky:   { icon: '🌬️', title: 'Ventusky', src: 'https://www.ventusky.com/', w: 1000, h: 680 },
    windy:      { icon: '💨', title: 'Windy', src: 'https://embed.windy.com/embed.html?type=map&zoom=4&overlay=wind', w: 1000, h: 680 },
    blitz:      { icon: '⚡', title: 'Blitzortung', src: 'https://map.blitzortung.org/', w: 1000, h: 680 },
    nullschool: { icon: '🌍', title: 'Nullschool Earth', src: 'https://earth.nullschool.net/', w: 1000, h: 680 },
    zoomearth:  { icon: '🛰️', title: 'Zoom Earth', src: 'https://zoom.earth/', tab: true },
    social:     { icon: '🎸', title: 'RudVentur Social', src: 'punk-script/index.html', w: 760, h: 680 },
    bank:       { icon: '💰', title: 'Bank / Ledger', src: 'https://rudventur.github.io/bank/', w: 900, h: 700 },
    vault:      { icon: '🍿', title: 'Popcoin Vault', src: 'bottom-right-popcorn-complete.html', w: 560, h: 700 },
    win13:      { icon: '🪟', title: 'WINDOWS 13', src: 'windows13/WINDOWS13-MASTER.html', w: 1000, h: 700 },
    luxwin:     { icon: '🐧', title: 'LuxWin13', src: 'LuxWin13/notch-menu-final.html', w: 900, h: 640 },
    chemmulti:  { icon: '⚗️', title: 'ChemVentur Multi v118', src: 'https://rudventur.github.io/ChemVentur-Multi-v118/', w: 1100, h: 720 },
    chem:       { icon: '🧬', title: 'ChemVentur (classic)', src: 'ChemVentur/index.html', w: 1100, h: 720 },
    typegame:   { icon: '⌨️', title: 'Type Game', src: 'https://rudventur.github.io/punk-script/type-game.html', w: 1000, h: 700 },
    kofi:       { icon: '☕', title: 'Ko-fi', src: 'https://ko-fi.com/rudventur', tab: true }
  };
  var MENU = [
    ['🗺️ MAPS', ['mapmerger', 'ventusky', 'windy', 'blitz', 'nullschool', 'zoomearth']],
    ['🛠️ TOOLS', ['translator', 'snout', 'weather', 'keyboard']],
    ['🎸 SOCIAL', ['social', 'chat']],
    ['💰 BANK', ['bank', 'vault']],
    ['🪟 OS', ['win13', 'luxwin']],
    ['☢️ CHEMVENTUR', ['chemmulti', 'chem', 'typegame']]
  ];

  var CSS = [
    ':root{--rvd-neon:#00ff41;--rvd-yellow:#ffe600;--rvd-bg:#07090a}',
    'body{padding-bottom:52px}',
    /* notch (top-left) */
    '#rvd-notch{position:fixed;top:10px;left:10px;z-index:1600;padding:7px 14px;background:#000;border:1px solid var(--rvd-neon);',
    'border-radius:0 0 12px 12px;color:var(--rvd-neon);font:900 13px/1 ui-monospace,monospace;letter-spacing:2px;cursor:pointer;',
    'box-shadow:0 0 12px rgba(0,255,65,.35);user-select:none}',
    '#rvd-notch:hover{background:#021a08}',
    '#rvd-menu{position:fixed;top:44px;left:10px;z-index:2000002;width:250px;max-height:calc(100vh - 110px);overflow-y:auto;',
    'background:#0b0d0e;border:1px solid #1f3a26;border-radius:10px;padding:6px;display:none;',
    'box-shadow:0 14px 40px rgba(0,0,0,.75);font:12px ui-monospace,monospace}',
    '#rvd-menu.open{display:block}',
    '#rvd-menu .rvd-mi{display:flex;justify-content:space-between;align-items:center;width:100%;text-align:left;',
    'background:none;border:0;color:#cfe;font:inherit;letter-spacing:1px;padding:10px;border-radius:6px;cursor:pointer}',
    '#rvd-menu .rvd-mi:hover{background:rgba(0,255,65,.08);color:#fff}',
    "#rvd-menu .rvd-grp::after{content:'\\25B8';color:#4a6;transition:transform .2s}",
    '#rvd-menu .rvd-grp.open::after{transform:rotate(90deg)}',
    '#rvd-menu .rvd-sub{display:none;margin:0 0 4px 10px;border-left:1px solid #1f3a26;padding-left:4px}',
    '#rvd-menu .rvd-sub.open{display:block}',
    '#rvd-menu .rvd-sub .rvd-mi{color:#9ab;font-size:11px;padding:8px 10px}',
    '#rvd-menu .rvd-sep{border-top:1px solid #1f3a26;margin:5px 4px}',
    '#rvd-menu .rvd-gold{color:var(--rvd-yellow)}',
    /* bottom corners */
    '.rvd-corner{position:fixed;bottom:62px;z-index:1600;display:flex;gap:8px}',
    '#rvd-bl{left:12px}#rvd-br{right:12px}',
    '.rvd-cbtn{width:46px;height:46px;border-radius:50%;border:1px solid var(--rvd-neon);background:#000;font-size:21px;',
    'line-height:1;cursor:pointer;box-shadow:0 0 12px rgba(0,255,65,.35);padding:0;transition:transform .15s}',
    '.rvd-cbtn:hover{transform:scale(1.1)}',
    /* taskbar (bottom-middle) */
    '#rvd-taskbar{position:fixed;left:0;right:0;bottom:0;height:46px;z-index:2000001;display:flex;align-items:center;gap:6px;',
    'padding:0 8px;background:rgba(0,0,0,.92);border-top:1px solid var(--rvd-neon);box-shadow:0 -4px 18px rgba(0,255,65,.18);',
    'font:12px ui-monospace,monospace}',
    '#rvd-start{flex:none;height:32px;padding:0 12px;border:1px solid var(--rvd-yellow);border-radius:6px;background:#000;',
    'color:var(--rvd-yellow);font:900 12px ui-monospace,monospace;letter-spacing:1px;cursor:pointer}',
    '#rvd-tasks{flex:1;display:flex;justify-content:center;gap:6px;overflow-x:auto;scrollbar-width:none}',
    '#rvd-tasks::-webkit-scrollbar{display:none}',
    '.rvd-task{flex:none;max-width:170px;height:32px;padding:0 10px;border:1px solid #2a4;border-radius:6px;background:#031;',
    'color:#cfe;font:inherit;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.rvd-task.front{background:#063;border-color:var(--rvd-neon);color:#fff}',
    '.rvd-task.min{opacity:.55}',
    '#rvd-clock{flex:none;color:var(--rvd-neon);min-width:44px;text-align:right}',
    /* windows */
    '.rvd-win{position:fixed;z-index:1100;display:flex;flex-direction:column;min-width:260px;min-height:160px;background:#000;',
    'border:1px solid var(--rvd-neon);border-radius:10px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.8),0 0 16px rgba(0,255,65,.25)}',
    '.rvd-win.min{display:none}',
    '.rvd-win.max{left:0!important;top:0!important;width:100%!important;height:calc(100% - 46px)!important;border-radius:0}',
    '.rvd-bar{flex:none;display:flex;align-items:center;gap:6px;height:34px;padding:0 4px 0 10px;background:#031a0a;',
    'color:#cfe;font:12px ui-monospace,monospace;cursor:move;user-select:none;touch-action:none}',
    '.rvd-title{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.rvd-bar button{width:30px;height:26px;border:0;border-radius:5px;background:none;color:var(--rvd-neon);',
    'font:14px/1 ui-monospace,monospace;cursor:pointer}',
    '.rvd-bar button:hover{background:rgba(0,255,65,.12)}',
    '.rvd-bar button.rvd-x:hover{background:#600;color:#fff}',
    '.rvd-win iframe{flex:1;width:100%;border:0;background:#000}',
    '.rvd-grip{position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize;touch-action:none;',
    'background:linear-gradient(135deg,transparent 50%,var(--rvd-neon) 50%);opacity:.6}',
    '.rvd-win.max .rvd-grip{display:none}',
    'body.rvd-dragging iframe{pointer-events:none}',
    'body.rvd-dragging{user-select:none}',
    '@media (max-width:640px){#rvd-notch{font-size:11px;padding:6px 10px}.rvd-cbtn{width:42px;height:42px;font-size:19px}',
    '#rvd-start{padding:0 8px}}'
  ].join('');

  var PHONE = function () { return window.innerWidth < 700; };
  var wins = {}, zTop = 1100, cascade = 0;
  var tasksEl;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function realTab(src) {
    var a = document.createElement('a');
    a.href = url(src); a.target = '_blank'; a.rel = 'noopener';
    a.setAttribute('data-rv-nolayer', '');
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ── windows ── */
  // full-size windows sit above the corner widgets (the useRbox R is z 999999);
  // the notch menu stays above everything so the taskbar's start button works
  var MAX_Z = 1000000;
  function applyZ(w) { w.el.style.zIndex = (w.el.classList.contains('max') ? MAX_Z : 0) + w.z; }
  function front(w) {
    Object.keys(wins).forEach(function (k) { wins[k].task.classList.remove('front'); });
    if (!w) return;
    if (zTop > 1500) { // renumber so normal windows stay under the corners and menus
      Object.keys(wins).map(function (k) { return wins[k]; })
        .sort(function (a, b) { return a.z - b.z; })
        .forEach(function (x, i) { x.z = 1100 + i; applyZ(x); });
      zTop = 1100 + Object.keys(wins).length;
    }
    w.z = ++zTop;
    applyZ(w);
    w.task.classList.add('front');
  }
  function isFront(w) {
    return w.task.classList.contains('front') && !w.el.classList.contains('min');
  }
  function minimise(w) { w.el.classList.add('min'); w.task.classList.add('min'); w.task.classList.remove('front'); }
  function restore(w) { w.el.classList.remove('min'); w.task.classList.remove('min'); front(w); }
  function close(w) {
    w.el.remove(); w.task.remove();
    delete wins[w.id];
  }
  function toggleMax(w, deviceFullscreen) {
    // phones: windows are always full size, so ⛶ switches device fullscreen on/off
    if (PHONE() && deviceFullscreen && window.rvView) {
      var fs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      var cur = rvView.current();
      rvView.set(fs ? 'normal' : (cur && cur !== 'normal' ? cur : 'panoramic'));
      return;
    }
    var on = !w.el.classList.contains('max');
    w.el.classList.toggle('max', on);
    applyZ(w);
    if (on && deviceFullscreen && window.rvView) {
      var m = rvView.current();
      rvView.set(m && m !== 'normal' ? m : 'panoramic');
    }
  }

  function open(id) {
    var app = APPS[id];
    if (!app) return;
    if (app.tab) { realTab(app.src); return; }
    if (wins[id]) { restore(wins[id]); return; }

    var vw = window.innerWidth, vh = window.innerHeight - 46;
    var w = Math.min(app.w || 800, vw - 40), h = Math.min(app.h || 600, vh - 40);
    var x = Math.max(10, Math.round((vw - w) / 2) + (cascade % 5) * 26 - 52);
    var y = Math.max(10, Math.round((vh - h) / 2) + (cascade % 5) * 26 - 52);
    cascade++;

    var win = el('div', 'rvd-win');
    win.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px';
    var bar = el('div', 'rvd-bar');
    var title = el('span', 'rvd-title', app.icon + ' ' + app.title);
    var bOut = el('button', '', '↗'); bOut.title = 'Open in a real tab';
    var bMin = el('button', '', '_'); bMin.title = 'Minimise to the taskbar';
    var bMax = el('button', '', '⛶'); bMax.title = 'Full screen';
    var bX = el('button', 'rvd-x', '✕'); bX.title = 'Close';
    [bOut, bMin, bMax, bX].forEach(function (b) { b.type = 'button'; });
    bar.appendChild(title); bar.appendChild(bOut); bar.appendChild(bMin); bar.appendChild(bMax); bar.appendChild(bX);
    var fr = document.createElement('iframe');
    fr.allow = 'fullscreen; autoplay; clipboard-read; clipboard-write; geolocation; camera; microphone; ' +
      'accelerometer; gyroscope; screen-wake-lock; web-share';
    fr.setAttribute('allowfullscreen', '');
    fr.src = url(app.src);
    var grip = el('div', 'rvd-grip');
    win.appendChild(bar); win.appendChild(fr); win.appendChild(grip);
    document.body.appendChild(win);

    var task = el('button', 'rvd-task', app.icon + ' ' + app.title);
    task.type = 'button';
    tasksEl.appendChild(task);

    var rec = { id: id, el: win, frame: fr, task: task };
    wins[id] = rec;

    bOut.addEventListener('click', function () {
      var href = fr.src;
      try { href = fr.contentWindow.location.href; } catch (e) {}
      realTab(href); close(rec);
    });
    bMin.addEventListener('click', function () { minimise(rec); });
    bMax.addEventListener('click', function () { toggleMax(rec, true); });
    bX.addEventListener('click', function () { close(rec); });
    bar.addEventListener('dblclick', function (e) { if (e.target === bar || e.target === title) toggleMax(rec, false); });
    task.addEventListener('click', function () {
      if (win.classList.contains('min')) restore(rec);
      else if (isFront(rec)) minimise(rec);
      else front(rec);
    });
    win.addEventListener('pointerdown', function () { front(rec); });
    drag(bar, win, 'move');
    drag(grip, win, 'resize');

    if (PHONE()) win.classList.add('max');
    front(rec);
    return rec;
  }

  function drag(handle, win, kind) {
    handle.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.tagName === 'BUTTON' || win.classList.contains('max')) return;
      e.preventDefault();
      var sx = e.clientX, sy = e.clientY, r = win.getBoundingClientRect();
      document.body.classList.add('rvd-dragging');
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
      function move(ev) {
        var dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (kind === 'move') {
          var nx = Math.min(Math.max(r.left + dx, 40 - r.width), window.innerWidth - 60);
          var ny = Math.min(Math.max(r.top + dy, 0), window.innerHeight - 46 - 34);
          win.style.left = nx + 'px'; win.style.top = ny + 'px';
        } else {
          win.style.width = Math.max(260, r.width + dx) + 'px';
          win.style.height = Math.max(160, r.height + dy) + 'px';
        }
      }
      function up() {
        document.body.classList.remove('rvd-dragging');
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
      }
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
    });
  }

  // a click inside a window's iframe doesn't reach this page, but it does blur it
  window.addEventListener('blur', function () {
    setTimeout(function () {
      var a = document.activeElement;
      Object.keys(wins).forEach(function (k) { if (wins[k].frame === a) front(wins[k]); });
    }, 0);
  });

  /* ── notch menu (top-left) ── */
  function buildNotch() {
    var notch = el('div', '', 'RUDVENTUR');
    notch.id = 'rvd-notch';
    notch.title = 'RUDVENTUR menu';
    var menu = el('div');
    menu.id = 'rvd-menu';
    MENU.forEach(function (grp) {
      var g = el('button', 'rvd-mi rvd-grp', grp[0]);
      g.type = 'button';
      var sub = el('div', 'rvd-sub');
      grp[1].forEach(function (id) {
        var a = APPS[id];
        var b = el('button', 'rvd-mi', a.icon + ' ' + a.title + (a.tab ? ' ↗' : ''));
        b.type = 'button';
        b.addEventListener('click', function () { closeNotch(); open(id); });
        sub.appendChild(b);
      });
      g.addEventListener('click', function () { g.classList.toggle('open'); sub.classList.toggle('open'); });
      menu.appendChild(g); menu.appendChild(sub);
    });
    // view modes, same as the logo menu
    var v = el('button', 'rvd-mi rvd-grp', '🖥️ VIEW');
    v.type = 'button';
    var vs = el('div', 'rvd-sub');
    [['horizontal', 'Full Screen Horizontal'], ['panoramic', 'Full Screen Panoramic'],
     ['vertical', 'Full Screen Vertical'], ['normal', 'Normal / Default Browser']].forEach(function (m) {
      var b = el('button', 'rvd-mi', m[1]);
      b.type = 'button';
      b.addEventListener('click', function () { closeNotch(); if (window.rvView) rvView.set(m[0]); });
      vs.appendChild(b);
    });
    v.addEventListener('click', function () { v.classList.toggle('open'); vs.classList.toggle('open'); });
    menu.appendChild(v); menu.appendChild(vs);
    menu.appendChild(el('div', 'rvd-sep'));
    var buy = el('button', 'rvd-mi rvd-gold', '⚡ Buy Pumpkin Electricity! 🎃');
    buy.type = 'button';
    buy.addEventListener('click', function () { closeNotch(); open('kofi'); });
    var kofi = el('button', 'rvd-mi rvd-gold', '☕ Ko-fi ↗');
    kofi.type = 'button';
    kofi.addEventListener('click', function () { closeNotch(); open('kofi'); });
    menu.appendChild(buy); menu.appendChild(kofi);

    notch.addEventListener('click', function (e) { e.stopPropagation(); menu.classList.toggle('open'); });
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && e.target !== notch && e.target.id !== 'rvd-start') closeNotch();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNotch(); });
    document.body.appendChild(notch);
    document.body.appendChild(menu);
    function closeNotch() { menu.classList.remove('open'); }
    return function () { menu.classList.toggle('open'); };
  }

  function cornerBtn(parent, id) {
    var a = APPS[id];
    var b = el('button', 'rvd-cbtn', a.icon);
    b.type = 'button';
    b.title = a.title;
    b.addEventListener('click', function () {
      var w = wins[id];
      if (w && isFront(w)) minimise(w); else open(id);
    });
    parent.appendChild(b);
  }

  function init() {
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);

    var toggleNotch = buildNotch();

    var bl = el('div', 'rvd-corner'); bl.id = 'rvd-bl';
    cornerBtn(bl, 'keyboard'); cornerBtn(bl, 'chat');
    var br = el('div', 'rvd-corner'); br.id = 'rvd-br';
    cornerBtn(br, 'popcorn');

    var bar = el('div'); bar.id = 'rvd-taskbar';
    var start = el('button', '', '🎃 RUDVENTUR'); start.id = 'rvd-start'; start.type = 'button';
    start.title = 'RUDVENTUR menu';
    start.addEventListener('click', function (e) { e.stopPropagation(); toggleNotch(); });
    tasksEl = el('div'); tasksEl.id = 'rvd-tasks';
    var clock = el('div'); clock.id = 'rvd-clock';
    function tick() {
      var d = new Date();
      clock.textContent = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }
    tick(); setInterval(tick, 10000);
    bar.appendChild(start); bar.appendChild(tasksEl); bar.appendChild(clock);

    document.body.appendChild(bl); document.body.appendChild(br); document.body.appendChild(bar);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.rvDesk = { open: open, apps: APPS };
})();
