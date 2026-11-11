// Restaurant, free table and "right to remain" rules (restaurants/<owner>, freeTables/<uid>), run against the database emulator.
//   every subscriber gets a restaurant · every free useR gets one free table, no restaurant ·
//   open restaurant = anyone may sit · closed = only invited guests may stay · only the owner opens, closes and invites.
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { ref, set, update, get, remove, serverTimestamp } from 'firebase/database';
import fs from 'fs';
const rulesText = fs.readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8');
const env = await initializeTestEnvironment({ projectId: 'demo-popcoin', database: { rules: rulesText, host: '127.0.0.1', port: 9000 } });
const db = uid => env.authenticatedContext(uid).database();
const anon = env.unauthenticatedContext().database();
const TS = serverTimestamp();
let pass = 0, fail = 0;
async function t(name, expectOk, fn) {
  try { await (expectOk ? assertSucceeds : assertFails)(fn()); pass++; console.log('  ok  ', name); }
  catch (e) { fail++; console.log('  FAIL', name, '->', (e.message || '').split('\n')[0].slice(0, 160)); }
}
const ok = (c, name) => { c ? pass++ : fail++; console.log((c ? '  ok  ' : '  FAIL'), name); };
await env.clearDatabase();
const R = 'restaurants/alice';
const info = open => ({ name: 'Alice', open, sub: true, room: 'main', updated: TS, tables: { translator: true, chemventur: true } });
const seat = (name, extra) => ({ name, at: TS, ...extra });

console.log('# opening (only the owner, only as a subscriber)');
await t('subscriber opens her restaurant', true, () => set(ref(db('alice'), R + '/info'), info(true)));
await t('a free useR cannot own a restaurant (sub must be true)', false, () => set(ref(db('bob'), 'restaurants/bob/info'), { ...info(true), name: 'Bob', sub: false }));
await t('someone else cannot open or close it', false, () => update(ref(db('mallory'), R + '/info'), { open: false }));
await t('someone else cannot add a table', false, () => set(ref(db('mallory'), R + '/info/tables/punk-script'), true));
await t('unknown restaurant field', false, () => set(ref(db('alice'), R + '/info'), { ...info(true), secret: 'x' }));
await t('anything else under a restaurant is refused', false, () => set(ref(db('alice'), R + '/menu'), 'x'));
await t('signed-in useRs read the restaurant sign', true, () => get(ref(db('bob'), R + '/info')));
await t('signed-out visitors do not', false, () => get(ref(anon, R + '/info')));

console.log('# free tables (one each)');
const ft = { name: 'Bob', service: 'map-merger', label: 'Maps corner' };
await t('free useR makes his one free table', true, () => set(ref(db('bob'), 'freeTables/bob'), ft));
await t('a second free table is refused (no extra keys)', false, () => set(ref(db('bob'), 'freeTables/bob/second'), ft));
await t('cannot make a free table for someone else', false, () => set(ref(db('bob'), 'freeTables/carol'), ft));
await t('bad service id', false, () => set(ref(db('bob'), 'freeTables/bob'), { ...ft, service: 'BAD ID!' }));
await t('free table cannot be pulled up at a restaurant that does not exist', false, () => update(ref(db('bob'), 'freeTables/bob'), { at: 'nobody' }));
await t('pull up the free table at the open restaurant (one update)', true, () => update(ref(db('bob')), { 'freeTables/bob/at': 'alice', [R + '/seats/bob']: seat('Bob', { free: true }) }));
await set(ref(db('dave'), 'restaurants/dave/info'), { ...info(true), name: 'Dave' }).catch(() => {});
await t('the same free table cannot also sit at a second restaurant', false, () => set(ref(db('bob'), 'restaurants/dave/seats/bob'), seat('Bob', { free: true })));
await t('a seat with a free table I do not have is refused', false, () => set(ref(db('carol'), R + '/seats/carol'), seat('Carol', { free: true })));
await t('a seat must be either a table or a free table, not both', false, () => set(ref(db('carol'), R + '/seats/carol'), seat('Carol', { table: 'translator', free: true })));
await t('a table the restaurant does not serve', false, () => set(ref(db('carol'), R + '/seats/carol'), seat('Carol', { table: 'weather' })));

console.log('# while open: free useRs can enter and stay');
await t('Carol sits at the translator table', true, () => set(ref(db('carol'), R + '/seats/carol'), seat('Carol', { table: 'translator' })));
await t('Erin sits at the chemventur table', true, () => set(ref(db('erin'), R + '/seats/erin'), seat('Erin', { table: 'chemventur' })));
await t('nobody can seat someone else', false, () => set(ref(db('mallory'), R + '/seats/carol'), seat('Evil', { table: 'translator' })));
await t('anyone signed in reads who sits in an open restaurant', true, () => get(ref(db('mallory'), R + '/seats')));
await t('seats are not readable signed out', false, () => get(ref(anon, R + '/seats')));

console.log('# invites (only the owner)');
await t('owner invites Carol', true, () => set(ref(db('alice'), R + '/invites/carol'), { name: 'Carol', at: TS }));
await t('someone else cannot invite', false, () => set(ref(db('mallory'), R + '/invites/mallory'), { name: 'Mallory', at: TS }));
await t('a guest cannot invite herself', false, () => set(ref(db('carol'), R + '/invites/erin'), { name: 'Erin', at: TS }));
await t('owner cannot invite herself', false, () => set(ref(db('alice'), R + '/invites/alice'), { name: 'Alice', at: TS }));
await t('owner reads the whole invite list', true, () => get(ref(db('alice'), R + '/invites')));
await t('Carol reads her own invite', true, () => get(ref(db('carol'), R + '/invites/carol')));
await t('others cannot read the invite list', false, () => get(ref(db('erin'), R + '/invites')));
await t('others cannot read someone else\'s invite', false, () => get(ref(db('erin'), R + '/invites/carol')));

console.log('# closing: ordinary visitors out, invited guests keep the right to remain');
await t('only the owner closes it', true, () => update(ref(db('alice'), R + '/info'), { open: false, updated: TS }));
await t('owner moves the uninvited visitors out (Bob and Erin)', true, () => update(ref(db('alice')), { [R + '/seats/bob']: null, [R + '/seats/erin']: null }));
await t('owner cannot seat someone (only remove)', false, () => set(ref(db('alice'), R + '/seats/erin'), seat('Erin', { table: 'translator' })));
await t('invited Carol still reads the closed restaurant', true, () => get(ref(db('carol'), R + '/seats')));
const left = (await get(ref(db('alice'), R + '/seats'))).val() || {};
ok(Object.keys(left).join(',') === 'carol', 'after closing only invited Carol is still seated');
await t('invited Carol stays seated (changes table)', true, () => set(ref(db('carol'), R + '/seats/carol'), seat('Carol', { table: 'chemventur' })));
await t('uninvited Erin cannot sit back down while closed', false, () => set(ref(db('erin'), R + '/seats/erin'), seat('Erin', { table: 'translator' })));
await t('uninvited Bob cannot pull his free table back up while closed', false, () => set(ref(db('bob'), R + '/seats/bob'), seat('Bob', { free: true })));
await t('uninvited Erin cannot read the closed restaurant', false, () => get(ref(db('erin'), R + '/seats')));
await t('the owner still reads her closed restaurant', true, () => get(ref(db('alice'), R + '/seats')));
await t('a visitor can always leave (remove own seat)', true, () => remove(ref(db('erin'), R + '/seats/erin')));
await t('Bob takes his free table home', true, () => update(ref(db('bob'), 'freeTables/bob'), { at: null }));

console.log('# uninvite');
await t('someone else cannot uninvite Carol', false, () => remove(ref(db('mallory'), R + '/invites/carol')));
await t('Carol cannot change her own invite', false, () => set(ref(db('carol'), R + '/invites/carol'), { name: 'Carol!', at: TS }));
await t('owner uninvites Carol', true, () => remove(ref(db('alice'), R + '/invites/carol')));
await t('uninvited Carol can no longer read the closed restaurant', false, () => get(ref(db('carol'), R + '/seats')));
await t('uninvited Carol can no longer stay (cannot rewrite her seat)', false, () => set(ref(db('carol'), R + '/seats/carol'), seat('Carol', { table: 'translator' })));
await t('owner moves Carol out', true, () => remove(ref(db('alice'), R + '/seats/carol')));

console.log('# reopening');
await t('owner opens again', true, () => update(ref(db('alice'), R + '/info'), { open: true, updated: TS }));
await t('free useR Bob pulls his table up again', true, () => update(ref(db('bob')), { 'freeTables/bob/at': 'alice', [R + '/seats/bob']: seat('Bob', { free: true }) }));
await t('what onDisconnect writes: owner closes on going offline', true, () => update(ref(db('alice'), R + '/info'), { open: false, updated: TS }));

console.log('# the two rules files stay in step');
const a = JSON.parse(rulesText).rules, b = JSON.parse(fs.readFileSync(new URL('../../firebase/presence.rules.json', import.meta.url), 'utf8')).rules;
ok(['presence', 'restaurants', 'freeTables'].every(k => JSON.stringify(a[k]) === JSON.stringify(b[k])), 'popcoin/database.rules.json and firebase/presence.rules.json match for presence, restaurants and freeTables');

await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
