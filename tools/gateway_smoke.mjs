#!/usr/bin/env node
/**
 * Gateway Smoke Test (local only)
 *
 * Starts demo-gateway, runs the probe against it, validates end-to-end behavior.
 *
 * This is documented as a local validation procedure in the runbook.
 * Not a browser test — validates gateway+probe path only.
 *
 * Usage: node tools/gateway_smoke.mjs
 */

import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const GATEWAY_URL = 'http://localhost:4400';
const UI_URL = 'http://localhost:5173';

async function waitForServer(url, maxRetries = 20) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // not ready yet
    }
    await sleep(500);
  }
  return false;
}

async function main() {
  console.log('[smoke] Starting demo-gateway...');
  const gateway = spawn('node', ['demo-gateway/src/server.mjs'], {
    stdio: 'pipe',
    cwd: process.cwd(),
  });

  console.log('[smoke] Waiting for gateway...');
  const gwReady = await waitForServer(`${GATEWAY_URL}/health`);
  if (!gwReady) {
    console.error('[smoke] Gateway failed to start');
    gateway.kill();
    process.exit(1);
  }
  console.log('[smoke] Gateway ready.');

  // Run the probe against the live gateway
  console.log('[smoke] Running probe...');
  const probe = spawn('node', ['tools/public_demo_probe.mjs', GATEWAY_URL], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  const code = await new Promise((resolve) => probe.on('close', resolve));

  gateway.kill();
  console.log(`[smoke] Done. Exit code: ${code}`);
  process.exit(code);
}

main().catch((err) => {
  console.error('[smoke] FATAL:', err.message);
  process.exit(1);
});
