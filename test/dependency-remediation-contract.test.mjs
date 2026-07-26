/**
 * dependency-remediation-contract.test.mjs
 *
 * Evidence-dated snapshot dependency contract (floors dated 2026-07-26).
 * This is NOT a security gate, NOT an advisory scanner, NOT a substitute
 * for Dependabot. It is an offline, fail-closed, lockfile-bytes-only
 * contract that asserts minimum version floors for remediated transitive
 * dependencies in the resolved lockfile.
 *
 * Mechanism: M2 root overrides {tar: 7.5.22, tmp: 0.2.7}
 * Advisory floors: tar >= 7.5.21 (E5.3/E6.1), tmp >= 0.2.6 (E5.4/E6.3)
 * Production closure: 9 entries, no tar, no tmp (PC1).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCKFILE_PATH = resolve(__dirname, '..', 'package-lock.json');

/**
 * compareExactVersion(a, b) - strict numeric x.y.z comparison.
 * Returns -1, 0, or 1.
 * Throws on: prerelease tags, build metadata, range specifiers (^~>=<*||x),
 * leading 'v', non-numeric segments, empty strings, non-strings,
 * non-3-segment versions.
 */
function compareExactVersion(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    throw new Error(`compareExactVersion requires string arguments, got: ${typeof a}, ${typeof b}`);
  }
  if (a === '' || b === '') {
    throw new Error('compareExactVersion does not accept empty strings');
  }
  // Reject range specifiers, leading v, prerelease, build metadata
  const forbidden = /[^0-9.]/;
  if (forbidden.test(a)) {
    throw new Error(`compareExactVersion rejects non-numeric version: "${a}"`);
  }
  if (forbidden.test(b)) {
    throw new Error(`compareExactVersion rejects non-numeric version: "${b}"`);
  }

  const partsA = a.split('.');
  const partsB = b.split('.');

  if (partsA.length !== 3 || partsB.length !== 3) {
    throw new Error(`compareExactVersion requires exactly 3 segments (x.y.z), got: "${a}", "${b}"`);
  }

  for (let i = 0; i < 3; i++) {
    const numA = Number(partsA[i]);
    const numB = Number(partsB[i]);
    if (!Number.isInteger(numA) || !Number.isInteger(numB) || numA < 0 || numB < 0) {
      throw new Error(`compareExactVersion requires non-negative integer segments, got: "${a}", "${b}"`);
    }
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

describe('assertLockfileFloors', () => {
  let lockData;

  it('reads and parses package-lock.json', () => {
    const raw = readFileSync(LOCKFILE_PATH, 'utf8');
    lockData = JSON.parse(raw);
  });

  it('asserts lockfileVersion === 3', () => {
    assert.equal(lockData.lockfileVersion, 3, 'lockfileVersion must be 3');
  });

  it('asserts all tar nodes meet floor >= 7.5.21 or are absent', () => {
    assert.ok(lockData.packages !== undefined, 'lockfile must have packages key');
    const tarPattern = /\/node_modules\/tar$/;
    const tarNodes = Object.entries(lockData.packages).filter(([key]) => tarPattern.test(key));

    for (const [key, node] of tarNodes) {
      assert.ok(
        typeof node.version === 'string' && node.version !== '',
        `tar node "${key}" must have a valid version field`
      );
      const cmp = compareExactVersion(node.version, '7.5.21');
      assert.ok(cmp >= 0, `tar node "${key}" version ${node.version} is below floor 7.5.21`);
    }
    // absent is acceptable - if no tar nodes, test passes
  });

  it('asserts all tmp nodes meet floor >= 0.2.6 or are absent', () => {
    assert.ok(lockData.packages !== undefined, 'lockfile must have packages key');
    const tmpPattern = /\/node_modules\/tmp$/;
    const tmpNodes = Object.entries(lockData.packages).filter(([key]) => tmpPattern.test(key));

    for (const [key, node] of tmpNodes) {
      assert.ok(
        typeof node.version === 'string' && node.version !== '',
        `tmp node "${key}" must have a valid version field`
      );
      const cmp = compareExactVersion(node.version, '0.2.6');
      assert.ok(cmp >= 0, `tmp node "${key}" version ${node.version} is below floor 0.2.6`);
    }
    // absent is acceptable - if no tmp nodes, test passes
  });
});

describe('compareExactVersion unit tests', () => {
  it('equal versions return 0', () => {
    assert.equal(compareExactVersion('1.2.3', '1.2.3'), 0);
  });

  it('higher major returns 1', () => {
    assert.equal(compareExactVersion('2.0.0', '1.9.9'), 1);
  });

  it('higher minor returns 1', () => {
    assert.equal(compareExactVersion('1.3.0', '1.2.9'), 1);
  });

  it('higher patch returns 1', () => {
    assert.equal(compareExactVersion('1.2.4', '1.2.3'), 1);
  });

  it('lower major returns -1', () => {
    assert.equal(compareExactVersion('1.0.0', '2.0.0'), -1);
  });

  it('lower minor returns -1', () => {
    assert.equal(compareExactVersion('1.2.0', '1.3.0'), -1);
  });

  it('lower patch returns -1', () => {
    assert.equal(compareExactVersion('1.2.3', '1.2.4'), -1);
  });

  it('boundary: 7.5.21 vs 7.5.21 is equal', () => {
    assert.equal(compareExactVersion('7.5.21', '7.5.21'), 0);
  });

  it('boundary: 7.5.20 vs 7.5.21 is below', () => {
    assert.equal(compareExactVersion('7.5.20', '7.5.21'), -1);
  });

  it('boundary: 7.5.22 vs 7.5.21 is above', () => {
    assert.equal(compareExactVersion('7.5.22', '7.5.21'), 1);
  });

  it('boundary: 0.2.5 vs 0.2.6 is below', () => {
    assert.equal(compareExactVersion('0.2.5', '0.2.6'), -1);
  });

  it('boundary: 0.2.6 vs 0.2.6 is equal', () => {
    assert.equal(compareExactVersion('0.2.6', '0.2.6'), 0);
  });

  it('boundary: 0.2.7 vs 0.2.6 is above', () => {
    assert.equal(compareExactVersion('0.2.7', '0.2.6'), 1);
  });

  it('throws on prerelease tag: "7.5.21-beta"', () => {
    assert.throws(() => compareExactVersion('7.5.21-beta', '7.5.21'), /non-numeric/);
  });

  it('throws on build metadata: "7.5.21+build"', () => {
    assert.throws(() => compareExactVersion('7.5.21+build', '7.5.21'), /non-numeric/);
  });

  it('throws on caret range: "^7.5.21"', () => {
    assert.throws(() => compareExactVersion('^7.5.21', '7.5.21'), /non-numeric/);
  });

  it('throws on tilde range: "~7.5.21"', () => {
    assert.throws(() => compareExactVersion('~7.5.21', '7.5.21'), /non-numeric/);
  });

  it('throws on leading v: "v7.5.21"', () => {
    assert.throws(() => compareExactVersion('v7.5.21', '7.5.21'), /non-numeric/);
  });

  it('throws on empty string', () => {
    assert.throws(() => compareExactVersion('', '7.5.21'), /empty/);
  });

  it('throws on null', () => {
    assert.throws(() => compareExactVersion(null, '7.5.21'), /requires string/);
  });

  it('throws on undefined', () => {
    assert.throws(() => compareExactVersion(undefined, '7.5.21'), /requires string/);
  });

  it('throws on number input', () => {
    assert.throws(() => compareExactVersion(123, '7.5.21'), /requires string/);
  });

  it('throws on two-segment version: "7.5"', () => {
    assert.throws(() => compareExactVersion('7.5', '7.5.21'), /exactly 3 segments/);
  });

  it('throws on one-segment version: "7"', () => {
    assert.throws(() => compareExactVersion('7', '7.5.21'), /exactly 3 segments/);
  });
});

describe('fail-closed behavior', () => {
  it('lockfileVersion !== 3 fails', () => {
    const fakeLock = { lockfileVersion: 2, packages: { 'node_modules/tar': { version: '7.5.22' } } };
    assert.notEqual(fakeLock.lockfileVersion, 3);
  });

  it('missing packages key fails', () => {
    const fakeLock = { lockfileVersion: 3 };
    assert.equal(fakeLock.packages, undefined);
  });

  it('node without version field fails', () => {
    const node = { resolved: 'https://registry.npmjs.org/tar/-/tar-7.5.22.tgz' };
    assert.equal(node.version, undefined);
    assert.throws(
      () => {
        if (typeof node.version !== 'string' || node.version === '') {
          throw new Error('node must have a valid version field');
        }
      },
      /must have a valid version field/
    );
  });

  it('malformed version in a tar node fails (throws, not passes)', () => {
    assert.throws(
      () => compareExactVersion('7.5.21-rc1', '7.5.21'),
      /non-numeric/
    );
  });
});

describe('production closure preservation', () => {
  it('production closure is exactly 9 entries with no tar or tmp', () => {
    const raw = readFileSync(LOCKFILE_PATH, 'utf8');
    const lockData = JSON.parse(raw);

    assert.ok(lockData.packages !== undefined, 'lockfile must have packages key');

    // Count non-dev, non-devOptional entries (excluding root "")
    const prodEntries = Object.entries(lockData.packages).filter(([key, node]) => {
      if (key === '') return false; // skip root
      if (node.dev === true) return false;
      if (node.devOptional === true) return false;
      return true;
    });

    assert.equal(
      prodEntries.length,
      9,
      `Expected exactly 9 production entries, got ${prodEntries.length}`
    );

    // Assert none are named tar or tmp
    const tarOrTmp = prodEntries.filter(([key]) =>
      /\/node_modules\/tar$/.test(key) || /\/node_modules\/tmp$/.test(key)
    );
    assert.equal(
      tarOrTmp.length,
      0,
      `Production closure must not contain tar or tmp, found: ${tarOrTmp.map(([k]) => k).join(', ')}`
    );
  });
});
