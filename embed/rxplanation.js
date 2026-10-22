/* RUDVENTUR rxplanation: right-click (or long-press on a phone) any button to see what it does.
   One shared file, loaded by the shared useRbox (embed/useRbox.js) on every RUDVENTUR page.
   The text comes from the button's data-explain attribute, then its title or aria-label.
   Only buttons are explained: links and text boxes keep the normal browser right-click menu.
   API: window.rvExplain.show(element) */
(function () {
  'use strict';
  if (window.rvExplain) return;

  var BUTTONS = 'button,[role="button"],input[type="button"],input[type="submit"],input[type="reset"],[data-explain]';
  var CSS = '#rv-explain{position:fixed;z-index:2147483646;max-width:300px;min-width:180px;background:#0e0e10;color:#ddd;' +
    'border:1px solid #7CFF4A;border-radius:9px;padding:.55rem .7rem .6rem;box-shadow:0 12px 40px rgba(0,0,0,.7);' +
    'font:12px/1.45 ui-monospace,"DM Mono",monospace;display:none}' +
    '#rv-explain.open{display:block}' +
    '#rv-explain .rv-ex-t{color:#7CFF4A;font-weight:700;margin-bottom:.25rem;padding-right:1.4rem}' +
    '#rv-explain .rv-ex-x{position:absolute;top:.3rem;right:.4rem;background:none;border:0;color:#888;font-size:14px;cursor:pointer}';

  var box, timer = null, pressEl = null, swallowClick = false;

  function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  function nameOf(el) {
    return clean(el.getAttribute('aria-label') || el.innerText || el.value || el.getAttribute('title') || 'Button').slice(0, 60);
  }
  function textOf(el) {
    var t = el.getAttribute('data-explain') || el.getAttribute('data-rxplanation') || el.getAttribute('title') || el.getAttribute('aria-label');
    t = clean(t);
    if (t && t !== nameOf(el)) return t;
    return (t || nameOf(el)) + ' — runs this action on the page.';
  }
  function find(target) {
    var el = target && target.closest ? target.closest(BUTTONS + ',[onclick]') : null;
    if (!el || (box && box.contains(el))) return null;
    var tag = el.tagName;
    if (tag === 'A' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) return null;
    if (tag === 'INPUT' && !/^(button|submit|reset)$/i.test(el.type)) return null;
    return el;
  }
  function build() {
    if (box) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    box = document.createElement('div'); box.id = 'rv-explain'; box.setAttribute('role', 'tooltip');
    box.innerHTML = '<button type="button" class="rv-ex-x" aria-label="Close the explanation">✕</button><div class="rv-ex-t"></div><div class="rv-ex-b"></div>';
    box.querySelector('.rv-ex-x').addEventListener('click', hide);
    document.body.appendChild(box);
  }
  function show(el, x, y) {
    build();
    box.querySelector('.rv-ex-t').textContent = nameOf(el);
    box.querySelector('.rv-ex-b').textContent = textOf(el);
    box.classList.add('open');
    if (x == null) { var r = el.getBoundingClientRect(); x = r.left; y = r.bottom + 6; }
    var w = box.offsetWidth, h = box.offsetHeight;
    box.style.left = Math.max(6, Math.min(x, innerWidth - w - 6)) + 'px';
    box.style.top = Math.max(6, Math.min(y, innerHeight - h - 6)) + 'px';
  }
  function hide() { if (box) box.classList.remove('open'); }

  document.addEventListener('contextmenu', function (e) {
    var el = find(e.target);
    if (!el) return;            // links, text boxes and plain text: the normal menu
    e.preventDefault();
    show(el, e.clientX, e.clientY);
  }, true);

  // long-press on phones and tablets
  document.addEventListener('touchstart', function (e) {
    var el = find(e.target); if (!el || e.touches.length !== 1) return;
    var t = e.touches[0], x = t.clientX, y = t.clientY;
    pressEl = el; clearTimeout(timer);
    timer = setTimeout(function () { swallowClick = true; show(el, x, y); }, 550);
  }, { passive: true, capture: true });
  ['touchend', 'touchmove', 'touchcancel'].forEach(function (n) {
    document.addEventListener(n, function () { clearTimeout(timer); }, { passive: true, capture: true });
  });
  document.addEventListener('click', function (e) {
    if (swallowClick) { swallowClick = false; if (pressEl && pressEl.contains(e.target)) { e.preventDefault(); e.stopPropagation(); return; } }
    if (box && !box.contains(e.target)) hide();
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
  window.addEventListener('scroll', hide, true);

  window.rvExplain = { show: function (el) { show(el); }, hide: hide, text: textOf };
})();
