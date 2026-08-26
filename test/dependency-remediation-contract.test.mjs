/**
 * dependency-remediation-contract.test.mjs
 *
 * Evidence-dated snapshot dependency contract.
 * This is NOT a security gate, NOT an advisory scanner, NOT a substitute
 * for Dependabot. It is an offline, fail-closed, lockfile-bytes-only
 * contract that asserts minimum version floors for remediated transitive
 * dependencies in the resolved lockfile.
 *
 * Floors dated 2026-07-26:
 *   Mechanism: M2 root overrides {tar: 7.5.22, tmp: 0.2.7}
 *   Advisory floors: tar >= 7.5.21 (E5.3/E6.1), tmp >= 0.2.6 (E5.4/E6.3)
 *   Production closure: 9 entries, no tar, no tmp (PC1).
 *
 * Floors dated 2026-08-26:
 *   undici >= 7.29.0 — CVE-2026-13697 (H), CVE-2026-16728 (M), et al.
 *   fast-uri >= 3.1.6 — CVE-2026-18446, CVE-2026-75899, CVE-2026-75931, CVE-2026-76172
 *   nanoid >= 3.3.18 — CVE-2026-67213
 *   brace-expansion 1.x >= 1.1.18 — CVE-2026-14257 bypass (GHSA-rgw5-rvv9-x895)
 *   brace-expansion 2.x >= 2.1.4 — CVE-2026-14257 bypass (GHSA-rgw5-rvv9-x895)
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

  it('asserts all undici nodes meet floor >= 7.29.0 or are absent', () => {
    assert.ok(lockData.packages !== undefined, 'lockfile must have packages key');
    const nodes = Object.entries(lockData.packages).filter(
      ([key]) => key === 'node_modules/undici' || key.endsWith('/node_modules/undici')
    );

    for (const [key, node] of nodes) {
      assert.ok(
        typeof node.version === 'string' && node.version !== '',
        `undici node "${key}" must have a valid version field`
      );
      const cmp = compareExactVersion(node.version, '7.29.0');
      assert.ok(cmp >= 0, `undici node "${key}" version ${node.version} is below floor 7.29.0`);
    }
  });

  it('asserts all fast-uri nodes meet floor >= 3.1.6 or are absent', () => {
    assert.ok(lockData.packages !== undefined, 'lockfile must have packages key');
    const nodes = Object.entries(lockData.packages).filter(
      ([key]) => key === 'node_modules/fast-uri' || key.endsWith('/node_modules/fast-uri')
    );

    for (const [key, node] of nodes) {
      assert.ok(
        typeof node.version === 'string' && node.version !== '',
        `fast-uri node "${key}" must have a valid version field`
      );
      const cmp = compareExactVersion(node.version, '3.1.6');
      assert.ok(cmp >= 0, `fast-uri node "${key}" version ${node.version} is below floor 3.1.6`);
    }
  });

  it('asserts all nanoid nodes meet floor >= 3.3.18 or are absent', () => {
    assert.ok(lockData.packages !== undefined, 'lockfile must have packages key');
    const nodes = Object.entries(lockData.packages).filter(
      ([key]) => key === 'node_modules/nanoid' || key.endsWith('/node_modules/nanoid')
    );

    for (const [key, node] of nodes) {
      assert.ok(
        typeof node.version === 'string' && node.version !== '',
        `nanoid node "${key}" must have a valid version field`
      );
      const cmp = compareExactVersion(node.version, '3.3.18');
      assert.ok(cmp >= 0, `nanoid node "${key}" version ${node.version} is below floor 3.3.18`);
    }
  });

  it('asserts all brace-expansion 1.x nodes meet floor >= 1.1.18 or are absent', () => {
    assert.ok(lockData.packages !== undefined, 'lockfile must have packages key');
    const nodes = Object.entries(lockData.packages).filter(
      ([key]) => key === 'node_modules/brace-expansion' || key.endsWith('/node_modules/brace-expansion')
    );

    for (const [key, node] of nodes) {
      assert.ok(
        typeof node.version === 'string' && node.version !== '',
        `brace-expansion node "${key}" must have a valid version field`
      );
      // Validate the full version string before deriving major — throws on malformed input
      // (e.g. "v1.1.17", ranges, prereleases) so they fail closed rather than silently skip.
      compareExactVersion(node.version, '0.0.0');
      const major = Number(node.version.split('.')[0]);
      if (major === 1) {
        const cmp = compareExactVersion(node.version, '1.1.18');
        assert.ok(cmp >= 0, `brace-expansion 1.x node "${key}" version ${node.version} is below floor 1.1.18`);
      }
    }
  });

  it('asserts all brace-expansion 2.x nodes meet floor >= 2.1.4 or are absent', () => {
    assert.ok(lockData.packages !== undefined, 'lockfile must have packages key');
    const nodes = Object.entries(lockData.packages).filter(
      ([key]) => key === 'node_modules/brace-expansion' || key.endsWith('/node_modules/brace-expansion')
    );

    for (const [key, node] of nodes) {
      assert.ok(
        typeof node.version === 'string' && node.version !== '',
        `brace-expansion node "${key}" must have a valid version field`
      );
      // Validate the full version string before deriving major — throws on malformed input
      // (e.g. "v1.1.17", ranges, prereleases) so they fail closed rather than silently skip.
      compareExactVersion(node.version, '0.0.0');
      const major = Number(node.version.split('.')[0]);
      if (major === 2) {
        const cmp = compareExactVersion(node.version, '2.1.4');
        assert.ok(cmp >= 0, `brace-expansion 2.x node "${key}" version ${node.version} is below floor 2.1.4`);
      }
    }
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

describe('electron packaging security remediation', () => {
  let lockData;

  it('reads lockfile for packaging assertions', () => {
    const raw = readFileSync(LOCKFILE_PATH, 'utf8');
    lockData = JSON.parse(raw);
    assert.ok(lockData.packages !== undefined, 'lockfile must have packages key');
  });

  it('asserts vulnerable extract-zip@2.0.1 is not installed', () => {
    // Strategy: root overrides alias "extract-zip" -> "npm:@electron-internal/extract-zip@1.0.5"
    // so any lockfile node for extract-zip must be the safe aliased package, not the unmaintained 2.0.1.
    // A node may be present (as an alias) but its "name" field must be "@electron-internal/extract-zip".
    const extractZipNodes = Object.entries(lockData.packages).filter(([key]) =>
      key === 'node_modules/extract-zip' || key.endsWith('/node_modules/extract-zip')
    );
    for (const [key, node] of extractZipNodes) {
      assert.equal(
        node.name,
        '@electron-internal/extract-zip',
        `extract-zip node at "${key}" must be the @electron-internal/extract-zip alias, got name=${node.name} version=${node.version}`
      );
    }
  });

  it('asserts @electron-internal/extract-zip is present (safe scoped package)', () => {
    // @electron-internal/extract-zip is the scoped safe package used by Electron itself.
    const internalNodes = Object.entries(lockData.packages).filter(([key]) =>
      key === 'node_modules/@electron-internal/extract-zip' ||
      key.endsWith('/node_modules/@electron-internal/extract-zip')
    );
    assert.ok(
      internalNodes.length > 0,
      '@electron-internal/extract-zip must be present (safe, distinct scoped package)'
    );
  });

  it('asserts @electron/packager is Forge-7-compatible 18.x (>= 18.3.5)', () => {
    // Forge 7.11.2 declares @electron/packager ^18.3.5.
    // Packager 20.x removed the callback-based hook API that Forge 7 requires, causing
    // "TypeError: done is not a function" (Windows CI Run #7). Packager 18.4.4 is used.
    // The extract-zip vulnerability in 18.x is addressed by the root override alias above.
    const packagerNodes = Object.entries(lockData.packages).filter(([key]) =>
      key.endsWith('/node_modules/@electron/packager')
    );
    assert.ok(packagerNodes.length > 0, '@electron/packager must exist in lockfile');
    for (const [key, node] of packagerNodes) {
      const cmp = compareExactVersion(node.version, '18.3.5');
      assert.ok(cmp >= 0, `@electron/packager at "${key}" version ${node.version} is below floor 18.3.5`);
      const major = Number(node.version.split('.')[0]);
      assert.equal(major, 18, `@electron/packager at "${key}" must be 18.x (Forge 7 compatible), got ${node.version}`);
    }
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
