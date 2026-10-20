// Channel rules (channels/public, channels/private, channels/mine), run against the database emulator.
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { ref, set, update, get, remove, serverTimestamp } from 'firebase/database';
import fs from 'fs';
const env = await initializeTestEnvironment({ projectId: 'demo-popcoin', database: { rules: fs.readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8'), host: '127.0.0.1', port: 9000 } });
await env.clearDatabase();
const db = uid => env.authenticatedContext(uid).database();
const anon = env.unauthenticatedContext().database();
const TS = serverTimestamp();
let pass = 0, fail = 0;
async function t(name, expectOk, fn) {
  try { await (expectOk ? assertSucceeds : assertFails)(fn()); pass++; console.log('  ok  ', name); }
  catch (e) { fail++; console.log('  FAIL', name, '->', (e.message || '').split('\n')[0].slice(0, 160)); }
}
const make = (uid, kind, id, extra = {}) => update(ref(db(uid)), { [`channels/${kind}/${id}`]: { name: 'Night owls', desc: 'late talk', owner: uid, created: TS, ...extra }, [`channels/mine/${uid}/${id}`]: kind });
await t('make a public channel (with my list entry)', true, () => make('alice', 'public', 'night-owls-ab12c'));
await t('make a private channel', true, () => make('alice', 'private', 'secret-x1y2z', { desc: '' }));
await t('signed-in useR lists public channels', true, () => get(ref(db('bob'), 'channels/public')));
await t('signed-out visitor lists public channels', false, () => get(ref(anon, 'channels/public')));
await t('nobody can list private channels', false, () => get(ref(db('bob'), 'channels/private')));
await t('a share link opens one private channel', true, () => get(ref(db('bob'), 'channels/private/secret-x1y2z')));
await t('read my own channel list', true, () => get(ref(db('alice'), 'channels/mine/alice')));
await t('read someone else\'s channel list', false, () => get(ref(db('bob'), 'channels/mine/alice')));
await t('owner changes the description', true, () => set(ref(db('alice'), 'channels/public/night-owls-ab12c/desc'), 'new words'));
await t('someone else changes it', false, () => set(ref(db('bob'), 'channels/public/night-owls-ab12c/desc'), 'hacked'));
await t('someone else overwrites the channel', false, () => set(ref(db('bob'), 'channels/public/night-owls-ab12c'), { name: 'mine now', owner: 'bob', created: TS }));
await t('owner hands it to someone else', false, () => set(ref(db('alice'), 'channels/public/night-owls-ab12c/owner'), 'bob'));
await t('create with someone else as owner', false, () => set(ref(db('bob'), 'channels/public/fake-owner1'), { name: 'x', owner: 'alice', created: TS }));
await t('name too long (41)', false, () => make('bob', 'public', 'long-name1', { name: 'x'.repeat(41) }));
await t('empty name', false, () => make('bob', 'public', 'empty-name1', { name: '' }));
await t('description too long (201)', false, () => make('bob', 'public', 'long-desc1', { desc: 'x'.repeat(201) }));
await t('bad channel id (capitals and spaces)', false, () => make('bob', 'public', 'Bad Id!'));
await t('channel id too short', false, () => make('bob', 'public', 'ab'));
await t('extra field', false, () => make('bob', 'public', 'extra-field1', { lat: 1 }));
await t('created in the past (not now)', false, () => make('bob', 'public', 'old-time1', { created: 1000 }));
await t('same id public and private', false, () => make('bob', 'private', 'night-owls-ab12c'));
await t('list entry for a channel I do not own', false, () => set(ref(db('bob'), 'channels/mine/bob/night-owls-ab12c'), 'public'));
await t('list entry in someone else\'s list', false, () => set(ref(db('bob'), 'channels/mine/alice/zzz-123'), 'public'));
await t('someone else deletes the channel', false, () => remove(ref(db('bob'), 'channels/public/night-owls-ab12c')));
await t('owner deletes the channel and its list entry', true, () => update(ref(db('alice')), { 'channels/public/night-owls-ab12c': null, 'channels/mine/alice/night-owls-ab12c': null }));
await t('presence rules still work', true, () => set(ref(db('alice'), 'presence/rooms/secret-x1y2z/alice'), { name: 'alice', online: true, lastSeen: TS }));
await t('popcoin balances still private', false, () => get(ref(db('bob'), 'popcoin/users/alice')));
await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
