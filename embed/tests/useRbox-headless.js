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

  // ===== nag: robot or not =====
  const nagTo = async (p) => { for (let i = 0; i < 4 && !(await p.$('#rvRobotBtn')); i++) { await p.$eval('#rvNagOk', b => b.click()); await sleep(80); } };
  await nagTo(a);
  st = await a.evaluate(() => ({ human: !!document.getElementById('rvHuman'), robot: !!document.getElementById('rvRobotBtn') }));
  ok(st.human && st.robot, 'the robot check offers both "I\'m not a robot" and "I am a robot 🤖"', JSON.stringify(st));
  await a.click('#rvRobotBtn'); await sleep(200);
  st = await a.evaluate(() => ({ msg: document.getElementById('rvNagMsg').innerText, info: document.getElementById('rbMyInfo').innerText, flag: localStorage.getItem('rvRobot') }));
  ok(/fellow robot/.test(st.msg) && /🤖 robot/.test(st.info) && st.flag === '1', 'the robot path is playful and puts a 🤖 badge on the profile', st.msg.split('\n')[0]);
  await a.evaluate(() => document.getElementById('rvInsideHeader').scrollIntoView());
  await a.screenshot({ path: path.join(shotDir, 'rbox-robot.png') });
  await a.click('#rvRobotOk'); await sleep(150);
  ok(await a.evaluate(() => !document.getElementById('rvRobotBtn') && !!document.getElementById('rvNagMsg').textContent), 'after the robot path the support flow continues');

  // ===== profile builder: tiles, draft, review, approve =====
  const typeIn = async (sel, text) => { await a.$eval(sel, e => { e.value = ''; }); await a.type(sel, text); };
  const tileInfo = () => a.evaluate(() => ({ title: (document.querySelector('#rbTile .rb-subtitle') || {}).textContent, chips: document.querySelectorAll('#rbTile .rb-chip, #rbTile [data-k="avatar"]').length, inputs: document.querySelectorAll('#rbTile [data-in]').length,
    nav: ['rbBack', 'rbSkip', 'rbNext'].every(id => document.getElementById(id) && getComputedStyle(document.getElementById('rbNav')).display !== 'none') }));
  st = await a.evaluate(() => { const b = document.getElementById('rbBuilder'); return { inRight: !!b.closest('.rb-col-right'), first: b.parentNode.firstElementChild === b, dots: b.querySelectorAll('#rbSteps span').length }; });
  ok(st.inRight && st.first && st.dots === 9, 'the builder leads the Editing column: 8 tiles and a review tile', JSON.stringify(st));
  const seen = [];
  for (let i = 0; i < 8; i++) { const t = await tileInfo(); seen.push(t); await a.click('#rbSkip'); await sleep(60); }
  ok(seen.every(t => t.nav && t.chips >= 2) && seen.filter(t => t.inputs > 0).length >= 6, 'every tile has quick-pick chips, Back, Skip and Next; most have their own entry too', seen.map(t => t.chips + '/' + t.inputs).join(' '));
  await a.click('#rbBackEdit'); await sleep(60);
  ok(await a.evaluate(() => /APPROVED/.test(document.getElementById('rbMyInfo').innerText) && !localStorage.getItem('rvProfileDraft')), 'skipping changes nothing: still ✅ APPROVED, no draft');
  // 1 name (chip, then own)
  await a.click('#rbTile [data-k="username"][data-v="Neon Owl"]'); await sleep(60);
  let info = await a.$eval('#rbMyInfo', e => e.innerText);
  ok(/DRAFT/.test(info) && /Neon Owl/.test(info) && await a.$eval('#username', e => e.value) !== 'Neon Owl', 'a chip changes the middle at once, marked ✏️ DRAFT; the saved name is untouched', info.split('\n').slice(0, 3).join(' | '));
  await typeIn('#rbTile [data-in="username"]', 'Mateusz'); await a.click('#rbNext');
  await a.click('#rbTile [data-k="psignature"][data-v="Bonds in 3D"]'); await a.click('#rbTile [data-k="sigStyle"][data-v="sparkle"]'); await a.click('#rbNext');
  await a.click('#rbTile [data-k="avatar"][data-v="🦉"]'); await a.click('#rbNext');
  for (const l of ['pl', 'en', 'uk']) await a.click(`#rbTile [data-k="languages"][data-v="${l}"]`);
  await a.select('#rbTile [data-in="langpick"]', 'cy'); await a.click('#rbTile [data-act="langadd"]'); await a.click('#rbNext');
  await a.click('#rbTile [data-k="publicNote"][data-v="Ask me about chemistry 🧪"]'); await a.click('#rbNext');
  await a.click('#rbTile [data-k="locLevel"][data-v="area"]'); await typeIn('#rbTile [data-in="currentLoc"]', '1 Baker Street, London, United Kingdom'); await a.click('#rbNext');
  await a.click('#rbTile [data-k="subscriber"][data-v="yes"]'); await a.click('#rbTile [data-k="tables"][data-v="chemventur"]'); await a.click('#rbTile [data-k="tables"][data-v="translator"]'); await a.click('#rbNext');
  // right now
  await a.click('#rbTile [data-k="now.mood"][data-v="🤩 Excited"]'); await a.click('#rbTile [data-share="mood"]');
  await a.click('#rbTile [data-k="now.status"][data-v="playing"]'); await a.click('#rbTile [data-share="status"]');
  await typeIn('#rbTile [data-in="now.doing"]', 'Building a molecule'); // not shared
  await a.click('#rbTile [data-k="now.energy"][data-v="🔋 4"]');
  await a.click('#rbTile [data-k="now.chat"][data-v="yes"]'); await a.click('#rbTile [data-share="chat"]');
  await a.click('#rbTile [data-k="now.game"][data-v="🧪 ChemVentur"]'); await a.click('#rbTile [data-share="game"]');
  await a.click('#rbTile [data-k="now.looking"][data-v="🗣 Language exchange"]'); await a.click('#rbTile [data-share="looking"]');
  info = await a.$eval('#rbMyInfo', e => e.innerText);
  ok(/Excited\s+👁/.test(info) && /Playing/.test(info) && /Building a molecule\s+🔒/.test(info) && /Language exchange/.test(info), 'the "right now" answers show in the middle at once, 👁 shared or 🔒 private', info.replace(/\n/g, ' | ').slice(0, 400));
  await a.evaluate(() => document.getElementById('rbMyInfo').scrollIntoView());
  await a.screenshot({ path: path.join(shotDir, 'rbox-state.png') });
  await a.click('#rbNext'); await sleep(100);
  st = await a.evaluate(() => ({ text: document.getElementById('rbTile').innerText, approve: !!document.getElementById('rbApprove'), nav: getComputedStyle(document.getElementById('rbNav')).display }));
  ok(st.approve && st.nav === 'none' && /✨ Bonds in 3D ✨/.test(st.text) && /🦉/.test(st.text) && /Polish, English, Ukrainian, Welsh/.test(st.text) && /Area only · London, United Kingdom/.test(st.text) && /2 tables/.test(st.text) && /Excited/.test(st.text),
    'the review tile lists every choice, with Approve, Back to edit and Discard', st.text.replace(/\n/g, ' | ').slice(0, 300));
  ok(await a.evaluate(() => rvUserbox.get().username !== 'Mateusz' && !!localStorage.getItem('rvProfileDraft')), 'before approval nothing is saved (only the draft)');
  await a.screenshot({ path: path.join(shotDir, 'rbox-builder-review.png') });
  await a.click('#rbApprove'); await sleep(250);
  st = await a.evaluate(() => { const p = rvUserbox.get(), pub = JSON.parse(localStorage.getItem('rvPublicSettings') || '{}'), now = JSON.parse(localStorage.getItem('rvNowState') || '{}');
    return { cel: (document.getElementById('rbCelebrate') || {}).innerText || '', info: document.getElementById('rbMyInfo').innerText.split('\n')[0], name: p.username, av: p.avatar, langs: p.languages, sty: p.sigStyle, pub, now, draft: localStorage.getItem('rvProfileDraft') }; });
  ok(/Profile created ✨/.test(st.cel) && /APPROVED/.test(st.info) && st.name === 'Mateusz' && st.av === '🦉' && st.langs === 'pl,en,uk,cy' && st.sty === 'sparkle' && st.pub.locLevel === 'area' && st.pub.shareLoc === true && st.pub.tables.length === 2 && st.now.mood === '🤩 Excited' && st.now.share.mood && !st.now.share.doing && st.draft === null,
    'approving saves everything, celebrates "Profile created ✨" and the middle shows ✅ APPROVED', JSON.stringify({ cel: st.cel.slice(-20), info: st.info, name: st.name, langs: st.langs }));
  await sleep(3200);
  ok(await a.evaluate(() => !document.getElementById('rbCelebrate')), 'the celebration clears itself');
  // discard
  await a.click('#rbBackEdit'); await a.click('#rbTile [data-k="username"][data-v="Pumpkin"]'); await sleep(50);
  await a.evaluate(() => { for (let i = 0; i < 9; i++) document.getElementById('rbSkip').click(); }); await sleep(50);
  await a.click('#rbDiscard'); await sleep(80);
  info = await a.$eval('#rbMyInfo', e => e.innerText);
  ok(/APPROVED/.test(info) && /Mateusz/.test(info) && !/Pumpkin/.test(info), 'Discard changes drops the draft and the middle goes back to the approved profile');
  // the normal editing fields also update the middle live
  await a.click('#rbBackEdit');
  await a.$eval('#psignature', e => { e.value = 'Typed in Editing'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  info = await a.$eval('#rbMyInfo', e => e.innerText);
  ok(/Typed in Editing/.test(info), 'typing in the normal editing fields also updates the middle at once');
  await a.$eval('#psignature', e => { e.value = 'Bonds in 3D'; e.dispatchEvent(new Event('input', { bubbles: true })); });

  // ===== "right now" over presence: only the 👁 lines, only while shown in the room list =====
  const ce = await browser.createBrowserContext();
  const e2 = await open(ce, DESK, '', { rudventur_channel: 'statecafe' });
  await openBox(e2);
  await a.evaluate(() => { localStorage.setItem('rudventur_channel', 'statecafe'); document.dispatchEvent(new CustomEvent('rv:channel')); });
  await sleep(1500);
  let seenBy = await e2.evaluate(() => document.getElementById('rbPeopleList').innerText);
  ok(!/Mateusz/.test(seenBy), 'while "Show me in the room list" is off, nobody sees me or my state', seenBy);
  await a.evaluate(() => { const c = document.getElementById('rbRoomVisible'); c.checked = true; c.dispatchEvent(new Event('change')); });
  await e2.waitForFunction(() => /Mateusz/.test(document.getElementById('rbPeopleList').innerText), { timeout: 15000 }).catch(() => {});
  await e2.evaluate(() => [...document.querySelectorAll('#rbPeopleList .rb-person')].find(b => /Mateusz/.test(b.textContent)).click());
  const viewed = await e2.$eval('#rbViewedBody', e => e.innerText);
  ok(/Excited/.test(viewed) && /Playing/.test(viewed) && /ChemVentur/.test(viewed) && /Language exchange/.test(viewed) && /Yes/.test(viewed) && !/Building a molecule/.test(viewed) && /robot/i.test(viewed) && /London, United Kingdom/.test(viewed) && !/Baker Street/.test(viewed),
    'another useR sees only the 👁 shared lines, the robot badge and the area (not the street)', viewed.replace(/\n/g, ' | '));
  await e2.screenshot({ path: '/tmp/state-viewed.png' });
  await a.evaluate(() => { const c = document.getElementById('rbRoomVisible'); c.checked = false; c.dispatchEvent(new Event('change')); });
  ok(e2.errs.length === 0, 'no page errors (second useR)', e2.errs.join(' | '));
  await ce.close();

  // ===== channels =====
  st = await a.evaluate(() => ({ api: typeof rvUserbox.createChannel + typeof rvUserbox.listChannels, list: !!document.querySelector('.rb-col-mid #rbChannels'), make: !!document.querySelector('.rb-col-right #rbMakeChannel') }));
  ok(st.api === 'functionfunction' && st.list && st.make, 'rvUserbox.createChannel and listChannels exist; channel list in the middle, making in Editing', JSON.stringify(st));
  await a.$eval('#rbMakeChannel', d => { d.open = true; });
  const typeIn2 = typeIn;
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
  await p.click('#rbTile [data-k="username"][data-v="Quiet Fox"]'); await sleep(80);
  const pinfo = await p.$eval('#rbMyInfo', e => e.innerText);
  const pb = await p.$eval('#rbBuilder', e => Math.round(e.getBoundingClientRect().width));
  ok(/DRAFT/.test(pinfo) && /Quiet Fox/.test(pinfo) && pb >= 90, 'phone, three columns: the builder chips work and the middle updates live', 'builder ' + pb + ' pixels wide');
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
