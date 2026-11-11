// Public profiles and pets rules (profiles/<account>, profiles/<account>/pets/<pet>), run against the database emulator.
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { ref, set, update, get, remove, push, serverTimestamp } from 'firebase/database';
import fs from 'fs';
const env = await initializeTestEnvironment({ projectId: 'demo-popcoin', database: { rules: fs.readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8'), host: '127.0.0.1', port: 9000 } });
const as = (uid, provider = 'google.com') => env.authenticatedContext(uid, { firebase: { sign_in_provider: provider } }).database();
const anon = env.unauthenticatedContext().database();
const TS = serverTimestamp();
let pass = 0, fail = 0;
async function t(name, expectOk, fn) {
  try { await (expectOk ? assertSucceeds : assertFails)(fn()); pass++; console.log('  ok  ', name); }
  catch (e) { fail++; console.log('  FAIL', name, '->', (e.message || '').split('\n')[0].slice(0, 160)); }
}
const prof = { name: 'Alice', kind: 'person', motto: 'hi', updated: TS };
const pet = { name: 'Ferajna', kind: 'cat', emoji: '🐱', created: TS };
await t('Google account makes its own profile', true, () => set(ref(as('alice'), 'profiles/alice'), prof));
await t('email account makes a bot profile', true, () => set(ref(as('botty', 'password'), 'profiles/botty'), { ...prof, name: 'Botty', kind: 'bot' }));
await t('anonymous browsing identity cannot make a profile', false, () => set(ref(as('anna', 'anonymous'), 'profiles/anna'), prof));
await t('signed-out visitor cannot write', false, () => set(ref(anon, 'profiles/x'), prof));
await t('signed-out visitor can read profiles', true, () => get(ref(anon, 'profiles')));
await t('write someone else\'s profile', false, () => update(ref(as('mallory'), 'profiles/alice'), { name: 'evil', updated: TS }));
await t('kind must be person or bot', false, () => set(ref(as('alice'), 'profiles/alice'), { ...prof, kind: 'cat' }));
await t('missing kind', false, () => set(ref(as('alice'), 'profiles/alice'), { name: 'A', updated: TS }));
await t('name too long (61)', false, () => update(ref(as('alice'), 'profiles/alice'), { name: 'x'.repeat(61), updated: TS }));
await t('updated time made up', false, () => update(ref(as('alice'), 'profiles/alice'), { updated: 5 }));
await t('unknown profile field', false, () => update(ref(as('alice'), 'profiles/alice'), { email: 'a@b.c', updated: TS }));
await t('owner adds a pet', true, () => set(ref(as('alice'), 'profiles/alice/pets/p1'), pet));
await t('owner adds a pet with a picture link', true, () => set(push(ref(as('alice'), 'profiles/alice/pets')), { ...pet, picture: 'https://example.com/cat.png' }));
await t('bot adds a pet', true, () => set(ref(as('botty', 'password'), 'profiles/botty/pets/r1'), { name: 'Bolt', kind: 'robot dog', emoji: '🤖', created: TS }));
await t('someone else adds a pet to alice', false, () => set(ref(as('mallory'), 'profiles/alice/pets/p9'), pet));
await t('someone else renames alice\'s pet', false, () => update(ref(as('mallory'), 'profiles/alice/pets/p1'), { name: 'Stolen' }));
await t('someone else removes alice\'s pet', false, () => remove(ref(as('mallory'), 'profiles/alice/pets/p1')));
await t('anonymous identity adds a pet to its own space', false, () => set(ref(as('anna', 'anonymous'), 'profiles/anna/pets/p1'), pet));
await t('pet without a kind', false, () => set(ref(as('alice'), 'profiles/alice/pets/p2'), { name: 'X', created: TS }));
await t('pet name too long (33)', false, () => set(ref(as('alice'), 'profiles/alice/pets/p2'), { ...pet, name: 'x'.repeat(33) }));
await t('picture link that is not https', false, () => set(ref(as('alice'), 'profiles/alice/pets/p2'), { ...pet, picture: 'javascript:alert(1)' }));
await t('unknown pet field', false, () => set(ref(as('alice'), 'profiles/alice/pets/p2'), { ...pet, owner: 'bob' }));
await t('owner removes own pet', true, () => remove(ref(as('alice'), 'profiles/alice/pets/p1')));
await t('read popcoin balances still private', false, () => get(ref(as('bob'), 'popcoin/users/alice')));
await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
