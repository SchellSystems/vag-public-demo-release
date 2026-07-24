/**
 * Desktop contract regression tests.
 *
 * Validates that the desktop Electron shell configuration maintains
 * the required security boundaries and architectural constraints.
 *
 * These are static analysis tests — they read source files and verify
 * configuration, not runtime behavior (which is covered by --smoke-test).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function read(relPath) {
  return readFileSync(join(ROOT, relPath), 'utf8');
}

describe('desktop security boundaries', () => {
  const main = read('desktop/main.mjs');

  it('contextIsolation is true', () => {
    assert.match(main, /contextIsolation:\s*true/);
  });

  it('nodeIntegration is false', () => {
    assert.match(main, /nodeIntegration:\s*false/);
  });

  it('sandbox is true in webPreferences', () => {
    assert.match(main, /sandbox:\s*true/);
  });

  it('devTools disabled in packaged mode', () => {
    assert.match(main, /devTools:\s*!isPackaged/);
  });

  it('blocks permission requests', () => {
    assert.match(main, /setPermissionRequestHandler/);
    assert.match(main, /callback\(false\)/);
  });

  it('blocks external navigation', () => {
    assert.match(main, /will-navigate/);
    assert.match(main, /event\.preventDefault\(\)/);
  });

  it('blocks window.open / new windows', () => {
    assert.match(main, /setWindowOpenHandler/);
    assert.match(main, /action:\s*'deny'/);
  });

  it('uses single-instance lock', () => {
    assert.match(main, /requestSingleInstanceLock/);
  });

  it('handles Squirrel startup events', () => {
    assert.match(main, /--squirrel-install/);
    assert.match(main, /--squirrel-updated/);
    assert.match(main, /--squirrel-uninstall/);
    assert.match(main, /--squirrel-obsolete/);
  });

  it('gateway binds only to 127.0.0.1', () => {
    assert.match(main, /host:\s*'127\.0\.0\.1'/);
  });

  it('gateway uses dynamic port (port: 0)', () => {
    assert.match(main, /port:\s*0/);
  });

  it('gateway is closed on quit', () => {
    assert.match(main, /before-quit/);
    assert.match(main, /gateway\.close\(\)/);
  });

  it('no enableRemoteModule', () => {
    assert.match(main, /enableRemoteModule:\s*false/);
  });

  it('no remote URLs loaded', () => {
    // Should not contain any https:// or http:// URLs used in loadURL
    // except for the local gateway URL construction
    const loadURLCalls = main.match(/loadURL\([^)]+\)/g) || [];
    for (const call of loadURLCalls) {
      assert.ok(
        call.includes('gatewayUrl') || call.includes('gateway.url'),
        `loadURL must only use local gateway URL, got: ${call}`,
      );
    }
  });
});

describe('desktop gateway factory contract', () => {
  const server = read('demo-gateway/src/server.mjs');

  it('exports startDemoServer function', () => {
    assert.match(server, /export function startDemoServer/);
  });

  it('startDemoServer returns close() function', () => {
    assert.match(server, /close:\s*\(\)\s*=>/);
  });

  it('startDemoServer returns address with host and port', () => {
    assert.match(server, /address:\s*\{\s*host:\s*actualHost,\s*port:\s*actualPort\s*\}/);
  });

  it('static file serving includes path traversal protection', () => {
    assert.match(server, /resolved\.startsWith\(staticDir\)/);
  });

  it('SPA fallback does not serve index.html for API routes', () => {
    // API routes are handled before static serving
    assert.match(server, /\/health/);
    assert.match(server, /\/propose/);
    assert.match(server, /\/commit/);
    assert.match(server, /\/verify/);
    // Static serving comes after API routes
    const apiIdx = server.indexOf("method === 'GET' && staticDir");
    const proposeIdx = server.indexOf("url === '/propose'");
    assert.ok(apiIdx > proposeIdx, 'Static serving must come after API routes');
  });
});

describe('desktop packaging configuration', () => {
  const forge = read('forge.config.mjs');
  const pkg = JSON.parse(read('package.json'));

  it('main entry points to desktop/main.mjs', () => {
    assert.equal(pkg.main, 'desktop/main.mjs');
  });

  it('productName is VAG Bounded Demo', () => {
    assert.equal(pkg.productName, 'VAG Bounded Demo');
  });

  it('forge config uses maker-squirrel for Windows', () => {
    assert.match(forge, /@electron-forge\/maker-squirrel/);
  });

  it('forge config uses maker-zip', () => {
    assert.match(forge, /@electron-forge\/maker-zip/);
  });

  it('forge config uses asar packaging', () => {
    assert.match(forge, /asar:\s*true/);
  });

  it('forge config excludes test directories', () => {
    assert.match(forge, /test/);
  });

  it('forge config excludes tools', () => {
    assert.match(forge, /tools/);
  });

  it('no autoUpdater, telemetry, or publisher module configured', () => {
    // Check that no update or publisher plugins are configured
    assert.ok(!forge.includes('autoUpdater'), 'No autoUpdater in forge config');
    assert.ok(!forge.includes('@electron-forge/publisher'), 'No publisher plugin in forge config');
    assert.ok(!forge.includes('telemetry:'), 'No telemetry config in forge config');
  });

  it('desktop:smoke:packaged script exists', () => {
    assert.ok(pkg.scripts['desktop:smoke:packaged']);
  });
});

describe('desktop smoke test mode', () => {
  const main = read('desktop/main.mjs');

  it('--smoke-test flag is detected', () => {
    assert.match(main, /--smoke-test/);
    assert.match(main, /SMOKE_TEST/);
  });

  it('smoke test checks health', () => {
    assert.match(main, /\/health/);
  });

  it('smoke test checks allow flow', () => {
    assert.match(main, /demo\.transform_json/);
    assert.match(main, /decision.*!==.*'allow'/);
  });

  it('smoke test checks commit', () => {
    assert.match(main, /status.*!==.*'committed'/);
  });

  it('smoke test checks verify', () => {
    assert.match(main, /!verifyData\.valid.*\|\|.*!verifyData\.integrity/);
  });

  it('smoke test checks deny path', () => {
    assert.match(main, /demo\.forbidden_action/);
  });

  it('smoke test verifies deny cannot be committed', () => {
    assert.match(main, /denied_proposal/);
  });

  it('smoke test verifies loopback binding', () => {
    assert.match(main, /addr\.host.*!==.*'127\.0\.0\.1'/);
  });

  it('smoke test exits with 0 on success', () => {
    assert.match(main, /app\.exit\(0\)/);
  });

  it('smoke test exits non-0 on failure', () => {
    assert.match(main, /app\.exit\(1\)/);
  });
});
