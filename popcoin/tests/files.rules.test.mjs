// "My files" rules: database list at files/<account>/<file> and Storage at files/<account>/<file>.
// Run with the database and storage emulators:
//   npx firebase emulators:exec --only database,storage --project demo-popcoin "node tests/files.rules.test.mjs"
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { ref, set, get, remove, serverTimestamp } from 'firebase/database';
import { ref as sref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
import fs from 'fs';
const env = await initializeTestEnvironment({ projectId: 'demo-popcoin',
  database: { rules: fs.readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8'), host: '127.0.0.1', port: 9000 },
  storage: { rules: fs.readFileSync(new URL('../storage.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 9199 } });
const ctx = (uid, provider = 'google.com') => env.authenticatedContext(uid, { firebase: { sign_in_provider: provider } });
const db = (u, p) => ctx(u, p).database(), st = (u, p) => ctx(u, p).storage();
const anonDb = env.unauthenticatedContext().database(), anonSt = env.unauthenticatedContext().storage();
let pass = 0, fail = 0;
async function t(name, expectOk, fn) {
  try { await (expectOk ? assertSucceeds : assertFails)(fn()); pass++; console.log('  ok  ', name); }
  catch (e) { fail++; console.log('  FAIL', name, '->', (e.message || '').split('\n')[0].slice(0, 160)); }
}
const meta = (uid, id, extra = {}) => ({ name: 'notes.txt', size: 5, type: 'text/plain', path: `files/${uid}/${id}`, created: serverTimestamp(), ...extra });
const small = new Uint8Array([104, 101, 108, 108, 111]);
const big = new Uint8Array(5 * 1024 * 1024 + 1);
console.log('— storage');
await t('owner uploads a small file', true, () => uploadBytes(sref(st('alice'), 'files/alice/f1'), small));
await t('email account (bot) uploads', true, () => uploadBytes(sref(st('botty', 'password'), 'files/botty/b1'), small));
await t('file over 5 megabytes refused', false, () => uploadBytes(sref(st('alice'), 'files/alice/big'), big));
await t('upload into someone else\'s folder', false, () => uploadBytes(sref(st('mallory'), 'files/alice/f2'), small));
await t('anonymous browsing identity cannot upload', false, () => uploadBytes(sref(st('anna', 'anonymous'), 'files/anna/f1'), small));
await t('signed-out visitor cannot upload', false, () => uploadBytes(sref(anonSt, 'files/x/f1'), small));
await t('upload outside files/', false, () => uploadBytes(sref(st('alice'), 'other/f1'), small));
await t('anyone can open a file', true, () => getBytes(sref(anonSt, 'files/alice/f1')));
await t('someone else deletes alice\'s file', false, () => deleteObject(sref(st('mallory'), 'files/alice/f1')));
console.log('— database list');
await t('owner lists a file', true, () => set(ref(db('alice'), 'files/alice/f1'), meta('alice', 'f1')));
await t('anyone reads the list', true, () => get(ref(anonDb, 'files/alice')));
await t('someone else adds to alice\'s list', false, () => set(ref(db('mallory'), 'files/alice/f9'), meta('alice', 'f9')));
await t('anonymous identity cannot list', false, () => set(ref(db('anna', 'anonymous'), 'files/anna/f1'), meta('anna', 'f1')));
await t('path must match the account and file', false, () => set(ref(db('alice'), 'files/alice/f2'), meta('alice', 'f2', { path: 'files/bob/f2' })));
await t('size of 5 megabytes or more refused', false, () => set(ref(db('alice'), 'files/alice/f3'), meta('alice', 'f3', { size: 5242880 })));
await t('unknown field refused', false, () => set(ref(db('alice'), 'files/alice/f4'), meta('alice', 'f4', { secret: 1 })));
await t('someone else removes alice\'s entry', false, () => remove(ref(db('mallory'), 'files/alice/f1')));
await t('owner removes own entry', true, () => remove(ref(db('alice'), 'files/alice/f1')));
await t('owner deletes own file', true, () => deleteObject(sref(st('alice'), 'files/alice/f1')));
await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
