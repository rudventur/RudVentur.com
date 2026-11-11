/* Headless-Chrome test for the useRbox restaurants, free tables and the "right to remain".
   Rules (in Mateusz's words): every sub gets a restaurant · every free useR gets a free table but no restaurant ·
   while a restaurant is open, free useRs may stay · when it closes, the useRs the sub invited keep the right to remain.
   Needs the Firebase emulators (database 9000, auth 9099) with popcoin/database.rules.json, and the repo served:
     cd popcoin && npx firebase emulators:exec --only database,auth --project demo-popcoin \
       "node ../embed/tests/useRbox-restaurant-headless.js http://localhost:8765/ /workspace"
   Nothing here touches the live database: the page is pointed at the emulator with window.RV_PRESENCE_FIREBASE.
   Three useRs in three separate browsers: Alice (subscriber, restaurant), Bob (free, his free table), Carol (free, gets invited). */
'use strict';
const puppeteer = require('puppeteer-core');
const path = require('path');
const base = process.argv[2] || 'http://localhost:8765/';
const shotDir = process.argv[3] || __dirname;
const PAGE = base + 'embed/tests/useRbox-test.html';
const CFG = { apiKey: 'fake-key', authDomain: 'demo-popcoin.firebaseapp.com', databaseURL: 'http://127.0.0.1:9000?ns=demo-popcoin', projectId: 'demo-popcoin', emulator: { auth: 9099, db: 9000 } };
const ROOM = 'diner-' + Math.random().toString(36).slice(2, 7);
let pass = 0, fail = 0;
const ok = (c, m, x) => { c ? pass++ : fail++; console.log((c ? '  ✅ ' : '  ❌ ') + m + (x ? '  ' + x : '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const DESK = { width: 1440, height: 900 };

(async () => {
  // load the real rules into the emulator namespace the page uses (otherwise the emulator lets everything through)
  const rules = require('fs').readFileSync(path.join(__dirname, '../../popcoin/database.rules.json'), 'utf8');
  const put = await fetch('http://127.0.0.1:9000/.settings/rules.json?ns=demo-popcoin', { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: rules });
  ok(put.ok, 'the real database rules are loaded into the emulator (never the live database)');
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
  const pages = [];
  const useR = async (name, pub) => {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage(); page.errs = []; pages.push(page);
    page.on('pageerror', e => page.errs.push(e.message.slice(0, 160)));
    await page.evaluateOnNewDocument((c, ls) => { window.RV_PRESENCE_FIREBASE = c; try { for (const k in ls) localStorage.setItem(k, ls[k]); } catch (e) { /* about:blank */ } },
      CFG, { rudventur_channel: ROOM, rvUseRboxView: 'full', rvPublicSettings: JSON.stringify(pub) });
    await page.setViewport(DESK);
    await page.goto(PAGE, { waitUntil: 'load' });
    await page.waitForFunction(() => window.rvUserbox && window.rvUserbox.restaurant);
    await page.$eval('#Rcircle', e => e.click()); await page.$eval('#iconUser', e => e.click()); await sleep(300);
    await page.$eval('#username', (e, n) => { e.value = n; }, name); await tap(page, '#saveUser');
    return page;
  };
  const show = async (p) => { await p.evaluate(() => { const c = document.getElementById('rbRoomVisible'); c.checked = true; c.dispatchEvent(new Event('change')); });
    await p.waitForFunction(() => /shown live/.test(document.getElementById('rbPresenceNote').textContent), { timeout: 15000 }); };
  const until = (p, fn, arg, ms) => p.waitForFunction(fn, { timeout: ms || 15000 }, arg).then(() => true, () => false);
  const text = (p, sel) => p.$eval(sel, e => e.innerText).catch(() => '');
  const uidOf = p => p.evaluate(() => firebase.app('rvpresence').auth().currentUser.uid);
  const openRest = async (p, who) => { await until(p, w => [...document.querySelectorAll('#rbRestaurants .rb-person')].some(b => b.textContent.includes(w)), who);
    await p.evaluate(w => [...document.querySelectorAll('#rbRestaurants .rb-person')].find(b => b.textContent.includes(w)).click(), who);
    return until(p, () => /OPEN|CLOSED/.test(document.getElementById('rbTablesStatus').innerText)); };
  const tap = (p, sel) => p.$eval(sel, e => e.click());
  const viewProfile = (p, who) => p.evaluate(w => [...document.querySelectorAll('#rbPeopleList .rb-person')].find(b => b.textContent.includes(w)).click(), who);
  const shot = async (p, file) => { await p.evaluate(() => document.getElementById('rbTables').scrollIntoView({ block: 'center' })); await sleep(200); await p.screenshot({ path: path.join(shotDir, file) }); };
  console.log('# ' + PAGE + '  room ' + ROOM);

  const alice = await useR('Alice', { subscriber: true, restOpen: 'online', tables: ['translator', 'chemventur'] });
  const bob = await useR('Bob', { subscriber: false, free: { service: 'map-merger', label: 'Maps corner' } });
  const carol = await useR('Carol', { subscriber: false, free: { service: 'chemventur', label: '' } });

  // ===== honesty: nobody made up =====
  await bob.evaluate(() => rvUserbox.presence.listen()); await sleep(1200);
  ok(/No restaurants open right now/.test(await text(bob, '#rbRestaurants')) && /No one else here yet/.test(await text(bob, '#rbPeopleList')), 'with nobody shown, the lists stay empty (no fake people or restaurants)');
  ok(await alice.evaluate(() => document.getElementById('rbFreeSettings').style.display === 'none' && document.getElementById('rbRestSettings').style.display === ''), 'a subscriber sets up a restaurant (no free table settings)');
  ok(await bob.evaluate(() => document.getElementById('rbFreeSettings').style.display === '' && document.getElementById('rbRestSettings').style.display === 'none' && document.getElementById('rbFreeTable').value === 'map-merger'), 'a free useR sets up one free table (no restaurant settings)');
  ok(/Free table[\s\S]*Map merger[\s\S]*Maps corner[\s\S]*at home/.test(await text(bob, '#rbMyInfo')), 'the middle shows the free table "at home" when it is not at a restaurant', (await text(bob, '#rbMyInfo')).split('\n').filter(l => /Free|Map/.test(l)).join(' '));

  await show(alice); await show(bob); await show(carol);
  const A = await uidOf(alice), B = await uidOf(bob), C = await uidOf(carol);
  ok(/My restaurant · 🟢 open · 2 tables/.test(await text(alice, '#rbRestaurants')), 'every subscriber gets her own restaurant', await text(alice, '#rbRestaurants'));
  ok(!/My restaurant/.test(await text(bob, '#rbRestaurants')), 'a free useR has no restaurant of his own');

  // ===== open: a free useR pulls up his free table =====
  ok(await openRest(bob, 'Alice'), 'Bob sees Alice\'s open restaurant and walks in');
  await tap(bob, '#rbPullUp');
  ok(await until(bob, () => /Bob \(you\)'s free table/.test(document.getElementById('rbSeated').innerText)), 'Bob pulls up his free table', (await text(bob, '#rbSeated')).replace(/\n/g, ' | '));
  ok(await openRest(carol, 'Alice'), 'Carol walks in too');
  await tap(carol, '#rbTablesList [data-sit="translator"]');
  ok(await until(carol, () => /Carol \(you\)/.test(document.querySelector('#rbTablesList [data-table="translator"]').innerText)), 'Carol sits at the translator table');
  await tap(alice, '#rbMyRestaurant');
  ok(await until(alice, () => /Bob's free table[\s\S]*Maps corner/.test(document.getElementById('rbSeated').innerText) && /Carol/.test(document.getElementById('rbTablesList').innerText)), 'Alice sees Bob\'s free table (with its name) and Carol at a table', (await text(alice, '#rbTables')).replace(/\n/g, ' | '));
  ok(/pulled up at a restaurant/.test(await text(bob, '#rbMyInfo')), 'Bob\'s middle column says his free table is pulled up');

  // ===== invite (only the owner) =====
  await viewProfile(alice, 'Carol'); await alice.waitForSelector('#rbInviteBtn'); await tap(alice, '#rbInviteBtn');
  ok(await until(alice, () => /Carol 🎟️/.test(document.getElementById('rbPeopleList').innerText) && !/Bob 🎟️/.test(document.getElementById('rbPeopleList').innerText)), 'the invite badge shows on Carol (and not on Bob) in Alice\'s people list', (await text(alice, '#rbPeopleList')).replace(/\n/g, ' | '));
  ok(await until(alice, () => !!document.getElementById('rbUninvite') && /INVITED/.test(document.getElementById('rbViewedBody').innerText)), 'Carol\'s profile in the middle now says INVITED, with an UNINVITE button');
  ok(await until(carol, () => /INVITED/.test(document.getElementById('rbTablesStatus').innerText)), 'Carol sees she is invited and may stay');
  await viewProfile(bob, 'Carol'); await sleep(200);
  ok(await bob.evaluate(() => !document.getElementById('rbInviteBtn')), 'a free useR gets no invite button (he has no restaurant)');
  const sneaky = await bob.evaluate((a, b) => firebase.app('rvpresence').database().ref('restaurants/' + a + '/invites/' + b).set({ name: 'Bob', at: Date.now() }).then(() => 'written', e => e.code || e.message), A, B);
  ok(/denied/i.test(sneaky), 'Bob cannot invite himself into Alice\'s restaurant', sneaky);
  const second = await bob.evaluate(b => firebase.app('rvpresence').database().ref('freeTables/' + b + '/second').set({ name: 'Bob', service: 'hub' }).then(() => 'written', e => e.code || e.message), B);
  ok(/denied/i.test(second), 'Bob cannot make a second free table', second);
  await shot(alice, 'useRbox-tables-open.png');

  // ===== close: Bob is moved out, invited Carol keeps the right to remain =====
  const shut = await bob.evaluate(a => firebase.app('rvpresence').database().ref('restaurants/' + a + '/info/open').set(false).then(() => 'written', e => e.code || e.message), A);
  ok(/denied/i.test(shut), 'only the owner can close the restaurant (Bob cannot)', shut);
  await alice.select('#rbRestOpen', 'closed'); await tap(alice, '#rbSavePublic');
  ok(await until(bob, () => document.getElementById('rbTables').classList.contains('hidden') && /closed/.test(document.getElementById('rbRestMsg').textContent)), 'Bob is moved back to the room list with a friendly message', await text(bob, '#rbRestMsg'));
  ok(await until(alice, () => /CLOSED/.test(document.getElementById('rbTablesStatus').innerText) && !/Bob/.test(document.getElementById('rbTables').innerText) && /Carol 🎟️/.test(document.getElementById('rbTablesList').innerText)), 'closed: Alice sees invited Carol still seated, Bob gone', (await text(alice, '#rbTables')).replace(/\n/g, ' | '));
  ok(await until(carol, () => /CLOSED/.test(document.getElementById('rbTablesStatus').innerText) && /Carol \(you\)/.test(document.getElementById('rbTablesList').innerText) && /can stay/.test(document.getElementById('rbRestMsg').textContent)), 'closed: Carol is still seated and told she can stay', await text(carol, '#rbRestMsg'));
  ok(/No restaurants open right now/.test(await text(bob, '#rbRestaurants')), 'Bob no longer sees the closed restaurant');
  ok(/closed · 🎟️ you are invited/.test(await text(carol, '#rbRestaurants')), 'Carol still sees it in her list: closed, but invited');
  const back = await bob.evaluate(a => rvUserbox.restaurant.sit(a, 'translator').then(() => 'sat', e => e.code || e.message), A);
  ok(/denied/i.test(back), 'Bob cannot sit back down while it is closed', back);
  ok(/at home/.test(await text(bob, '#rbMyInfo')), 'Bob\'s free table went home with him');
  await shot(alice, 'useRbox-closed-invited.png');
  await shot(carol, 'useRbox-closed-invited-guest.png');

  // ===== uninvite =====
  await viewProfile(alice, 'Carol'); await alice.waitForSelector('#rbUninvite'); await tap(alice, '#rbUninvite');
  ok(await until(carol, () => document.getElementById('rbTables').classList.contains('hidden') && /invite/.test(document.getElementById('rbRestMsg').textContent)), 'uninvited while closed: Carol is moved out with a message', await text(carol, '#rbRestMsg'));
  ok(await until(alice, () => /Nobody is sitting here yet/.test(document.getElementById('rbSeated').innerText) && !/🎟️/.test(document.getElementById('rbPeopleList').innerText)), 'Alice\'s restaurant is empty and the invite badge is gone');

  // ===== reopen =====
  await alice.select('#rbRestOpen', 'online'); await tap(alice, '#rbSavePublic');
  ok(await openRest(bob, 'Alice'), 'reopened: Bob can walk back in');
  await tap(bob, '#rbPullUp');
  ok(await until(alice, () => /Bob's free table/.test(document.getElementById('rbSeated').innerText)), 'and pull his free table up again');

  // ===== stop sharing: everything goes away =====
  await alice.evaluate(() => { const c = document.getElementById('rbRoomVisible'); c.checked = false; c.dispatchEvent(new Event('change')); });
  ok(await until(bob, () => document.getElementById('rbTables').classList.contains('hidden')), 'when Alice stops showing herself, her restaurant goes and Bob is moved out', await text(bob, '#rbRestMsg'));
  const gone = await bob.evaluate(a => firebase.app('rvpresence').database().ref('restaurants/' + a + '/info').once('value').then(s => s.exists()), A);
  ok(!gone, 'nothing about Alice\'s restaurant is left in the database');

  pages.forEach((p, i) => ok(p.errs.length === 0, 'no page errors (' + ['Alice', 'Bob', 'Carol'][i] + ')', p.errs.join(' | ')));
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
