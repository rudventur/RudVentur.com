// Presence and restaurant rules (presence/rooms/<room>/<uid>), run against the database emulator.
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { ref, set, update, get, remove, serverTimestamp } from 'firebase/database';
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
const me = { name: 'alice', online: true, lastSeen: TS, ps: 'hi', note: 'public', sub: true, rest: { open: true, tables: { translator: true, chemventur: true } } };
await t('show myself in a room', true, () => set(ref(db('alice'), 'presence/rooms/main/alice'), me));
await t('read who is in the room', true, () => get(ref(db('bob'), 'presence/rooms/main')));
await t('signed-out visitor reads the room', false, () => get(ref(anon, 'presence/rooms/main')));
await t('write someone else', false, () => set(ref(db('mallory'), 'presence/rooms/main/alice'), { ...me, name: 'evil' }));
await t('extra private field (lat)', false, () => set(ref(db('alice'), 'presence/rooms/main/alice'), { ...me, lat: '1' }));
await t('missing name', false, () => set(ref(db('alice'), 'presence/rooms/main/alice'), { online: true, lastSeen: TS }));
await t('last seen in the future', false, () => set(ref(db('alice'), 'presence/rooms/main/alice'), { ...me, lastSeen: Date.now() + 864e5 }));
await t('bad room name', false, () => set(ref(db('alice'), 'presence/rooms/Bad Room!/alice'), me));
await t('bad table id', false, () => set(ref(db('alice'), 'presence/rooms/main/alice/rest/tables/BAD!'), true));
await t('too long note', false, () => update(ref(db('alice'), 'presence/rooms/main/alice'), { note: 'x'.repeat(301) }));
await t('go offline (what onDisconnect writes)', true, () => update(ref(db('alice'), 'presence/rooms/main/alice'), { online: false, lastSeen: TS }));
await t('leave the room', true, () => remove(ref(db('alice'), 'presence/rooms/main/alice')));
const nowOk = { mood: '😀 Happy', status: 'playing', doing: '🎮 Gaming', energy: '🔋 4', chat: true, game: '🧪 ChemVentur', looking: '🤝 New friends' };
await t('share "right now" lines and the robot badge', true, () => set(ref(db('alice'), 'presence/rooms/main/alice'), { ...me, now: nowOk, robot: true }));
await t('share only some "right now" lines', true, () => set(ref(db('alice'), 'presence/rooms/main/alice'), { ...me, now: { mood: '😌 Calm' } }));
await t('unknown status', false, () => set(ref(db('alice'), 'presence/rooms/main/alice'), { ...me, now: { status: 'sleeping' } }));
await t('mood too long (25)', false, () => set(ref(db('alice'), 'presence/rooms/main/alice'), { ...me, now: { mood: 'x'.repeat(25) } }));
await t('doing too long (61)', false, () => set(ref(db('alice'), 'presence/rooms/main/alice'), { ...me, now: { doing: 'x'.repeat(61) } }));
await t('looking for too long (61)', false, () => set(ref(db('alice'), 'presence/rooms/main/alice'), { ...me, now: { looking: 'x'.repeat(61) } }));
await t('game too long (41)', false, () => set(ref(db('alice'), 'presence/rooms/main/alice'), { ...me, now: { game: 'x'.repeat(41) } }));
await t('energy too long (13)', false, () => set(ref(db('alice'), 'presence/rooms/main/alice'), { ...me, now: { energy: 'x'.repeat(13) } }));
await t('open to chat must be yes or no (true or false)', false, () => set(ref(db('alice'), 'presence/rooms/main/alice'), { ...me, now: { chat: 'maybe' } }));
await t('empty mood', false, () => set(ref(db('alice'), 'presence/rooms/main/alice'), { ...me, now: { mood: '' } }));
await t('unknown "right now" field', false, () => set(ref(db('alice'), 'presence/rooms/main/alice'), { ...me, now: { secret: 'x' } }));
await t('robot must be true or false', false, () => set(ref(db('alice'), 'presence/rooms/main/alice'), { ...me, robot: 'beep' }));
await t('someone else writes my "right now"', false, () => set(ref(db('mallory'), 'presence/rooms/main/alice/now'), { mood: 'evil' }));
await t('read popcoin balances still private', false, () => get(ref(db('bob'), 'popcoin/users/alice')));
await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
