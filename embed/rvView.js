/* rvView.js — shared RUDVENTUR view mode (Full Screen Horizontal / Panoramic /
   Vertical / Normal) for every page in every repo of the universe.

   Drop-in (one line, any repo):
     <script src="https://rudventur.github.io/RudVentur.com/embed/rvView.js"></script>

   What it does:
   1. Remembers the chosen mode in localStorage['rvViewMode'] (same key the
      translator, snout-first and map-merger-venti already use). All repos are
      served from rudventur.github.io, so they share that storage.
   2. Adopts ?view=<mode> from the URL (the only thing that crosses from other
      origins, e.g. rudventur.com), and goes fullscreen on the first tap / click /
      key — browsers never allow fullscreen without a real user gesture.
   3. Adds ?view=<mode> to every new-tab link to a RUDVENTUR site as it's clicked.
   4. Logo menu: clicking the page's logo opens the same view menu as the hub.
      The logo is the element marked data-rv-logo, else the first <h1>, else .logo. Pages
      that already have their own menu (window.setView) are left alone; add
      data-rv-nologo to <html> to opt a page out.

   5. Fullscreen layer: while a fullscreen mode is on (or when RUDVENTUR runs as
      an installed app), links that would open a new tab — <a target="_blank">
      and plain window.open(url) — open in a full-screen layer on top of the
      current page instead, so they stay fullscreen with no extra tap
      (browsers never let a brand-new tab start fullscreen). ✕ or the phone's
      back button closes it, ↗ opens it in a real tab. data-rv-nolayer on a
      link opts it out. Pages loaded inside the layer hand their own new-tab
      links and view changes up to the top page.
   6. Install: "📲 Install RUDVENTUR app" in the logo menu (each repo ships a
      manifest.webmanifest with display: fullscreen), so the installed app
      opens fullscreen straight away.

   API (window.rvView):
     rvView.set(mode)   — save + apply ('horizontal'|'panoramic'|'vertical'|'normal')
     rvView.open(url)   — open url in a new tab carrying the current mode
     rvView.openLayer(url), rvView.closeLayer(), rvView.install()
     rvView.withView(url), rvView.current(), rvView.apply(mode)
*/
(function () {
  if (window.rvView) return;
  var KEY = 'rvViewMode';
  var ALIASES = { 'panoramic-locked': 'horizontal', 'panoramic-default': 'panoramic' };
  var MODES = { horizontal: 1, panoramic: 1, vertical: 1, normal: 1 };

  // inside a RUDVENTUR fullscreen layer, the top page owns fullscreen + layers
  var IN_FRAME = window.top !== window;
  var topRv = null;
  if (IN_FRAME) { try { topRv = window.top.rvView || null; } catch (e) {} }

  function norm(mode) {
    mode = ALIASES[mode] || mode;
    return MODES[mode] ? mode : '';
  }
  function store(mode) { try { localStorage.setItem(KEY, mode); } catch (e) {} }
  function current() {
    try { return norm(localStorage.getItem(KEY) || ''); } catch (e) { return ''; }
  }
  function isFS() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }

  function requestFS() {
    if (isFS()) return Promise.resolve();
    var el = document.documentElement;
    var fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    try { return Promise.resolve(fn ? fn.call(el) : null).catch(function () {}); }
    catch (e) { return Promise.resolve(); }
  }
  function exitFS() {
    if (!isFS()) return Promise.resolve();
    var fn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    try { return Promise.resolve(fn ? fn.call(document) : null).catch(function () {}); }
    catch (e) { return Promise.resolve(); }
  }
  function lock(type) {
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock(type).catch(function () {}); } catch (e) {}
  }
  function unlock() {
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
  }

  function apply(mode) {
    if (topRv) return topRv.apply(mode);
    switch (norm(mode)) {
      case 'horizontal': return requestFS().then(function () { lock('landscape'); });
      case 'panoramic':  return requestFS().then(unlock);
      case 'vertical':   return requestFS().then(function () { lock('portrait'); });
      case 'normal':     unlock(); return exitFS();
    }
    return Promise.resolve();
  }
  function set(mode) {
    mode = norm(mode);
    if (!mode) return Promise.resolve();
    store(mode);
    if (topRv) return topRv.set(mode);
    return apply(mode);
  }

  // only our own sites understand ?view= — leave Ko-fi, Tinkercad etc. alone
  function isOurs(host) {
    return host === location.hostname || host === 'rudventur.github.io' ||
      /(^|\.)rudventur\.com$/.test(host);
  }
  function withView(url) {
    var mode = current();
    if (!mode || mode === 'normal') return url;
    try {
      var u = new URL(url, location.href);
      if (!/^https?:$/.test(u.protocol) || !isOurs(u.hostname)) return url;
      u.searchParams.set('view', mode);
      return u.href;
    } catch (e) { return url; }
  }
  function open(url) { window.open(withView(url), '_blank', 'noopener'); }

  // 1. adopt ?view= (highest priority), else the last mode used
  var pending = '';
  try {
    var params = new URLSearchParams(location.search);
    var urlMode = norm(params.get('view') || '');
    if (params.has('view')) {
      params.delete('view');
      var qs = params.toString();
      history.replaceState(history.state, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    }
    if (urlMode) store(urlMode);
    pending = urlMode || current();
  } catch (e) {}

  // 2. go fullscreen on the first gesture. On phones a touch only counts as a
  //    gesture on release, so listen to click/pointerup/keydown (not pointerdown),
  //    and keep trying until fullscreen actually sticks once.
  if (pending && pending !== 'normal' && !IN_FRAME) {
    var EVENTS = ['click', 'pointerup', 'keydown'];
    var done = false;
    var fire = function (e) {
      if (done || (e.type === 'keydown' && e.key === 'Escape')) return;
      if (isFS()) { stop(); return; }
      apply(pending).then(function () { if (isFS()) stop(); });
    };
    var stop = function () {
      done = true;
      EVENTS.forEach(function (t) { document.removeEventListener(t, fire, true); });
    };
    EVENTS.forEach(function (t) { document.addEventListener(t, fire, true); });
  }

  // 3. new-tab links carry the mode (rewritten at click time so it's always current)
  function decorate(e) {
    var a = e.target && e.target.closest && e.target.closest('a[target="_blank"][href]');
    if (!a || a.hasAttribute('data-rv-noview')) return;
    var raw = a.getAttribute('href');
    if (!raw || raw.charAt(0) === '#' || !isOurs(a.hostname)) return;
    a.href = withView(raw.replace(/([?&])view=[^&#]*&?/, '$1').replace(/[?&](#|$)/, '$1'));
  }
  document.addEventListener('click', decorate, true);
  document.addEventListener('auxclick', decorate, true);

  // 5. fullscreen layer — new-tab links open on top of this (already fullscreen)
  //    page, because a new tab can never start fullscreen by itself
  function installed() {
    try {
      return matchMedia('(display-mode: fullscreen)').matches ||
        matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    } catch (e) { return false; }
  }
  function useLayer() {
    if (topRv) return true;
    var m = current();
    return installed() || (!!m && m !== 'normal');
  }
  var nativeOpen = window.open;
  var layers = [], ignorePop = 0, layerCss = false;
  var LAYER_CSS =
    '.rv-layer{position:fixed;inset:0;z-index:2147483645;background:#000}' +
    '.rv-layer iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}' +
    '.rv-layer-bar{position:absolute;left:0;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;' +
    'gap:2px;z-index:1;padding:4px 2px;background:#000;border:1px solid #00ff41;border-left:0;' +
    'border-radius:0 10px 10px 0;box-shadow:0 0 10px rgba(0,255,65,.35);opacity:.85;transition:opacity .2s}' +
    '.rv-layer-bar:hover,.rv-layer-bar:focus-within{opacity:1}' +
    '.rv-layer-bar button{width:28px;height:30px;border:0;background:none;color:#00ff41;' +
    'font:15px/1 ui-monospace,monospace;cursor:pointer;padding:0}' +
    '.rv-layer-hint{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);max-width:90%;' +
    'background:rgba(0,0,0,.85);border:1px solid #333;color:#ccc;font:12px ui-monospace,monospace;' +
    'padding:8px 12px;border-radius:6px;pointer-events:none;transition:opacity .6s}';
  function openLayer(url) {
    if (topRv) return topRv.openLayer(url);
    var abs;
    try { abs = new URL(url, location.href).href; } catch (e) { return; }
    if (!layerCss) {
      var st = document.createElement('style');
      st.textContent = LAYER_CSS;
      document.head.appendChild(st);
      layerCss = true;
    }
    var wrap = document.createElement('div');
    wrap.className = 'rv-layer';
    var fr = document.createElement('iframe');
    fr.allow = 'fullscreen; autoplay; clipboard-read; clipboard-write; geolocation; camera; ' +
      'microphone; accelerometer; gyroscope; screen-wake-lock; web-share';
    fr.setAttribute('allowfullscreen', '');
    fr.src = abs;
    var bar = document.createElement('div');
    bar.className = 'rv-layer-bar';
    var out = document.createElement('button');
    out.type = 'button'; out.title = 'Open in a new tab'; out.textContent = '\u2197';
    out.addEventListener('click', function () {
      var href = abs;
      try { href = fr.contentWindow.location.href; } catch (e) {}
      nativeOpen.call(window, href, '_blank', 'noopener');
      closeLayer();
    });
    var x = document.createElement('button');
    x.type = 'button'; x.title = 'Close'; x.textContent = '\u2715';
    x.addEventListener('click', function () { closeLayer(); });
    bar.appendChild(out); bar.appendChild(x);
    wrap.appendChild(fr); wrap.appendChild(bar);
    if (!isOurs(new URL(abs).hostname)) {
      // some outside sites refuse to be shown inside another page
      var hint = document.createElement('div');
      hint.className = 'rv-layer-hint';
      hint.textContent = 'Blank? This site blocks being opened inside RUDVENTUR \u2014 tap \u2197';
      wrap.appendChild(hint);
      setTimeout(function () { hint.style.opacity = '0'; }, 6000);
    }
    document.body.appendChild(wrap);
    layers.push(wrap);
    document.documentElement.style.overflow = 'hidden';
    try { history.pushState({ rvLayer: layers.length }, ''); } catch (e) {}
    return fr;
  }
  function closeLayer(fromPop) {
    if (topRv) return topRv.closeLayer();
    var w = layers.pop();
    if (!w) return;
    w.parentNode.removeChild(w);
    if (!layers.length) document.documentElement.style.overflow = '';
    if (!fromPop) { ignorePop++; try { history.back(); } catch (e) { ignorePop--; } }
  }
  window.addEventListener('popstate', function () {
    if (ignorePop) { ignorePop--; return; }
    if (layers.length) closeLayer(true);
  });
  // pages with their own view menu (translator, snout-first, the map) only save
  // the mode themselves; inside a layer, pass it to the top page in the same tap
  if (topRv) {
    try {
      var ls = window.localStorage, lsSet = ls.setItem;
      ls.setItem = function (k, v) {
        lsSet.call(ls, k, v);
        if (k === KEY) topRv.apply(v);
      };
    } catch (e) {}
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && layers.length && !isFS()) closeLayer();
  });
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest && e.target.closest('a[target="_blank"][href]');
    if (!a || a.hasAttribute('data-rv-nolayer') || a.hasAttribute('download')) return;
    if (!/^https?:$/.test(a.protocol) || !useLayer()) return;
    e.preventDefault();
    openLayer(a.href);
  });
  // plain window.open(url) / window.open(url, '_blank', 'noopener') -> layer;
  // sized popups (width=… etc.) and named targets keep the browser behaviour
  window.open = function (url, target, features) {
    var f = String(features || '').toLowerCase().replace(/noopener|noreferrer|[\s,]/g, '');
    var t = target == null ? '_blank' : String(target);
    if (url && !f && (t === '_blank' || t === '') && useLayer()) {
      try {
        var u = new URL(String(url), location.href);
        if (/^https?:$/.test(u.protocol)) { openLayer(withView(u.href)); return null; }
      } catch (e) {}
    }
    return nativeOpen.apply(window, arguments);
  };

  // 6. install as an app (manifest.webmanifest with display: fullscreen)
  var installEvt = null;
  var IOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '');
  function canInstall() { return !installed() && !IN_FRAME && (!!installEvt || IOS); }
  function syncInstall() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-rv-install]'), function (el) {
      el.style.display = canInstall() ? '' : 'none';
    });
  }
  window.addEventListener('beforeinstallprompt', function (e) { installEvt = e; syncInstall(); });
  window.addEventListener('appinstalled', function () { installEvt = null; syncInstall(); });
  function install() {
    if (installEvt) {
      var ev = installEvt;
      installEvt = null;
      ev.prompt();
      syncInstall();
      return;
    }
    if (IOS) alert('To install RUDVENTUR: tap the Share button, then "Add to Home Screen". ' +
      'It then opens without the browser bars.');
  }

  // 4. logo menu — same options as the hub's RUDVENTUR logo
  var CSS =
    '.rv-menu{position:fixed;z-index:2147483646;min-width:250px;background:#0e0e10;border:1px solid #333;' +
    'border-radius:8px;padding:.4rem;box-shadow:0 12px 40px rgba(0,0,0,.7);display:none;' +
    "font-family:'DM Mono',ui-monospace,monospace;text-align:left}" +
    '.rv-menu.open{display:block}' +
    '.rv-menu button{display:block;width:100%;text-align:left;background:none;border:none;color:#ccc;' +
    'font-family:inherit;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding:10px 11px;' +
    'cursor:pointer;border-radius:4px;margin:0}' +
    '.rv-menu button:hover{background:rgba(255,255,255,.06);color:#fff}' +
    '.rv-menu .rv-sep{border-top:1px solid #222;margin:5px 3px}' +
    '.rv-menu .rv-set{display:flex;justify-content:space-between}' +
    ".rv-menu .rv-set::after{content:'\\25B8';font-size:10px;color:#666;transition:transform .2s}" +
    '.rv-menu .rv-set.open::after{transform:rotate(90deg)}' +
    '.rv-sub{display:none;padding-left:10px;margin:0 3px;border-left:1px solid #222}' +
    '.rv-sub.open{display:block}.rv-sub button{font-size:11px;color:#999}' +
    '[data-rv-logo-on]{cursor:pointer}';
  var ITEMS = [
    ['horizontal', 'Full Screen Horizontal'], ['panoramic', 'Full Screen Panoramic'],
    ['normal', 'Normal / Default Browser']
  ];
  var SUB = [
    ['horizontal', '↳ Panoramic — Locked'], ['panoramic', '↳ Panoramic — Default Rotation'],
    ['vertical', '↳ Full Screen Vertical']
  ];
  var menu, sub, subBtn, goBtn, goHref = '';

  function btn(parent, label, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.setAttribute('role', 'menuitem');
    b.addEventListener('click', onClick);
    parent.appendChild(b);
    return b;
  }
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('open'); sub.classList.remove('open'); subBtn.classList.remove('open');
  }
  function pick(mode) { return function (e) { e.stopPropagation(); closeMenu(); set(mode); }; }
  function buildMenu() {
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    menu = document.createElement('div');
    menu.className = 'rv-menu';
    menu.setAttribute('role', 'menu');
    // a logo that is also a link keeps its link as the first menu item
    goBtn = btn(menu, '', function (e) { e.stopPropagation(); closeMenu(); location.href = goHref; });
    ITEMS.forEach(function (it) { btn(menu, it[1], pick(it[0])); });
    menu.appendChild(Object.assign(document.createElement('div'), { className: 'rv-sep' }));
    subBtn = btn(menu, 'Settings One', function (e) {
      e.stopPropagation(); sub.classList.toggle('open'); subBtn.classList.toggle('open');
    });
    subBtn.className = 'rv-set';
    sub = document.createElement('div');
    sub.className = 'rv-sub';
    SUB.forEach(function (it) { btn(sub, it[1], pick(it[0])); });
    menu.appendChild(sub);
    var isep = Object.assign(document.createElement('div'), { className: 'rv-sep' });
    isep.setAttribute('data-rv-install', '');
    menu.appendChild(isep);
    var ib = btn(menu, '\uD83D\uDCF2 Install RUDVENTUR app', function (e) { e.stopPropagation(); closeMenu(); install(); });
    ib.setAttribute('data-rv-install', '');
    document.body.appendChild(menu);
    syncInstall();
    document.addEventListener('click', function (e) { if (!menu.contains(e.target)) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }
  function toggleMenu(e) {
    e.preventDefault(); e.stopPropagation();
    if (menu.classList.contains('open')) { closeMenu(); return; }
    var link = e.currentTarget.closest('a[href]');
    goHref = link ? link.href : '';
    goBtn.style.display = goHref ? '' : 'none';
    goBtn.textContent = '\u21A9 ' + (link ? (link.textContent || '').trim().slice(0, 30) || 'Open' : '');
    var r = e.currentTarget.getBoundingClientRect();
    syncInstall();
    menu.classList.add('open');
    var w = menu.offsetWidth, h = menu.offsetHeight;
    var top = r.bottom + 8;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 8);
    menu.style.top = top + 'px';
    menu.style.left = Math.min(Math.max(r.left + r.width / 2 - w / 2, 8), window.innerWidth - w - 8) + 'px';
  }
  function initLogo() {
    if (document.documentElement.hasAttribute('data-rv-nologo')) return;
    var logos = Array.prototype.filter.call(document.querySelectorAll('[data-rv-logo]'),
      function (el) { return !el.hasAttribute('onclick'); });
    if (!logos.length) {
      if (typeof window.setView === 'function') return; // page has its own view menu
      var el = document.querySelector('h1') || document.querySelector('.logo');
      if (!el || el.hasAttribute('onclick') || el.closest('a')) return;
      logos = [el];
    }
    buildMenu();
    logos.forEach(function (el) {
      el.setAttribute('data-rv-logo-on', '');
      if (!el.title) el.title = 'click for view options';
      el.addEventListener('click', toggleMenu);
    });
  }
  function init() { initLogo(); syncInstall(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.rvView = {
    set: set, apply: apply, open: open, withView: withView, current: current,
    openLayer: openLayer, closeLayer: closeLayer, install: install, canInstall: canInstall,
    installed: installed, KEY: KEY
  };
})();
