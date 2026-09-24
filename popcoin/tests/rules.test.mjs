import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { ref, set, update, get, serverTimestamp } from 'firebase/database';
import fs from 'fs';
const env = await initializeTestEnvironment({ projectId: 'demo-popcoin', database: { rules: fs.readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8'), host: '127.0.0.1', port: 9000 } });
const db = uid => env.authenticatedContext(uid).database();
const anon = env.unauthenticatedContext().database();
const TS = serverTimestamp();
let pass = 0, fail = 0;
async function t(name, expectOk, fn) {
  try { await (expectOk ? assertSucceeds : assertFails)(fn()); pass++; console.log('  ok  ', name); }
  catch (e) { fail++; console.log('  FAIL', name, '->', (e.message || '').split('\n')[0].slice(0, 160)); }
}
const seed = async (path, val) => env.withSecurityRulesDisabled(async c => set(ref(c.database(), path), val));
const bal = async uid => { let v; await env.withSecurityRulesDisabled(async c => { v = (await get(ref(c.database(), `popcoin/users/${uid}/balance`))).val(); }); return v; };
const newUser = (d, uid, name, balance = 1000) => update(ref(d), { [`popcoin/names/${name}`]: uid, [`popcoin/users/${uid}`]: { name, balance, minedAt: TS, lastTx: '' } });

console.log('— accounts');
await t('create account with 10 PopCOIN welcome bonus', true, () => newUser(db('alice'), 'alice', 'alice'));
await t('create account with more than the bonus', false, () => newUser(db('mallory'), 'mallory', 'mallory', 999999));
await t('take a name someone else owns', false, () => newUser(db('mallory'), 'mallory', 'alice'));
await t('create someone else\'s account', false, () => newUser(db('mallory'), 'bob', 'bobby'));
await t('signed-out visitor creates account', false, () => newUser(anon, 'x', 'xxx'));
await t('bad name characters', false, () => newUser(db('carol'), 'carol', 'Carol!!'));
await t('bob creates account', true, () => newUser(db('bob'), 'bob', 'bob'));
await t('read own account', true, () => get(ref(db('alice'), 'popcoin/users/alice')));
await t('read someone else\'s account', false, () => get(ref(db('mallory'), 'popcoin/users/alice')));
await t('look up names (to send)', true, () => get(ref(db('alice'), 'popcoin/names/bob')));

console.log('— cheating on balance');
await t('set own balance to a million', false, () => set(ref(db('alice'), 'popcoin/users/alice/balance'), 1000000));
await t('rewrite whole account with big balance', false, () => set(ref(db('alice'), 'popcoin/users/alice'), { name: 'alice', balance: 50000, minedAt: TS, lastTx: '' }));
await t('extra junk field', false, () => update(ref(db('alice'), 'popcoin/users/alice'), { vip: true }));

console.log('— mining (2 pips/sec, max 6 PopCOIN per claim)');
await seed('popcoin/users/alice/minedAt', Date.now() - 60000);   // 60 s ago
await t('claim 1.20 PopCOIN after 60 s (allowed)', true, () => update(ref(db('alice'), 'popcoin/users/alice'), { balance: 1120, minedAt: TS }));
await seed('popcoin/users/alice/minedAt', Date.now() - 10000);   // 10 s ago
await t('claim 5 PopCOIN after 10 s (too fast)', false, () => update(ref(db('alice'), 'popcoin/users/alice'), { balance: 1620, minedAt: TS }));
await seed('popcoin/users/alice/minedAt', Date.now() - 3600000); // 1 h ago
await t('claim 10 PopCOIN in one go (over the cap)', false, () => update(ref(db('alice'), 'popcoin/users/alice'), { balance: 2120, minedAt: TS }));
await t('claim with a fake old timestamp', false, () => update(ref(db('alice'), 'popcoin/users/alice'), { balance: 1500, minedAt: Date.now() - 1 }));
await t('claim 6 PopCOIN after 1 h (cap, allowed)', true, () => update(ref(db('alice'), 'popcoin/users/alice'), { balance: 1720, minedAt: TS }));
console.log('     alice balance:', await bal('alice'));

console.log('— sending');
const send = (d, from, to, tx, amount, newBal, extra = {}) => update(ref(d), {
  [`popcoin/users/${from}/balance`]: newBal, [`popcoin/users/${from}/lastTx`]: tx,
  [`popcoin/outbox/${from}/${tx}`]: { to, amount, at: TS },
  [`popcoin/inbox/${to}/${tx}`]: { from, amount, at: TS, claimed: false, fromName: from, ...extra } });
await t('alice sends bob 2.00', true, () => send(db('alice'), 'alice', 'bob', 'tx1', 200, 1520));
await t('send but keep the money (balance not reduced)', false, () => send(db('alice'), 'alice', 'bob', 'tx2', 200, 1520));
await t('send 5 but only take off 1', false, () => send(db('alice'), 'alice', 'bob', 'tx3', 500, 1420));
await t('inbox says more than outbox', false, () => update(ref(db('alice')), { 'popcoin/users/alice/balance': 1420, 'popcoin/users/alice/lastTx': 'tx4', 'popcoin/outbox/alice/tx4': { to: 'bob', amount: 100, at: TS }, 'popcoin/inbox/bob/tx4': { from: 'alice', amount: 9999, at: TS, claimed: false } }));
await t('send more than you have', false, () => send(db('alice'), 'alice', 'bob', 'tx5', 999999, 0));
await t('reuse an old transaction id', false, () => send(db('alice'), 'alice', 'bob', 'tx1', 100, 1420));
await t('send to yourself', false, () => send(db('alice'), 'alice', 'alice', 'tx6', 100, 1420));
await t('forge a payment "from" bob', false, () => set(ref(db('mallory'), 'popcoin/inbox/mallory/fake'), { from: 'bob', amount: 500, at: TS, claimed: false }));
await t('outbox + inbox without touching balance', false, () => update(ref(db('alice')), { 'popcoin/users/alice/lastTx': 'tx7', 'popcoin/outbox/alice/tx7': { to: 'bob', amount: 100, at: TS }, 'popcoin/inbox/bob/tx7': { from: 'alice', amount: 100, at: TS, claimed: false } }));
console.log('     alice:', await bal('alice'), ' bob:', await bal('bob'));

console.log('— receiving');
const claim = (d, uid, tx, newBal) => update(ref(d), { [`popcoin/inbox/${uid}/${tx}/claimed`]: true, [`popcoin/users/${uid}/balance`]: newBal, [`popcoin/users/${uid}/lastTx`]: '~' + tx });
await t('bob reads his inbox', true, () => get(ref(db('bob'), 'popcoin/inbox/bob')));
await t('mallory reads bob\'s inbox', false, () => get(ref(db('mallory'), 'popcoin/inbox/bob')));
await t('bob claims more than was sent', false, () => claim(db('bob'), 'bob', 'tx1', 1500));
await t('mallory claims bob\'s payment', false, () => claim(db('mallory'), 'bob', 'tx1', 1200));
await t('bob claims 2.00', true, () => claim(db('bob'), 'bob', 'tx1', 1200));
await t('bob claims the same payment twice', false, () => update(ref(db('bob')), { 'popcoin/users/bob/balance': 1400, 'popcoin/users/bob/lastTx': '~tx1' }));
await t('bob un-claims to claim again', false, () => set(ref(db('bob'), 'popcoin/inbox/bob/tx1/claimed'), false));
await t('alice edits the payment after sending', false, () => set(ref(db('alice'), 'popcoin/inbox/bob/tx1/amount'), 1));
console.log('     alice:', await bal('alice'), ' bob:', await bal('bob'), '(total should be 1520+1200 = 2720)');

console.log(`\n${pass} passed, ${fail} failed`);
await env.cleanup(); process.exit(fail ? 1 : 0);
