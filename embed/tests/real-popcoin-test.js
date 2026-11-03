/* node embed/tests/real-popcoin-test.js  — locked->unlocked, 10% vs 20%, fake boost, 1-year lock */
'use strict';
const store = {}; global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
global.window = global; const rp = require('../real-popcoin.js');
let fail = 0; const ok = (c, m) => { console.log((c ? '  ✅ ' : '  ❌ ') + m); if (!c) fail++; };
ok(!rp.isPro(), 'starts locked (not PRO)');
const t = Date.UTC(2026, 10, 3);
const a = rp.recordPayment({ plan: 'year', restaurantCode: 'Rud Diner', at: t });
ok(a.rate === 0.1 && a.amount === 1, '£10 -> 1 REAL popCoin (10%)');
ok(a.unlockAt - a.at === 365 * 864e5, 'locked for 1 year');
ok(rp.isPro(t + 1), 'PRO after payment (unlocked)');
ok(!rp.isPro(t + 366 * 864e5), 'yearly PRO ends after a year');
ok(JSON.parse(store.rud_fakePopCoins_v1).players.guest.balance === 50 + 1000, 'FAKE boost +1000 for £10');
const b = rp.recordPayment({ plan: 'month', restaurantCode: 'rud diner ', at: t + 1000 });
ok(b.rate === 0.2 && b.amount === 0.26 && rp.isFundraiser(), 'TWO FOR DOUBLES: 20% + fundraiser mark');
ok(rp.balance() === 1.26, 'balance adds up');
const s = rp.split(10); ok(s.tax === 3 && s.rud === 5 && s.investment === 1, 'ledger split 30/50/10');
process.exit(fail ? 1 : 0);
