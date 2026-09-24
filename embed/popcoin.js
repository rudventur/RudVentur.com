/* popcoin.js — the PopCOIN engine (balance, mining, sending, receiving, export).

   PopCOIN is RUDVENTUR's site credit. Amounts are whole "pips": 100 pips = 1 PopCOIN.

   Two modes:
   - shared: when window.POPCOIN_FIREBASE holds a Firebase web config (see
     popcoin/config.js), every visitor gets an anonymous account in that
     project's Realtime Database. popcoin/database.rules.json enforces every
     rule on the server: nobody can set their own balance, mining is capped by
     the server clock, and a send only works if the sender pays exactly what
     lands in the receiver's inbox. The receiver's wallet claims it once.
   - local: until then, the wallet lives in this browser (no sending).

   API (window.PopCOIN):
     PopCOIN.ready            promise, resolves once the wallet is loaded
     PopCOIN.state            { mode, uid, name, balance, minedAt, history, error }
     PopCOIN.on(fn)           called with state on every change
     PopCOIN.mine()           claim what has been mined since the last claim -> pips
     PopCOIN.minable()        pips claimable right now (estimate)
     PopCOIN.send(name, pips, note)
     PopCOIN.reward(pips, reason) queue a reward (games, translator); paid out as
                              fast as the rules allow (3 PopCOIN per 30 s, 50 a day)
     PopCOIN.pending()        rewards still waiting to be paid out -> pips
     PopCOIN.exportWallet() / PopCOIN.withdrawalSlip(pips, to)   download files
     PopCOIN.fmt(pips)        "12.34"
     PopCOIN.value(pips)      indicative GBP value (not redeemable yet)
*/
(function () {
  'use strict';
  if (window.PopCOIN) return;

  var WELCOME = 1000;          // 10 PopCOIN on a new account (must match the rules)
  var MS_PER_PIP = 500;        // 2 pips a second while mining (must match the rules)
  var MAX_CLAIM = 600;         // at most 6 PopCOIN per claim (must match the rules)
  var REF_GBP = typeof window.POPCOIN_REF_GBP === 'number' ? window.POPCOIN_REF_GBP : 0.01;
  var SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  var LOCAL_KEY = 'popcoin_local_v1';
  var PENDING_KEY = 'popcoin_pending_v1';  // shared by every RUDVENTUR page
  var REWARD_MAX = 300;        // at most 3 PopCOIN per reward claim (must match the rules)
  var REWARD_GAP = 30000;      // at least 30 s between reward claims (must match the rules)
  var REWARD_DAY = 5000;       // at most 50 PopCOIN of rewards a day (must match the rules)

  var state = { mode: 'loading', uid: null, name: '', balance: 0, minedAt: 0, history: [], error: '',
    rewardAt: 0, rewardDay: 0, rewardToday: 0 };
  var listeners = [];
  var backend = null;

  function emit() { listeners.forEach(function (fn) { try { fn(state); } catch (e) { console.error(e); } }); }
  function fmt(p) { return (Math.round(p) / 100).toFixed(2); }
  function value(p) { return p / 100 * REF_GBP; }
  function cleanName(n) {
    n = String(n || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '').slice(0, 16);
    return n.length >= 3 ? n : 'popper';
  }
  function suggestedName() {
    try {
      var u = JSON.parse(localStorage.getItem('rud_useRbox_v2') || 'null');
      if (u && u.username) return cleanName(u.username);
    } catch (e) {}
    return cleanName(localStorage.getItem('rv_username') || 'popper');
  }
  function download(filename, text) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error('could not load ' + src)); };
      document.head.appendChild(s);
    });
  }

  /* ── local backend: this browser only ── */
  var local = {
    init: function () {
      var d = null;
      try { d = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null'); } catch (e) {}
      if (!d) {
        d = { name: suggestedName(), balance: WELCOME, minedAt: Date.now(), history: [] };
        d.history.unshift({ type: 'welcome', amount: WELCOME, at: Date.now(), note: 'Welcome to PopCOIN' });
      }
      this.d = d; this.save();
      state.mode = 'local'; state.uid = 'this-device';
      return Promise.resolve();
    },
    save: function () {
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(this.d)); } catch (e) {}
      state.name = this.d.name; state.balance = this.d.balance;
      state.minedAt = this.d.minedAt; state.history = this.d.history.slice(0, 100);
      state.rewardAt = this.d.rewardAt || 0; state.rewardDay = this.d.rewardDay || 0; state.rewardToday = this.d.rewardToday || 0;
      emit();
    },
    now: function () { return Date.now(); },
    mine: function () {
      var gain = Math.min(Math.floor((Date.now() - this.d.minedAt) / MS_PER_PIP), MAX_CLAIM);
      if (gain <= 0) return Promise.resolve(0);
      this.d.balance += gain; this.d.minedAt = Date.now();
      this.d.history.unshift({ type: 'mined', amount: gain, at: Date.now() });
      this.d.history = this.d.history.slice(0, 200);
      this.save();
      return Promise.resolve(gain);
    },
    send: function () {
      return Promise.reject(new Error('Sending opens as soon as PopCOIN shared accounts are switched on.'));
    },
    reward: function (gain, note, day, today) {
      this.d.balance += gain;
      this.d.rewardAt = Date.now(); this.d.rewardDay = day; this.d.rewardToday = today;
      this.d.history.unshift({ type: 'reward', amount: gain, at: Date.now(), note: note });
      this.d.history = this.d.history.slice(0, 200);
      this.save();
      return Promise.resolve(gain);
    }
  };

  /* ── shared backend: Firebase Realtime Database, rules do the enforcing ── */
  var shared = {
    init: function (cfg) {
      var self = this;
      return loadScript(SDK + 'firebase-app-compat.js')
        .then(function () { return loadScript(SDK + 'firebase-auth-compat.js'); })
        .then(function () { return loadScript(SDK + 'firebase-database-compat.js'); })
        .then(function () {
          var app = firebase.apps.filter(function (a) { return a.name === 'popcoin'; })[0] ||
            firebase.initializeApp(cfg, 'popcoin');
          self.auth = app.auth(); self.db = app.database();
          // local testing against the Firebase emulators (never set on the live site)
          if (cfg.emulator) {
            self.auth.useEmulator('http://127.0.0.1:' + cfg.emulator.auth);
            self.db.useEmulator('127.0.0.1', cfg.emulator.db);
          }
          self.offset = 0;
          self.db.ref('.info/serverTimeOffset').on('value', function (s) { self.offset = s.val() || 0; });
          // wait for Firebase to restore a saved sign-in before deciding to create
          // one: currentUser is still null for a moment after the page loads, and
          // signing in then would give this visitor a brand-new wallet every time
          return new Promise(function (resolve, reject) {
            var off = self.auth.onAuthStateChanged(function (user) {
              off();
              if (user) resolve(user);
              else self.auth.signInAnonymously().then(function (c) { resolve(c.user); }, reject);
            }, reject);
          });
        })
        .then(function (user) {
          self.uid = user.uid; state.uid = user.uid; state.mode = 'shared';
          self.root = self.db.ref('popcoin');
          return self.root.child('users/' + self.uid).once('value');
        })
        .then(function (snap) { return snap.exists() ? null : self.create(); })
        .then(function () {
          self.root.child('users/' + self.uid).on('value', function (s) {
            var u = s.val(); if (!u) return;
            state.name = u.name; state.balance = u.balance; state.minedAt = u.minedAt; self.lastTx = u.lastTx;
            state.rewardAt = u.rewardAt || 0; state.rewardDay = u.rewardDay || 0; state.rewardToday = u.rewardToday || 0;
            emit();
          });
          self.root.child('history/' + self.uid).orderByChild('at').limitToLast(100).on('value', function (s) {
            var h = []; s.forEach(function (c) { h.unshift(c.val()); });
            state.history = h; emit();
          });
          self.root.child('inbox/' + self.uid).orderByChild('claimed').equalTo(false).on('value', function (s) {
            var todo = []; s.forEach(function (c) { todo.push([c.key, c.val()]); });
            self.claimAll(todo);
          });
        });
    },
    create: function () {
      var self = this, base = suggestedName(), tries = 0;
      function attempt(name) {
        var upd = {};
        upd['names/' + name] = self.uid;
        upd['users/' + self.uid] = { name: name, balance: WELCOME, minedAt: firebase.database.ServerValue.TIMESTAMP, lastTx: '' };
        return self.root.update(upd).then(function () {
          return self.log({ type: 'welcome', amount: WELCOME, note: 'Welcome to PopCOIN' });
        }, function (e) {
          // name taken: add a few digits and try again
          if (++tries > 5) throw e;
          return attempt(base.slice(0, 14) + Math.floor(Math.random() * 9000 + 1000));
        });
      }
      return attempt(base);
    },
    log: function (item) {
      item.at = firebase.database.ServerValue.TIMESTAMP;
      return this.root.child('history/' + this.uid).push(item).catch(function () {});
    },
    now: function () { return Date.now() + (this.offset || 0); },
    mine: function () {
      var self = this;
      // stay a second behind the server clock so the rules never see a claim as too early
      var gain = Math.min(Math.floor((self.now() - state.minedAt - 1500) / MS_PER_PIP), MAX_CLAIM);
      if (gain <= 0) return Promise.resolve(0);
      return self.root.child('users/' + self.uid).update({
        balance: state.balance + gain, minedAt: firebase.database.ServerValue.TIMESTAMP
      }).then(function () { self.log({ type: 'mined', amount: gain }); return gain; });
    },
    send: function (toName, pips, note) {
      var self = this;
      toName = cleanName(toName.replace(/^@/, ''));
      pips = Math.round(pips);
      if (!(pips > 0)) return Promise.reject(new Error('Enter an amount above 0.'));
      if (pips > state.balance) return Promise.reject(new Error('Not enough PopCOIN.'));
      return self.root.child('names/' + toName).once('value').then(function (s) {
        var to = s.val();
        if (!to) throw new Error('No PopCOIN wallet called @' + toName + '.');
        if (to === self.uid) throw new Error('That is your own wallet.');
        var tx = self.root.child('outbox/' + self.uid).push().key;
        var TS = firebase.database.ServerValue.TIMESTAMP;
        var out = { to: to, amount: pips, at: TS };
        var inb = { from: self.uid, fromName: state.name, amount: pips, at: TS, claimed: false };
        if (note) { out.note = inb.note = String(note).slice(0, 80); }
        var upd = {};
        upd['users/' + self.uid + '/balance'] = state.balance - pips;
        upd['users/' + self.uid + '/lastTx'] = tx;
        upd['outbox/' + self.uid + '/' + tx] = out;
        upd['inbox/' + to + '/' + tx] = inb;
        return self.root.update(upd).then(function () {
          self.log({ type: 'sent', amount: -pips, with: toName, note: note || '' });
          return tx;
        });
      });
    },
    reward: function (gain, note, day, today) {
      var self = this;
      return self.root.child('users/' + self.uid).update({
        balance: state.balance + gain, rewardAt: firebase.database.ServerValue.TIMESTAMP,
        rewardDay: day, rewardToday: today
      }).then(function () { self.log({ type: 'reward', amount: gain, note: note }); return gain; });
    },
    claimAll: function (todo) {
      var self = this;
      if (self.claiming || !todo.length) return;
      self.claiming = true;
      // one at a time: each claim changes the balance the next one builds on
      (function next() {
        var item = todo.shift();
        if (!item) { self.claiming = false; return; }
        var key = item[0], p = item[1], upd = {};
        upd['inbox/' + self.uid + '/' + key + '/claimed'] = true;
        upd['users/' + self.uid + '/balance'] = state.balance + p.amount;
        upd['users/' + self.uid + '/lastTx'] = '~' + key;
        // the users/ listener updates state.balance itself as soon as this is written
        self.root.update(upd).then(function () {
          return self.log({ type: 'received', amount: p.amount, with: p.fromName || '', note: p.note || '' });
        }).catch(function (e) { console.warn('PopCOIN claim failed', e); }).then(next);
      })();
    }
  };

  /* ── rewards: queued on the device, paid out within the rules' limits ── */
  function pendingGet() {
    try { var p = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null'); if (p && p.pips >= 0) return p; } catch (e) {}
    return { pips: 0, notes: [] };
  }
  function pendingSet(p) {
    p.pips = Math.max(0, Math.min(p.pips, 20000));   // don't let an old queue grow forever
    p.notes = (p.notes || []).slice(-5);
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(p)); } catch (e) {}
    emit();
  }
  var flushTimer = null, flushing = false;
  // only one open RUDVENTUR page pays out the shared queue at a time; otherwise two
  // pages can both "pay" the same reward (the rules credit it once, but the queue
  // and history would count it twice)
  var LOCK_KEY = 'popcoin_flush_lock', myLock = 0;
  function takeLock() {
    var held = 0;
    try { held = +localStorage.getItem(LOCK_KEY) || 0; } catch (e) {}
    if (held && held !== myLock && Date.now() - held < 15000) return false;
    myLock = Date.now();
    try { localStorage.setItem(LOCK_KEY, String(myLock)); } catch (e) {}
    return true;
  }
  function dropLock() {
    try { if (+localStorage.getItem(LOCK_KEY) === myLock) localStorage.removeItem(LOCK_KEY); } catch (e) {}
  }
  function scheduleFlush(ms) {
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, ms);
  }
  function flush() {
    if (flushing || !backend || state.mode === 'loading') return;
    // offline fallback: keep rewards queued for the shared account instead of
    // paying them into this device's stand-in wallet
    if (state.error) return;
    var p = pendingGet();
    if (!p.pips) return;
    if (!takeLock()) { scheduleFlush(16000); return; }
    var now = backend.now();
    var wait = (state.rewardAt || 0) + REWARD_GAP + 1500 - now;
    if (wait > 0) { dropLock(); scheduleFlush(wait); return; }
    var day = Math.floor(now / 86400000);
    var usedToday = state.rewardDay === day ? state.rewardToday : 0;
    var gain = Math.min(p.pips, REWARD_MAX, REWARD_DAY - usedToday);
    if (gain <= 0) { dropLock(); scheduleFlush(86400000 - now % 86400000 + 5000); return; }   // daily cap: try tomorrow
    var note = p.notes.length ? p.notes.join(', ').slice(0, 60) : 'reward';
    flushing = true;
    backend.reward(gain, note, day, usedToday + gain).then(function () {
      var q = pendingGet(); q.pips -= gain; if (q.pips <= 0) q.notes = []; pendingSet(q);
      flushing = false; dropLock();
      if (q.pips > 0) scheduleFlush(REWARD_GAP + 1500);
    }, function (e) {
      flushing = false; dropLock();
      console.warn('PopCOIN reward will retry', e && e.message);
      scheduleFlush(REWARD_GAP + 5000);
    });
  }

  var ready = (function () {
    var cfg = window.POPCOIN_FIREBASE;
    var go = cfg && cfg.apiKey && cfg.databaseURL
      ? (backend = shared).init(cfg).catch(function (e) {
          console.warn('PopCOIN shared accounts unavailable, using this device', e);
          state.error = 'Could not reach PopCOIN accounts, using this device for now.';
          return (backend = local).init();
        })
      : (backend = local).init();
    return go.then(function () { emit(); scheduleFlush(1000); return state; });
  })();

  window.PopCOIN = {
    ready: ready,
    state: state,
    on: function (fn) { listeners.push(fn); fn(state); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; },
    mine: function () { return ready.then(function () { return backend.mine(); }); },
    minable: function () {
      if (!backend) return 0;
      return Math.max(0, Math.min(Math.floor((backend.now() - state.minedAt) / MS_PER_PIP), MAX_CLAIM));
    },
    send: function (name, pips, note) { return ready.then(function () { return backend.send(name, pips, note); }); },
    reward: function (pips, reason) {
      pips = Math.round(pips);
      if (!(pips > 0)) return;
      var p = pendingGet();
      p.pips += pips;
      if (reason && p.notes.indexOf(reason) < 0) p.notes.push(String(reason).slice(0, 30));
      pendingSet(p);
      ready.then(function () { scheduleFlush(200); });
    },
    pending: function () { return pendingGet().pips; },
    exportWallet: function () {
      download('popcoin-wallet-' + state.name + '.json', JSON.stringify({
        wallet: 'PopCOIN', name: state.name, account: state.uid, mode: state.mode,
        balance: fmt(state.balance), balancePips: state.balance,
        indicativeGBP: value(state.balance).toFixed(2), history: state.history,
        exportedAt: new Date().toISOString()
      }, null, 2));
    },
    withdrawalSlip: function (pips, to) {
      pips = Math.min(Math.round(pips) || state.balance, state.balance);
      download('popcoin-withdrawal-slip-' + Date.now() + '.json', JSON.stringify({
        slip: 'PopCOIN withdrawal slip',
        from: '@' + state.name, account: state.uid, to: to || '(not set)',
        amount: fmt(pips) + ' PopCOIN', indicativeGBP: value(pips).toFixed(2),
        status: 'REQUEST - PopCOIN is a site credit and is not redeemable for money yet',
        created: new Date().toISOString(), ref: 'PC-' + Date.now().toString(36).toUpperCase()
      }, null, 2));
    },
    fmt: fmt,
    value: value,
    RATE_PER_MIN: 60000 / MS_PER_PIP / 100,
    MAX_CLAIM: MAX_CLAIM
  };
})();
