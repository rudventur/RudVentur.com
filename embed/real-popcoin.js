/* REAL popCoin + PRO for the useRbox (v1, honour system).
   Plain rules (Rud, Nov 2026):
   - Free useRbox = one open tile. PRO tiles start GREY and locked until you are PRO.
   - Buy PRO on Ko-fi: https://ko-fi.com/rudventur  (£10 a year or £1.30 a month).
   - v1: after paying on Ko-fi you tick "I paid". We save the payment time on this device.
     LATER: a Ko-fi webhook -> Firebase bridge can replace this honour tick (same entry shape).
   - REAL popCoin (capital R, real value): one tenth (10%) of what you paid.
     "TWO FOR DOUBLES": if the restaurant code matches another subscriber's restaurant
     code saved here, the rate is one fifth (20%) and the profile gets the fundraiser mark.
   - REAL popCoin is locked for 1 year (no payout before the anniversary; review end-2027).
     There is NO payout button. The casino NEVER uses REAL popCoin.
   - Every payment ALSO tops up FAKE popCornCoins (fun only, worthless) - see fakeBoost().
   Ledger math for one payment of P pounds (notes only, nothing is paid out here):
     ~30% tax, ~50% to Rud, 10% = your investment (REAL popCoin), the rest = running costs. */
(function (root) {
  'use strict';
  var KEY = 'rud_realPopCoin_v1', FAKE_KEY = 'rud_fakePopCoins_v1';
  var YEAR = 365 * 864e5, MONTH = 31 * 864e5;
  var PLANS = { year: { gbp: 10, ms: YEAR, label: '£10 a year' }, month: { gbp: 1.3, ms: MONTH, label: '£1.30 a month' } };
  var FAKE_PER_GBP = 100; // FAKE boost: 100 FAKE popCornCoins per £1 paid (rounded). Fun only.

  function ls() { try { return root.localStorage; } catch (e) { return null; } }
  function read() { var s = ls(), d = null; try { d = JSON.parse(s && s.getItem(KEY)); } catch (e) {} 
    if (!d || typeof d !== 'object') d = {}; d.entries = d.entries || []; d.codes = d.codes || []; return d; }
  function write(d) { var s = ls(); if (s) s.setItem(KEY, JSON.stringify(d)); }
  function norm(c) { return String(c || '').trim().toLowerCase(); }

  function split(gbp) { // where one payment goes (notes, not a payout)
    var r = function (x) { return Math.round(x * 100) / 100; };
    return { tax: r(gbp * 0.3), rud: r(gbp * 0.5), investment: r(gbp * 0.1), costs: r(gbp * 0.1) };
  }
  function rateFor(code, d) { var c = norm(code); return c && d.codes.indexOf(c) !== -1 ? 0.2 : 0.1; }
  function fakeBoost(gbp) { return Math.round(gbp * FAKE_PER_GBP); }

  function addFake(n, player) {
    if (root.rvUserbox && typeof root.rvUserbox.fakeAdd === 'function') return root.rvUserbox.fakeAdd(n);
    var s = ls(); if (!s) return; var all; try { all = JSON.parse(s.getItem(FAKE_KEY)); } catch (e) {}
    if (!all || !all.players) all = { players: {} }; var me = player || 'guest';
    var w = all.players[me] || (all.players[me] = { balance: 50, claimed: '', bought: [] });
    w.balance = Math.floor((+w.balance || 0) + n); s.setItem(FAKE_KEY, JSON.stringify(all)); return w.balance;
  }

  /* Record one payment. opts: { plan: 'year'|'month', restaurantCode, at (ms), source } */
  function recordPayment(opts) {
    opts = opts || {}; var plan = PLANS[opts.plan] ? opts.plan : 'year', gbp = PLANS[plan].gbp;
    var d = read(), at = +opts.at || Date.now(), code = norm(opts.restaurantCode), rate = rateFor(code, d);
    var e = { amount: Math.round(gbp * rate * 100) / 100, paidGbp: gbp, rate: rate, plan: plan, restaurantCode: code,
      at: at, unlockAt: at + YEAR, source: opts.source || 'honour', deviceNote: 'saved on this device only (v1)' };
    d.entries.push(e);
    if (rate === 0.2) d.fundraiser = true;           // TWO FOR DOUBLES -> fundraiser profile mark
    if (code && d.codes.indexOf(code) === -1) d.codes.push(code);
    d.proUntil = Math.max(at, +d.proUntil || 0) + PLANS[plan].ms; d.plan = plan;
    write(d);
    e.fakeBoost = fakeBoost(gbp); addFake(e.fakeBoost, opts.player);
    return e;
  }
  function isPro(now) { return (+read().proUntil || 0) > (now || Date.now()); }
  function balance() { return Math.round(read().entries.reduce(function (s, e) { return s + e.amount; }, 0) * 100) / 100; }

  var api = { PLANS: PLANS, KEY: KEY, split: split, fakeBoost: fakeBoost, recordPayment: recordPayment, isPro: isPro,
    balance: balance, ledger: read, isFundraiser: function () { return !!read().fundraiser; } };
  root.rvRealPopCoin = api;
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }

  /* ===== UI: the icon row (matches rv-userbox mock) ===== */
  var TILES = [
    { id: 'free', icon: '👤', name: 'useRbox', free: true },
    { id: 'real', icon: '🪙', name: 'REAL popCoin' },
    { id: 'wallet', icon: '👛', name: 'Wallet' },
    { id: 'data', icon: '📊', name: 'Real data' },
    { id: 'privacy', icon: '🔒', name: 'Privacy', free: true },
    { id: 'keyboard', icon: '⌨️', name: 'Keyboard' },
    { id: 'translator', icon: '🌐', name: 'Translator' },
    { id: 'services', icon: '🧭', name: 'Services', free: true },
    { id: 'buy', icon: '⭐', name: 'Buy PRO', free: true }
  ];
  function day(ms) { return new Date(ms).toLocaleDateString(); }
  function panel(id) {
    var d = read(), pro = isPro();
    if (id === 'buy') return '<b>⭐ Get PRO</b><p>£10 a year or £1.30 a month, on Ko-fi. You also get REAL popCoin (one tenth of what you pay, locked 1 year) and a FAKE popCornCoin boost for fun.</p>' +
      '<a class="rp-kofi" href="https://ko-fi.com/rudventur" target="_blank" rel="noopener">☕ Pay on Ko-fi</a>' +
      '<div class="rp-paid"><label><input type="radio" name="rpPlan" value="year" checked> £10 a year</label> <label><input type="radio" name="rpPlan" value="month"> £1.30 a month</label><br>' +
      '<input id="rpCode" placeholder="restaurant code (optional)"> <button id="rpPaid">✅ I paid</button>' +
      '<small>Honour system for now: we trust your tick. Ko-fi auto-check comes later.</small></div>';
    if (id === 'real' || id === 'wallet') return '<b>🪙 REAL popCoin</b><p>Balance: <b>' + balance() + '</b>' + (d.fundraiser ? ' · 🎗️ fundraiser' : '') + '</p>' +
      (d.entries.length ? '<ul>' + d.entries.map(function (e) { return '<li>' + e.amount + ' (paid £' + e.paidGbp + ', ' + (e.rate * 100) + '%) · locked until ' + day(e.unlockAt) + '</li>'; }).join('') + '</ul>' : '<p>No REAL popCoin yet.</p>') +
      '<small>Locked 1 year. No payout yet. Never used in the casino.</small>';
    if (id === 'privacy') return '<b>🔒 Privacy</b><p>PRO and REAL popCoin are saved only on this device for now.</p>';
    if (id === 'services') return '<b>🧭 Services</b><p>See the SERVICES list in the left section.</p>';
    if (id === 'free') return '<b>👤 useRbox</b><p>Your free profile. ' + (pro ? 'PRO until ' + day(d.proUntil) + '.' : 'Not PRO yet.') + '</p>';
    return '<b>' + id + '</b><p>PRO tile. Coming soon.</p>';
  }
  function mount() {
    var box = document.getElementById('useRbox'); if (!box || document.getElementById('rpRow')) return;
    var wrap = document.createElement('div'); wrap.className = 'rp-wrap';
    wrap.innerHTML = '<div id="rpRow" class="rp-row"></div><div id="rpPanel" class="rp-panel" hidden></div>';
    // Sit just above the three columns (after tabs if they exist) so column scroll still works.
    var cols = box.querySelector('.rb-cols');
    var tabs = box.querySelector('#rbTabs, .rb-tabs');
    if (cols && cols.parentNode === box) box.insertBefore(wrap, cols);
    else if (tabs && tabs.parentNode === box) tabs.after(wrap);
    else {
      var head = box.querySelector('.useRbox-header');
      if (head) head.after(wrap); else box.prepend(wrap);
    }
    render();
  }
  function render() {
    var row = document.getElementById('rpRow'); if (!row) return; var pro = isPro();
    row.innerHTML = TILES.map(function (t) { var locked = !t.free && !pro;
      return '<button class="rp-tile' + (locked ? ' rp-locked' : '') + '" data-tile="' + t.id + '" title="' + t.name + (locked ? ' (PRO, locked)' : '') + '">' + t.icon + '<span>' + t.name + '</span></button>'; }).join('');
    row.querySelectorAll('.rp-tile').forEach(function (b) { b.onclick = function () { show(b.classList.contains('rp-locked') ? 'buy' : b.dataset.tile); }; });
  }
  function show(id) {
    var p = document.getElementById('rpPanel'); p.hidden = false; p.innerHTML = panel(id);
    var btn = document.getElementById('rpPaid');
    if (btn) btn.onclick = function () { var plan = (p.querySelector('input[name=rpPlan]:checked') || {}).value;
      var e = recordPayment({ plan: plan, restaurantCode: document.getElementById('rpCode').value });
      render(); show('real'); p.insertAdjacentHTML('afterbegin', '<p>Thanks! +' + e.amount + ' REAL popCoin, +' + e.fakeBoost + ' FAKE popCornCoins for fun.</p>'); };
  }
  api.mount = mount; api.render = render; api.show = show;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  setTimeout(mount, 500);
})(typeof window !== 'undefined' ? window : globalThis);
