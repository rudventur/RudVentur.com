/* Headless-Chrome test for the left section slot of the useRbox (no database needed).
     python3 -m http.server 8765   (from the repository root), then
     node embed/tests/useRbox-left-headless.js http://localhost:8765/
   Checks: the page's own panel is moved into the left section and keeps working, the current
   service is marked in the shop, setLeft replaces and clears the slot, open() opens the box,
   and the middle and right sections are the same as on the plain test page. */
'use strict';
const puppeteer = require('puppeteer-core');
const base = process.argv[2] || 'http://localhost:8765/';
let pass = 0, fail = 0;
const ok = (c, m, x) => { c ? pass++ : fail++; console.log((c ? '  ✅ ' : '  ❌ ') + m + (x ? '  ' + x : '')); };
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
  const open = async (path) => {
    const page = await browser.newPage(); page.errs = [];
    page.on('pageerror', e => page.errs.push(e.message));
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(base + path, { waitUntil: 'load' });
    await page.waitForFunction(() => window.rvUserbox && window.rvUserbox.leftSlot);
    await page.evaluate(() => window.rvUserbox.fakePop.loaded);
    return page;
  };
  const shape = (p) => p.evaluate(() => ({
    mid: [...document.querySelectorAll('.rb-col-mid [id]')].map(e => e.id).join(','),
    right: [...document.querySelectorAll('.rb-col-right [id]')].map(e => e.id).join(',') }));
  const plain = await open('embed/tests/useRbox-test.html');
  const p = await open('embed/tests/useRbox-left-test.html');
  const r = await p.evaluate(() => {
    const slot = document.getElementById('rbLeftSlot');
    return { inSlot: slot.contains(document.getElementById('myPanel')), shown: !slot.hidden,
      inLeft: document.querySelector('.rb-col-left').contains(slot),
      title: document.getElementById('rbLeftSlotTitle').textContent,
      here: [...document.querySelectorAll('#rbShopList .rb-here')].length, service: rvUserbox.service };
  });
  ok(r.inSlot && r.shown && r.inLeft, 'data-left moves the page panel into the left section', JSON.stringify(r));
  ok(r.title === '🪟 TEST SERVICE', 'data-left-title names the slot');
  ok(r.here === 1 && r.service === 'windows13', 'data-service marks the current service in the shop');
  await p.evaluate(() => rvUserbox.open('left'));
  await p.click('#myBtn');
  ok(await p.$eval('#myCount', e => e.textContent) === '1', 'the moved panel keeps its own click handler');
  ok(await p.evaluate(() => !document.getElementById('useRbox').classList.contains('hidden')), 'rvUserbox.open() opens the box');
  await p.evaluate(() => rvUserbox.setLeft('<b id="x">hello</b>', { title: 'OTHER' }));
  ok(await p.evaluate(() => !!document.querySelector('#rbLeftSlotBody #x') && document.getElementById('rbLeftSlotTitle').textContent === 'OTHER'), 'setLeft(html) replaces the slot');
  await p.evaluate(() => rvUserbox.setLeft(null));
  ok(await p.evaluate(() => document.getElementById('rbLeftSlot').hidden), 'setLeft(null) clears it, the shop stays');
  ok(await p.evaluate(() => document.querySelectorAll('#rbShopList .rb-shop-item').length > 10), 'the shop is still in the left section');
  const a = await shape(plain), b = await shape(p);
  ok(a.mid === b.mid && a.right === b.right && a.mid.length > 0, 'middle and right sections are identical to the plain page');
  p.evaluate(() => rvUserbox.close());
  ok(await p.evaluate(() => document.getElementById('useRbox').classList.contains('hidden')), 'rvUserbox.close() closes it');
  ok(!p.errs.length && !plain.errs.length, 'no page errors', JSON.stringify(p.errs.concat(plain.errs)));
  console.log(pass + ' passed, ' + fail + ' failed');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
