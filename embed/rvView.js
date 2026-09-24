/* rvView.js — shared RUDVENTUR view mode (Full Screen Horizontal / Panoramic /
   Vertical / Normal), for every repo in the universe.

   Drop-in:  <script src="https://rudventur.com/embed/rvView.js" defer></script>

   What it does:
   1. Remembers the chosen mode in localStorage['rvViewMode'] (same key the
      translator, snout-first and map-merger-venti already use).
   2. On load, adopts ?view=<mode> from the URL (localStorage is per-origin, so
      the URL param is the only thing that crosses rudventur.com <->
      rudventur.github.io/*), and re-applies it on the first click/keypress —
      browsers only allow fullscreen from a real user gesture.
   3. Rewrites every <a target="_blank"> as it's clicked so the new tab opens
      with ?view=<mode> and lands in the same fullscreen/orientation.

   API (window.rvView):
     rvView.set(mode)   — save + apply ('horizontal'|'panoramic'|'vertical'|'normal')
     rvView.open(url)   — open url in a new tab carrying the current mode
     rvView.withView(url), rvView.current()
*/
(function () {
  if (window.rvView) return;
  var KEY = 'rvViewMode';
  var ALIASES = { 'panoramic-locked': 'horizontal', 'panoramic-default': 'panoramic' };
  var MODES = { horizontal: 1, panoramic: 1, vertical: 1, normal: 1 };

  function norm(mode) {
    mode = ALIASES[mode] || mode;
    return MODES[mode] ? mode : '';
  }
  function store(mode) { try { localStorage.setItem(KEY, mode); } catch (e) {} }
  function current() {
    try { return norm(localStorage.getItem(KEY) || ''); } catch (e) { return ''; }
  }

  function requestFS() {
    var el = document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement) return Promise.resolve();
    var fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    try { return Promise.resolve(fn ? fn.call(el) : null).catch(function () {}); }
    catch (e) { return Promise.resolve(); }
  }
  function exitFS() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) return Promise.resolve();
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
    return apply(mode);
  }

  function withView(url) {
    var mode = current();
    if (!mode || mode === 'normal') return url;
    try {
      var u = new URL(url, location.href);
      if (!/^https?:$/.test(u.protocol)) return url;
      u.searchParams.set('view', mode);
      return u.href;
    } catch (e) { return url; }
  }
  function open(url) { window.open(withView(url), '_blank', 'noopener'); }

  // 1. adopt ?view= (highest priority), else the last mode used on this origin
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

  // 2. fullscreen needs a user gesture — apply on the first one
  if (pending && pending !== 'normal') {
    var fire = function () {
      document.removeEventListener('pointerdown', fire, true);
      document.removeEventListener('keydown', fire, true);
      apply(pending);
    };
    document.addEventListener('pointerdown', fire, true);
    document.addEventListener('keydown', fire, true);
  }

  // only our own sites understand ?view= — leave Ko-fi, Tinkercad etc. alone
  function isOurs(host) {
    return host === location.hostname || /(^|\.)rudventur\.com$/.test(host) ||
      host === 'rudventur.github.io';
  }

  // 3. new-tab links carry the mode (rewritten at click time so it's always current)
  function decorate(e) {
    var a = e.target && e.target.closest && e.target.closest('a[target="_blank"][href]');
    if (!a || a.hasAttribute('data-rv-noview')) return;
    var raw = a.getAttribute('href');
    if (!raw || raw.charAt(0) === '#') return;
    if (!isOurs(a.hostname)) return;
    a.href = withView(raw.replace(/([?&])view=[^&#]*&?/, '$1').replace(/[?&]$/, ''));
  }
  document.addEventListener('click', decorate, true);
  document.addEventListener('auxclick', decorate, true);

  window.rvView = { set: set, apply: apply, open: open, withView: withView, current: current, KEY: KEY };
})();
