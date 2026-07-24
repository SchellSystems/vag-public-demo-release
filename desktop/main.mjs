/**
 * VAG Bounded Demo — Electron Main Process
 *
 * Starts the bounded local demo gateway, waits for readiness,
 * then opens a secure BrowserWindow pointing at the same-origin URL.
 *
 * Architecture constraints:
 * - contextIsolation: true
 * - nodeIntegration: false
 * - sandbox: true
 * - No remote content, no broad IPC bridge
 * - Single-instance lock
 * - Gateway binds only 127.0.0.1, OS-assigned port
 * - No telemetry, auto-updates, or external network requests
 * - DevTools disabled in packaged mode
 */

import { app, BrowserWindow, dialog } from 'electron';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Squirrel.Windows startup event handling ---
if (process.platform === 'win32') {
  const squirrelCommand = process.argv[1];
  if (
    squirrelCommand === '--squirrel-install' ||
    squirrelCommand === '--squirrel-updated' ||
    squirrelCommand === '--squirrel-uninstall' ||
    squirrelCommand === '--squirrel-obsolete'
  ) {
    app.quit();
    process.exit(0);
  }
}

// --- Smoke test mode ---
const SMOKE_TEST = process.argv.includes('--smoke-test');

// --- Single instance lock ---
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.error('[desktop] Another instance is already running. Exiting.');
  app.quit();
  process.exit(1);
}

// --- Determine paths ---
const isPackaged = app.isPackaged;

// In packaged mode, __dirname resolves inside the asar archive.
// import.meta.url-based paths work correctly for asar-packed JS modules.
const APP_ROOT = join(__dirname, '..');

// Static UI dir: built React output
// NOTE: Static file serving from asar works via Electron's asar-aware fs.
const UI_DIST = join(APP_ROOT, 'demo-ui', 'dist');

// Gateway module path (within asar in packaged mode, which Electron handles)
const GATEWAY_PATH = join(APP_ROOT, 'demo-gateway', 'src', 'server.mjs');

let gateway = null;
let mainWindow = null;

/**
 * Start the demo gateway with dynamic port on loopback.
 */
async function startGateway() {
  // Set env to prevent CLI auto-start when importing
  process.env.__DEMO_GATEWAY_PROGRAMMATIC__ = '1';

  const { startDemoServer } = await import(GATEWAY_PATH);

  if (!existsSync(UI_DIST)) {
    throw new Error(
      `UI dist directory not found at: ${UI_DIST}\n` +
      'Run "npm run build" before starting the desktop app.'
    );
  }

  const result = await startDemoServer({
    host: '127.0.0.1',
    port: 0, // OS-assigned ephemeral port
    staticDir: UI_DIST,
  });

  console.log(`[desktop] Gateway ready at ${result.url}`);
  return result;
}

/**
 * Create the main BrowserWindow with security hardening.
 */
function createWindow(gatewayUrl) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    title: 'VAG Bounded Demo',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !isPackaged,
      enableRemoteModule: false,
      allowRunningInsecureContent: false,
      webSecurity: true,
    },
  });

  // Block all permission requests
  mainWindow.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  // Block navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(gatewayUrl)) {
      event.preventDefault();
    }
  });

  // Block new window creation (window.open, target=_blank)
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Load the local UI
  mainWindow.loadURL(gatewayUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Run smoke test: start gateway, verify health, run a bounded flow, exit.
 */
async function runSmokeTest() {
  try {
    console.log('[smoke-test] Starting gateway...');
    gateway = await startGateway();

    // Health check
    const healthRes = await fetch(`${gateway.url}/health`);
    const healthData = await healthRes.json();
    if (healthData.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(healthData)}`);
    }
    console.log('[smoke-test] Health: OK');

    // Propose (allow)
    const proposeRes = await fetch(`${gateway.url}/propose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: { intent: 'demo.transform_json' } }),
    });
    const proposeData = await proposeRes.json();
    if (proposeData.decision !== 'allow') {
      throw new Error(`Expected allow, got: ${proposeData.decision}`);
    }
    console.log('[smoke-test] Propose (allow): OK');

    // Commit
    const outputDigest = 'a'.repeat(64);
    const commitRes = await fetch(`${gateway.url}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposal_id: proposeData.proposal_id,
        decision_id: proposeData.decision_id,
        output_digest: outputDigest,
      }),
    });
    const commitData = await commitRes.json();
    if (commitData.status !== 'committed') {
      throw new Error(`Commit failed: ${JSON.stringify(commitData)}`);
    }
    console.log('[smoke-test] Commit: OK');

    // Verify
    const verifyRes = await fetch(`${gateway.url}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        record_hash: commitData.record_hash,
        signature: commitData.signature,
      }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.valid || !verifyData.integrity) {
      throw new Error(`Verify failed: ${JSON.stringify(verifyData)}`);
    }
    console.log('[smoke-test] Verify: OK');

    // Deny path
    const denyRes = await fetch(`${gateway.url}/propose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: { intent: 'demo.forbidden_action' } }),
    });
    const denyData = await denyRes.json();
    if (denyData.decision !== 'deny') {
      throw new Error(`Expected deny, got: ${denyData.decision}`);
    }
    console.log('[smoke-test] Deny: OK');

    // Confirm deny cannot be committed
    const denyCommitRes = await fetch(`${gateway.url}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposal_id: denyData.proposal_id,
        decision_id: denyData.decision_id,
        output_digest: outputDigest,
      }),
    });
    const denyCommitData = await denyCommitRes.json();
    if (denyCommitData.error !== 'denied_proposal') {
      throw new Error(`Expected denied_proposal error, got: ${JSON.stringify(denyCommitData)}`);
    }
    console.log('[smoke-test] Deny commit rejected: OK');

    // Verify loopback binding
    const addr = gateway.address;
    if (addr.host !== '127.0.0.1') {
      throw new Error(`Expected 127.0.0.1, bound to: ${addr.host}`);
    }
    console.log('[smoke-test] Loopback binding verified: OK');

    console.log('[smoke-test] ALL CHECKS PASSED');
    await gateway.close();
    app.exit(0);
  } catch (err) {
    console.error(`[smoke-test] FAILED: ${err.message}`);
    if (gateway) {
      try { await gateway.close(); } catch { /* ignore */ }
    }
    app.exit(1);
  }
}

// --- App lifecycle ---
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', async () => {
  if (gateway) {
    try {
      await gateway.close();
      console.log('[desktop] Gateway closed.');
    } catch (err) {
      console.error(`[desktop] Error closing gateway: ${err.message}`);
    }
    gateway = null;
  }
});

app.whenReady().then(async () => {
  if (SMOKE_TEST) {
    await runSmokeTest();
    return;
  }

  try {
    gateway = await startGateway();
    createWindow(gateway.url);
  } catch (err) {
    console.error(`[desktop] Fatal: ${err.message}`);
    dialog.showErrorBox(
      'VAG Bounded Demo — Startup Error',
      `The demo gateway failed to start.\n\n${err.message}\n\nThe application will now exit.`
    );
    app.quit();
  }
});
