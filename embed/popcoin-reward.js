/* popcoin-reward.js — earn PopCOIN from any RUDVENTUR page.

     <script src="https://rudventur.github.io/RudVentur.com/embed/popcoin-reward.js" defer></script>
     ...
     PopCOINReward(pips, 'type-game');   // 100 pips = 1 PopCOIN

   Shows a "+0.42 PopCOIN 🍿" pop-up and queues the reward; the PopCOIN engine
   (loaded only when needed) pays it into the wallet as fast as the rules allow:
   up to 3 PopCOIN every 30 seconds and 50 a day. The queue is shared by every
   page on rudventur.github.io, so nothing is lost if you leave the page.
*/
(function () {
  'use strict';
  if (window.PopCOINReward) return;
  var script = document.currentScript;
  var BASE = script ? new URL('..', script.src).href : 'https://rudventur.github.io/RudVentur.com/';
  var WALLET = BASE + 'popcoin/';

  function load(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  var engine = null;
  function getEngine() {
    if (window.PopCOIN) return Promise.resolve(window.PopCOIN);
    if (!engine) {
      engine = load(BASE + 'popcoin/config.js')
        .then(function () { return load(BASE + 'embed/popcoin.js'); })
        .then(function () { return window.PopCOIN; });
    }
    return engine;
  }

  var box = null;
  function toast(text) {
    if (!box) {
      var st = document.createElement('style');
      st.textContent =
        '.pc-toast{position:fixed;left:50%;top:18px;transform:translate(-50%,-20px);z-index:2147483600;' +
        'background:#1a1405;color:#ffc83d;border:1px solid #ffc83d;border-radius:24px;padding:9px 16px;' +
        "font:700 14px ui-monospace,'Fira Code',monospace;box-shadow:0 0 18px rgba(255,200,61,.45);" +
        'opacity:0;transition:opacity .3s,transform .3s;pointer-events:auto;text-decoration:none;white-space:nowrap}' +
        '.pc-toast.on{opacity:1;transform:translate(-50%,0)}';
      document.head.appendChild(st);
      box = document.createElement('a');
      box.className = 'pc-toast';
      box.href = WALLET; box.target = '_blank'; box.rel = 'noopener';
      box.title = 'Open your PopCOIN Wallet';
      document.body.appendChild(box);
    }
    box.textContent = text;
    box.classList.add('on');
    clearTimeout(box._t);
    box._t = setTimeout(function () { box.classList.remove('on'); }, 3200);
  }

  window.PopCOINReward = function (pips, reason) {
    pips = Math.round(pips);
    if (!(pips > 0)) return;
    toast('+' + (pips / 100).toFixed(2) + ' PopCOIN 🍿' + (reason ? ' · ' + reason : ''));
    getEngine().then(function (P) { P.reward(pips, reason); }, function (e) {
      console.warn('PopCOIN engine unavailable, reward not queued', e);
    });
  };

  // rewards earned on an earlier visit still waiting? pay them out now
  try {
    var p = JSON.parse(localStorage.getItem('popcoin_pending_v1') || 'null');
    if (p && p.pips > 0) setTimeout(getEngine, 2500);
  } catch (e) {}
})();
