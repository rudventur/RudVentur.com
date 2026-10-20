/* Headless-Chrome test for the useRbox: one R, three columns (also on phones), view modes, profile builder, channels.
   Needs the Firebase emulators (database 9000, auth 9099) with popcoin/database.rules.json, and the repo served:
     cd popcoin && npx firebase emulators:exec --only database,auth --project demo-popcoin \
       "node ../embed/tests/useRbox-headless.js http://localhost:8765/ /tmp"
     (serve the repository root on 8765 first: python3 -m http.server 8765)
   Nothing here touches the live database: the page is pointed at the emulator with window.RV_PRESENCE_FIREBASE. */
'use strict';
const puppeteer = require('puppeteer-core');
const path = require('path');
const base = process.argv[2] || 'http://localhost:8765/';
const shotDir = process.argv[3] || __dirname;
const PAGE = base + 'embed/tests/useRbox-test.html';
const CFG = { apiKey: 'fake-key', authDomain: 'demo-popcoin.firebaseapp.com', databaseURL: 'http://127.0.0.1:9000?ns=demo-popcoin', projectId: 'demo-popcoin', emulator: { auth: 9099, db: 9000 } };
let pass = 0, fail = 0;
const ok = (c, m, x) => { c ? pass++ : fail++; console.log((c ? '  ✅ ' : '  ❌ ') + m + (x ? '  ' + x : '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PHONE = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const DESK = { width: 1440, height: 900 };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
  const open = async (ctx, vp, query, ls) => {
    const page = await ctx.newPage(); page.errs = [];
    page.on('pageerror', e => page.errs.push(e.message.slice(0, 160)));
    await page.evaluateOnNewDocument((c, ls) => { window.RV_PRESENCE_FIREBASE = c; try { for (const k in (ls || {})) localStorage.setItem(k, ls[k]); } catch (e) { /* about:blank */ } }, CFG, ls);
    await page.setViewport(vp);
    await page.goto(PAGE + (query || ''), { waitUntil: 'load' });
    await page.waitForFunction(() => window.rvUserbox && document.getElementById('rbViewMode'));
    return page;
  };
  const openBox = async (p) => { await p.$eval('#Rcircle', e => e.click()); await p.$eval('#iconUser', e => e.click()); await sleep(600); };
  const cols = (p) => p.evaluate(() => [...document.querySelectorAll('.rb-col')].map(c => { const r = c.getBoundingClientRect(), cs = getComputedStyle(c);
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), vis: cs.display !== 'none', scroll: cs.overflowY, font: parseFloat(cs.fontSize) }; }));
  console.log('# ' + PAGE);

  // ===== desktop: one R, three columns, view modes =====
  const ca = await browser.createBrowserContext();
  let a = await open(ca, DESK);
  ok(await a.evaluate(() => document.querySelectorAll('#Rcircle').length === 1), 'exactly one R');
  await openBox(a);
  let c = await cols(a);
  ok(c.length === 3 && c[0].x < c[1].x && c[1].x < c[2].x && c.every(k => Math.abs(k.y - c[0].y) < 2 && k.vis), 'desktop: three sections side by side', JSON.stringify(c.map(k => [k.x, k.w])));
  ok(c.every(k => k.scroll === 'auto'), 'desktop, 3 sections view: each section scrolls on its own');
  const vb = await a.evaluate(() => { const b = document.getElementById('rbViewMode'), cl = document.getElementById('closeUser'); return { next: b.nextElementSibling === cl, text: b.textContent, title: b.title }; });
  ok(vb.next && vb.text === '▥', 'the view mode button sits right next to the close button', JSON.stringify(vb));
  await a.click('#rbViewMode'); await sleep(300);
  let st = await a.evaluate(() => { const box = document.getElementById('useRbox').getBoundingClientRect(); return { view: document.getElementById('useRbox').dataset.view, left: Math.round(box.left), w: Math.round(box.width), saved: localStorage.getItem('rvUseRboxView'), tabs: getComputedStyle(document.getElementById('rbTabs')).display }; });
  c = await cols(a);
  ok(st.view === 'half' && st.saved === 'half' && st.left === 720 && st.w === 720 && st.tabs === 'flex' && c.filter(k => k.vis).length === 1 && c[1].vis, 'half screen: right half, one section (the useR) with tabs', JSON.stringify(st));
  await a.screenshot({ path: '/tmp/vm-half.png' });
  await a.click('#rbTabs [data-col="right"]'); await sleep(150);
  c = await cols(a);
  ok(c[2].vis && !c[1].vis && !c[0].vis, 'the tabs switch which section shows (Editing)');
  await a.click('#rbViewMode'); await sleep(300);
  st = await a.evaluate(() => ({ view: document.getElementById('useRbox').dataset.view, w: Math.round(document.getElementById('useRbox').getBoundingClientRect().width), folds: [...document.querySelectorAll('#useRbox details.rb-fold')].every(d => d.open) }));
  c = await cols(a);
  ok(st.view === 'full' && st.w === 1440 && st.folds && c.every(k => k.vis), 'full screen: edge to edge, every section and every menu open', JSON.stringify(st));
  await a.screenshot({ path: '/tmp/vm-full.png' });
  await a.reload({ waitUntil: 'load' }); await a.waitForFunction(() => document.getElementById('rbViewMode'));
  ok(await a.evaluate(() => document.getElementById('useRbox').dataset.view === 'full'), 'the view choice is remembered on the device after a reload');
  await openBox(a);
  await a.click('#rbViewMode'); await sleep(300);
  ok(await a.evaluate(() => document.getElementById('useRbox').dataset.view === 'three'), 'the button cycles back to 3 sections');
  await a.screenshot({ path: '/tmp/vm-three.png' });

  // ===== profile builder =====
  st = await a.evaluate(() => { const b = document.getElementById('rbBuilder'); return { inRight: !!b.closest('.rb-col-right'), first: b.parentNode.firstElementChild === b, steps: b.querySelectorAll('.rb-step').length, shown: b.querySelectorAll('.rb-step:not(.hidden)').length }; });
  ok(st.inRight && st.first && st.steps === 8 && st.shown === 1, 'the profile builder is first in the Editing column: 8 steps, one at a time', JSON.stringify(st));
  const typeIn = async (sel, text) => { await a.$eval(sel, e => { e.value = ''; }); await a.type(sel, text); };
  await typeIn('#rbBuilder [data-b="username"]', 'Mateusz');
  let info = await a.$eval('#rbMyInfo', e => e.innerText);
  ok(/Mateusz/.test(info), 'typing the name previews it at once in 👤 MY INFO', info.split('\n').slice(0, 2).join(' '));
  await a.click('#rbNext'); await typeIn('#rbBuilder [data-b="psignature"]', 'Bonds in 3D');
  await a.click('#rbNext'); await a.click('#rbBuilder [data-av="🦉"]');
  await a.click('#rbNext'); await a.select('#rbBuilder [data-b="langpick"]', 'pl'); await a.click('#rbBuilder [data-b="langadd"]'); await a.select('#rbBuilder [data-b="langpick"]', 'en'); await a.click('#rbBuilder [data-b="langadd"]');
  await a.click('#rbNext'); await typeIn('#rbBuilder [data-b="publicNote"]', 'Come and fly');
  await a.click('#rbNext'); await a.click('#rbBuilder input[name="rbBLoc"][value="share"]');
  await a.click('#rbNext'); await a.click('#rbBuilder [data-b="sub"]'); await a.click('#rbBuilder [data-b="tables"] input[value="chemventur"]');
  await a.click('#rbNext');
  info = await a.$eval('#rbMyInfo', e => e.innerText);
  ok(/🦉/.test(info) && /Polish, English/.test(info) && /Bonds in 3D/.test(info) && /Come and fly/.test(info) && /1 tables/.test(info), 'the preview shows avatar, languages, signature, note and the restaurant table', info.replace(/\n/g, ' | '));
  await sleep(300);
  await a.screenshot({ path: path.join(shotDir, 'rbox-profile-builder.png') });
  await a.click('#rbNext'); await sleep(400);   // save
  st = await a.evaluate(() => { const p = rvUserbox.get(); return { name: p.username, ps: p.psignature, av: p.avatar, langs: p.languages, pub: JSON.parse(localStorage.getItem('rvPublicSettings') || '{}'), extra: JSON.parse(localStorage.getItem('rud_useRbox_extra') || '{}').publicNote, v2: JSON.parse(localStorage.getItem('rud_useRbox_v2') || '{}').username }; });
  ok(st.name === 'Mateusz' && st.ps === 'Bonds in 3D' && st.av === '🦉' && st.langs === 'pl,en' && st.pub.shareLoc === true && st.pub.subscriber === true && st.pub.tables.join() === 'chemventur' && st.extra === 'Come and fly' && st.v2 === 'Mateusz', 'SAVE stores every step on the device', JSON.stringify(st));

  // ===== channels =====
  st = await a.evaluate(() => ({ api: typeof rvUserbox.createChannel + typeof rvUserbox.listChannels, list: !!document.querySelector('.rb-col-mid #rbChannels'), make: !!document.querySelector('.rb-col-right #rbMakeChannel') }));
  ok(st.api === 'functionfunction' && st.list && st.make, 'rvUserbox.createChannel and listChannels exist; channel list in the middle, making in Editing', JSON.stringify(st));
  await a.$eval('#rbMakeChannel', d => { d.open = true; });
  await typeIn('#rbChName', 'Night Owls'); await typeIn('#rbChDesc', 'Late chemistry talk');
  await a.click('#rbChCreate'); await a.waitForFunction(() => /Made|⚠️/.test(document.getElementById('rbChMsg').textContent), { timeout: 15000 });
  let msg = await a.$eval('#rbChMsg', e => e.textContent);
  ok(/Made "Night Owls"/.test(msg) && /\?rvroom=night-owls-[a-z0-9]{5}/.test(msg), 'making a public channel works and gives a share link', msg);
  const priv = await a.evaluate(() => rvUserbox.createChannel({ name: 'Secret lab', description: '', public: false }));
  ok(priv && !priv.public && /^secret-lab-/.test(priv.id), 'making a private channel through rvUserbox.createChannel', JSON.stringify(priv));
  const bad = await a.evaluate(() => rvUserbox.createChannel({ name: '   ' }).then(() => 'made', e => e.message));
  ok(bad === 'A channel needs a name', 'a channel without a name is refused', bad);
  let lists = await a.evaluate(() => rvUserbox.listChannels());
  await sleep(300);
  st = await a.evaluate(() => ({ mine: document.getElementById('rbMyChannels').innerText, pub: document.getElementById('rbPublicChannels').innerText }));
  ok(lists.mine.length === 2 && lists.public.length === 1 && /Night Owls/.test(st.mine) && /Secret lab/.test(st.mine) && /Night Owls/.test(st.pub) && !/Secret lab/.test(st.pub), 'my channels lists both; public channels only the public one', JSON.stringify({ mine: lists.mine.map(x => x.name), pub: lists.public.map(x => x.name) }));
  await a.evaluate(() => document.querySelector('#rbChannels').scrollIntoView());
  await a.screenshot({ path: path.join(shotDir, 'rbox-channels.png') });

  // a second useR: sees the public channel, not the private one; joins the private one from its share link
  const cb = await browser.createBrowserContext();
  const b = await open(cb, DESK, '?rvroom=' + priv.id);
  await openBox(b);
  const lb = await b.evaluate(() => rvUserbox.listChannels());
  ok(lb.mine.length === 0 && lb.public.length === 1 && lb.public[0].name === 'Night Owls', 'another useR sees the public channel only', JSON.stringify(lb.public.map(x => x.name)));
  await b.waitForFunction(() => /Secret lab/.test(document.getElementById('rbInvite').textContent), { timeout: 10000 }).catch(() => {});
  const inv = await b.$eval('#rbInvite', e => e.innerText);
  await b.click('#rbInviteJoin'); await sleep(300);
  st = await b.evaluate(() => ({ ch: localStorage.getItem('rudventur_channel'), field: document.getElementById('channel').value }));
  ok(/Secret lab/.test(inv) && st.ch === priv.id && st.field === priv.id, 'the share link offers the private channel by name and JOIN switches the room', JSON.stringify({ inv, ...st }));
  const del = await b.evaluate((id) => rvUserbox.deleteChannel(id).then(() => 'deleted', e => e.message), priv.id);
  ok(del !== 'deleted', 'someone else cannot delete it', del);
  ok(a.errs.length === 0 && b.errs.length === 0, 'no page errors (desktop)', a.errs.concat(b.errs).join(' | '));
  await cb.close();

  // ===== phone: three columns side by side, readable, each scrolls =====
  const cp = await browser.createBrowserContext();
  const p = await open(cp, PHONE, '', { rvUseRboxView: 'three' });
  await openBox(p);
  c = await cols(p);
  const R = await p.$eval('#Rcircle', e => { const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return t && t.id === 'Rcircle'; });
  ok(c.every(k => k.vis) && c[0].x < c[1].x && c[1].x < c[2].x && c.every(k => Math.abs(k.y - c[0].y) < 2) && c.every(k => k.w >= 100), 'phone: still three sections side by side (no stacking)', JSON.stringify(c.map(k => [k.x, k.w])));
  ok(c.every(k => k.scroll === 'auto' && k.font >= 11 && k.h > 500 && k.h < 844), 'phone: each section scrolls on its own, text at least 11px', JSON.stringify(c.map(k => [k.h, k.font])));
  ok(R, 'phone: the R stays on top and clickable');
  const scrolled = await p.evaluate(() => { const r = document.querySelector('.rb-col-right'); r.scrollTop = 400; return [r.scrollTop, document.querySelector('.rb-col-left').scrollTop]; });
  ok(scrolled[0] > 0 && scrolled[1] === 0, 'scrolling the Editing section leaves the others where they are', scrolled.join(','));
  await p.evaluate(() => { document.querySelector('.rb-col-right').scrollTop = 0; });
  await p.screenshot({ path: path.join(shotDir, 'rbox-phone-3col.png') });
  await p.click('#rbViewMode'); await sleep(300);
  st = await p.evaluate(() => { const r = document.getElementById('useRbox').getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height) }; });
  c = await cols(p);
  ok(st.top === 422 && st.h === 422 && c.filter(k => k.vis).length === 1, 'phone half screen (portrait): bottom half, one section', JSON.stringify(st));
  // swipe left: the next section
  const before = await p.$eval('.rb-cols', e => e.dataset.tab);
  await p.touchscreen.touchStart(320, 650); await p.touchscreen.touchMove(200, 655); await p.touchscreen.touchMove(120, 655); await p.touchscreen.touchEnd(); await sleep(200);
  const after = await p.$eval('.rb-cols', e => e.dataset.tab);
  ok(before !== after && ['mid', 'right'].includes(after), 'a swipe switches the section', before + ' → ' + after);
  await p.screenshot({ path: '/tmp/vm-phone-half.png' });
  ok(p.errs.length === 0, 'no page errors (phone)', p.errs.join(' | '));
  await cp.close(); await ca.close();
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
