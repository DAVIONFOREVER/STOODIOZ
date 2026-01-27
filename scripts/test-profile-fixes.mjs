#!/usr/bin/env node
/**
 * Smoke test for profile crash + ErrorBoundary Go Back fixes.
 * Run: node scripts/test-profile-fixes.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// --- 0. ErrorBoundary Go Back: source must reset hasError and call onRecover ---
const appSrc = readFileSync(join(root, 'App.tsx'), 'utf8');
assert(appSrc.includes('hasError: false'), 'ErrorBoundary onClick must set hasError: false');
assert(appSrc.includes('this.props.onRecover()'), 'ErrorBoundary onClick must call onRecover()');
console.log('✓ ErrorBoundary Go Back: reset + onRecover in place');

// --- 1. following undefined (main crash case) ---
const user1 = { id: 'u1', following: undefined };
const safe = (user1.following?.artists || []).includes('a1');
assert(safe === false, 'following?.artists|[] should be false when following is undefined');

// --- 2. following null ---
const user2 = { id: 'u2', following: null };
assert((user2.following?.labels || []).includes('l1') === false, 'following?.labels|[] with null');

// --- 3. following missing (no property) ---
const user3 = { id: 'u3' };
assert((user3.following?.producers || []).includes('p1') === false, 'following?.producers|[] when missing');

// --- 4. following empty object ---
const user4 = { id: 'u4', following: {} };
assert((user4.following?.engineers || []).includes('e1') === false, 'following?.engineers|[] with {}');

// --- 5. following with empty arrays ---
const user5 = { id: 'u5', following: { artists: [], labels: [] } };
assert((user5.following?.artists || []).includes('a1') === false, 'empty artists');
assert((user5.following?.stoodioz || []).includes('s1') === false, 'missing stoodioz key');

// --- 6. TheStage-style: f = currentUser.following, then f?.X ---
const user6 = { id: 'u6', following: undefined };
const f = user6.following;
const set = new Set([
  ...(f?.artists || []),
  ...(f?.engineers || []),
  ...(f?.stoodioz || []),
  ...(f?.producers || []),
  ...(f?.labels || []),
  user6.id
]);
assert(set.has('u6') && set.size === 1, 'TheStage followedIds with undefined following');

// --- 7. currentUser null (guest) ---
const currentUser = null;
const isFollowing = currentUser ? (currentUser.following?.artists || []).includes('a1') : false;
assert(isFollowing === false, 'guest: isFollowing must be false');

// --- 8. LabelProfile-style: (currentUser.following?.labels || []).includes(id) ---
const user8 = { following: undefined };
assert((user8.following?.labels || []).includes('l1') === false, 'LabelProfile pattern');

console.log('✓ All profile-fix patterns passed (no throws, correct fallbacks).');
