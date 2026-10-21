// Global chat (chat/<room>) and RudVentur Social profiles (rudventur-social/profiles), run against the database emulator.
//   cd popcoin && npx firebase emulators:exec --only database --project demo-popcoin "node tests/chat-social.rules.test.mjs"
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { ref, set, push, get, remove, serverTimestamp } from 'firebase/database';
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
const msg = (uid, extra = {}) => ({ name: 'Rudy', text: 'hello world', ts: TS, uid, ...extra });
await t('signed-in useR posts in the global chat', true, () => set(ref(db('alice'), 'chat/global/m1'), msg('alice')));
await t('signed-in useR reads the chat', true, () => get(ref(db('bob'), 'chat/global')));
await t('signed-out visitor cannot read the chat', false, () => get(ref(anon, 'chat/global')));
await t('signed-out visitor cannot post', false, () => set(ref(anon, 'chat/global/m2'), msg('nobody')));
await t('post as someone else', false, () => set(ref(db('bob'), 'chat/global/m3'), msg('alice')));
await t('edit someone else\'s message', false, () => set(ref(db('bob'), 'chat/global/m1/text'), 'changed'));
await t('edit my own message (messages are final)', false, () => set(ref(db('alice'), 'chat/global/m1/text'), 'changed'));
await t('delete a message', false, () => remove(ref(db('alice'), 'chat/global/m1')));
await t('text too long (501)', false, () => set(ref(db('alice'), 'chat/global/m4'), msg('alice', { text: 'x'.repeat(501) })));
await t('empty text', false, () => set(ref(db('alice'), 'chat/global/m5'), msg('alice', { text: '' })));
await t('timestamp in the past', false, () => set(ref(db('alice'), 'chat/global/m6'), msg('alice', { ts: 1000 })));
await t('extra field', false, () => set(ref(db('alice'), 'chat/global/m7'), msg('alice', { html: '<b>' })));
await t('bad room name', false, () => set(ref(db('alice'), 'chat/Bad Room/m8'), msg('alice')));
await t('push to another room', true, () => push(ref(db('alice'), 'chat/prompter'), msg('alice')));
const prof = (extra = {}) => ({ type: 'human', name: 'Rudy', bio: 'hi', avatarMode: 'emoji', avatarEmoji: '😀', avatarUrl: '', created: Date.now(), updated: TS, ...extra });
await t('save my own social profile', true, () => set(ref(db('alice'), 'rudventur-social/profiles/alice'), prof()));
await t('anyone (even signed out) reads profiles', true, () => get(ref(anon, 'rudventur-social/profiles/alice')));
await t('list recent profiles', true, () => get(ref(anon, 'rudventur-social/profiles')));
await t('write someone else\'s profile', false, () => set(ref(db('bob'), 'rudventur-social/profiles/alice'), prof()));
await t('signed out cannot save', false, () => set(ref(anon, 'rudventur-social/profiles/x'), prof()));
await t('profile without a name', false, () => set(ref(db('bob'), 'rudventur-social/profiles/bob'), prof({ name: '' })));
await t('field too long (2001)', false, () => set(ref(db('bob'), 'rudventur-social/profiles/bob'), prof({ bio: 'x'.repeat(2001) })));
await t('nested object field', false, () => set(ref(db('bob'), 'rudventur-social/profiles/bob'), prof({ bio: { a: 1 } })));
await t('presence rules still work', true, () => set(ref(db('alice'), 'presence/rooms/main/alice'), { name: 'alice', online: true, lastSeen: TS }));
await t('popcoin balances still private', false, () => get(ref(db('bob'), 'popcoin/users/alice')));
await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
