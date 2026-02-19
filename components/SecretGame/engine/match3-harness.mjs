#!/usr/bin/env node
/**
 * Signal Run – match3 logic test harness (run: npm run test:match3)
 * No test framework; exits 0 if all pass, 1 on failure.
 */

const MAX_INVENTORY = 9;
const KINDS = ['beat', 'vocal', 'fx', 'sample'];

function addToInventory(inventory, kind) {
  if (inventory.length >= MAX_INVENTORY) return inventory;
  return [...inventory, kind];
}

function findMatch3(inventory) {
  const counts = { beat: 0, vocal: 0, fx: 0, sample: 0 };
  for (const k of inventory) counts[k]++;
  if (counts.beat >= 3) return 'beat';
  if (counts.vocal >= 3) return 'vocal';
  if (counts.fx >= 3) return 'fx';
  if (counts.sample >= 3) return 'sample';
  return null;
}

function removeMatch3(inventory, kind) {
  let removed = 0;
  return inventory.filter((t) => {
    if (t === kind && removed < 3) {
      removed++;
      return false;
    }
    return true;
  });
}

let failed = 0;

function ok(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed++;
  } else {
    console.log('OK:', msg);
  }
}

// findMatch3
ok(findMatch3([]) === null, 'empty -> null');
ok(findMatch3(['beat', 'vocal']) === null, '2 tiles -> null');
ok(findMatch3(['beat', 'beat', 'beat']) === 'beat', '3 beat -> beat');
ok(findMatch3(['vocal', 'vocal', 'vocal']) === 'vocal', '3 vocal -> vocal');
ok(findMatch3(['beat', 'vocal', 'beat', 'beat']) === 'beat', '4 with 3 beat -> beat');
ok(findMatch3(['fx', 'fx', 'sample', 'fx']) === 'fx', '3 fx among 4 -> fx');

// removeMatch3
const a = ['beat', 'vocal', 'beat', 'beat'];
ok(removeMatch3(a, 'beat').length === 1 && removeMatch3(a, 'beat')[0] === 'vocal', 'remove 3 beat leaves vocal');
ok(removeMatch3(['sample', 'sample', 'sample'], 'sample').length === 0, 'remove 3 sample -> empty');

// addToInventory
let inv = [];
for (let i = 0; i < MAX_INVENTORY; i++) inv = addToInventory(inv, 'beat');
ok(inv.length === MAX_INVENTORY, 'cap at MAX_INVENTORY');
inv = addToInventory(inv, 'vocal');
ok(inv.length === MAX_INVENTORY, 'no add when full');

if (failed) process.exit(1);
console.log('match3 harness: all passed');
process.exit(0);
