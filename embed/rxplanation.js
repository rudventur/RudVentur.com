/* RudVentur rxplanation — right-click any button/link for a short explanation. */
(function () {
  if (window.__rvRxplanation) return;
  window.__rvRxplanation = true;

  var CSS = '' +
    '#rxplanation-menu{position:fixed;z-index:2147483000;min-width:240px;max-width:320px;' +
    'background:#0e0e10;border:1px solid #3a3a3a;border-radius:10px;padding:.55rem .6rem .65rem;' +
    'box-shadow:0 16px 48px rgba(0,0,0,.75);color:#eee;font-family:"DM Mono",ui-monospace,monospace;' +
    'display:none;pointer-events:auto}' +
    '#rxplanation-menu.open{display:block}' +
    '#rxplanation-menu .rx-kicker{font-size:.55rem;letter-spacing:2px;color:#7CFF4A;text-transform:uppercase;margin-bottom:.25rem}' +
    '#rxplanation-menu .rx-title{font-size:.82rem;font-weight:700;margin-bottom:.35rem;color:#fff}' +
    '#rxplanation-menu .rx-body{font-size:.68rem;line-height:1.45;color:#bbb;margin-bottom:.55rem}' +
    '#rxplanation-menu .rx-href{font-size:.55rem;color:#6aa;word-break:break-all;margin-bottom:.5rem}' +
    '#rxplanation-menu button{display:block;width:100%;text-align:left;background:rgba(255,255,255,.04);' +
    'border:1px solid #2a2a2a;color:#ddd;font:inherit;font-size:.65rem;letter-spacing:.4px;' +
    'padding:.45rem .55rem;border-radius:6px;cursor:pointer;margin-top:.28rem}' +
    '#rxplanation-menu button:hover{background:rgba(124,255,74,.12);border-color:#7CFF4A;color:#fff}' +
    'button,a,[role="button"],.tool-link,.chem-btn,.user-btn{position:relative}' +
    '.soon{opacity:.55;cursor:default}';

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var menu = document.createElement('div');
  menu.id = 'rxplanation-menu';
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-label', 'rxplanation');
  document.documentElement.appendChild(menu);

  function textOf(el) {
    return (el.getAttribute('data-rxplanation') ||
            el.getAttribute('aria-label') ||
            el.getAttribute('title') ||
            (el.innerText || '').replace(/\s+/g, ' ').trim() ||
            el.getAttribute('href') ||
            'This control');
  }

  function explain(el) {
    var label = (el.innerText || el.getAttribute('aria-label') || 'control').replace(/\s+/g, ' ').trim();
    var custom = el.getAttribute('data-rxplanation');
    if (custom) return custom;
    var href = el.getAttribute('href') || '';
    if (el.classList.contains('soon') || href === '' && el.tagName === 'A' && !el.onclick) {
      return label + ' is marked coming soon — it is visible so you can see what is next, but it does not navigate yet.';
    }
    if (href) {
      return label + ' opens ' + href + (el.target === '_blank' ? ' in a new tab.' : '.');
    }
    if (el.getAttribute('onclick') || el.onclick) {
      return label + ' runs an on-page action. Left-click to use it.';
    }
    return label + ' is a control on this page. Left-click to use it.';
  }

  var current = null;

  function hide() {
    menu.classList.remove('open');
    current = null;
  }

  function show(el, x, y) {
    current = el;
    var href = el.href || el.getAttribute('href') || '';
    menu.innerHTML =
      '<div class="rx-kicker">rxplanation</div>' +
      '<div class="rx-title"></div>' +
      '<div class="rx-body"></div>' +
      (href ? '<div class="rx-href"></div>' : '') +
      (href ? '<button type="button" data-act="open">Open link</button>' : '<button type="button" data-act="click">Activate</button>') +
      (href ? '<button type="button" data-act="copy">Copy address</button>' : '') +
      '<button type="button" data-act="close">Close</button>';
    menu.querySelector('.rx-title').textContent = textOf(el).slice(0, 80);
    menu.querySelector('.rx-body').textContent = explain(el);
    if (href) menu.querySelector('.rx-href').textContent = href;
    menu.classList.add('open');
    var w = menu.offsetWidth, h = menu.offsetHeight;
    var left = Math.min(x, window.innerWidth - w - 8);
    var top = Math.min(y, window.innerHeight - h - 8);
    if (left < 8) left = 8;
    if (top < 8) top = 8;
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  }

  function isControl(el) {
    if (!el || el === document.documentElement || el === document.body) return false;
    if (el.closest && el.closest('#rxplanation-menu')) return false;
    var tag = el.tagName;
    if (tag === 'BUTTON' || tag === 'A' || el.getAttribute('role') === 'button' || el.getAttribute('role') === 'menuitem') return true;
    if (el.classList && (el.classList.contains('tool-link') || el.classList.contains('chem-btn') || el.classList.contains('user-btn') || el.classList.contains('repo-card'))) return true;
    return false;
  }

  document.addEventListener('contextmenu', function (e) {
    var el = e.target;
    while (el && !isControl(el)) el = el.parentElement;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    show(el, e.clientX, e.clientY);
  }, true);

  menu.addEventListener('click', function (e) {
    var act = e.target.getAttribute('data-act');
    if (!act) return;
    if (act === 'close') { hide(); return; }
    if (!current) return;
    if (act === 'open' && current.href) {
      window.open(current.href, current.target || '_blank');
    } else if (act === 'click') {
      current.click();
    } else if (act === 'copy' && current.href) {
      if (navigator.clipboard) navigator.clipboard.writeText(current.href).catch(function () {});
    }
    hide();
  });

  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target)) hide();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hide();
  });
  window.addEventListener('resize', hide);
  window.addEventListener('scroll', hide, true);

  function unstack() {
    var floats = [];
    document.querySelectorAll('button, a, [role="button"]').forEach(function (el) {
      var cs = window.getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') return;
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return;
      var r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      floats.push({ el: el, r: r });
    });
    floats.sort(function (a, b) { return a.r.left - b.r.left || a.r.top - b.r.top; });
    for (var i = 1; i < floats.length; i++) {
      var prev = floats[i - 1].r;
      var cur = floats[i];
      var overlapX = Math.min(prev.right, cur.r.right) - Math.max(prev.left, cur.r.left);
      var overlapY = Math.min(prev.bottom, cur.r.bottom) - Math.max(prev.top, cur.r.top);
      if (overlapX > 8 && overlapY > 8) {
        cur.el.style.marginLeft = (overlapX + 12) + 'px';
      }
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(unstack, 600); });
  } else {
    setTimeout(unstack, 600);
  }
})();
