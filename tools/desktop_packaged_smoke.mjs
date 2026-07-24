#!/usr/bin/env node
/**
 * Desktop Packaged Smoke Test Runner
 *
 * Runs the packaged Electron app in --smoke-test mode.
 * Verifies that the built binary can:
 * 1. Start the Electron process
 * 2. Bind the gateway to loopback on a dynamic port
 * 3. Pass health/propose/commit/verify/deny checks
 * 4. Exit cleanly with code 0
 *
 * Usage:
 *   node tools/desktop_packaged_smoke.mjs [path-to-executable]
 *
 * If no path is given, attempts to find the packaged binary in out/.
 */

import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function findPackagedBinary() {
  const outDir = join(ROOT, 'out');
  if (!existsSync(outDir)) {
    return null;
  }

  const entries = readdirSync(outDir);

  // Look for the platform-specific directory
  for (const entry of entries) {
    const dir = join(outDir, entry);

    // Linux
    const linuxBin = join(dir, 'VAGBoundedDemo');
    if (existsSync(linuxBin)) return linuxBin;

    // Windows
    const winBin = join(dir, 'VAGBoundedDemo.exe');
    if (existsSync(winBin)) return winBin;
  }

  return null;
}

async function main() {
  const explicitPath = process.argv[2];
  const binary = explicitPath || findPackagedBinary();

  if (!binary) {
    console.error('[packaged-smoke] No packaged binary found.');
    console.error('[packaged-smoke] Run "npm run desktop:package" first, or provide path as argument.');
    process.exit(1);
  }

  if (!existsSync(binary)) {
    console.error(`[packaged-smoke] Binary not found at: ${binary}`);
    process.exit(1);
  }

  console.log(`[packaged-smoke] Binary: ${binary}`);
  console.log('[packaged-smoke] Starting with --smoke-test...');

  const args = ['--smoke-test'];

  // Add --no-sandbox for Linux CI environments without user namespaces
  if (process.platform === 'linux') {
    args.push('--no-sandbox');
  }

  const proc = spawn(binary, args, {
    stdio: 'pipe',
    cwd: ROOT,
    timeout: 30000,
  });

  let stdout = '';
  let stderr = '';

  proc.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    stdout += text;
    process.stdout.write(text);
  });

  proc.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    stderr += text;
    // Only print non-dbus errors
    if (!text.includes('dbus') && !text.includes('ozone')) {
      process.stderr.write(text);
    }
  });

  const exitCode = await new Promise((resolve) => {
    proc.on('close', resolve);
    proc.on('error', (err) => {
      console.error(`[packaged-smoke] Process error: ${err.message}`);
      resolve(1);
    });
  });

  console.log(`\n[packaged-smoke] Exit code: ${exitCode}`);

  if (exitCode === 0) {
    // Verify expected output
    const checks = [
      { label: 'Health OK', pattern: /Health: OK/ },
      { label: 'Propose OK', pattern: /Propose \(allow\): OK/ },
      { label: 'Commit OK', pattern: /Commit: OK/ },
      { label: 'Verify OK', pattern: /Verify: OK/ },
      { label: 'Deny OK', pattern: /Deny: OK/ },
      { label: 'Deny commit rejected', pattern: /Deny commit rejected: OK/ },
      { label: 'Loopback verified', pattern: /Loopback binding verified: OK/ },
      { label: 'All passed', pattern: /ALL CHECKS PASSED/ },
    ];

    let allFound = true;
    for (const { label, pattern } of checks) {
      if (pattern.test(stdout)) {
        console.log(`  [PASS] ${label}`);
      } else {
        console.error(`  [FAIL] ${label} — not found in output`);
        allFound = false;
      }
    }

    if (allFound) {
      console.log('\n[packaged-smoke] RESULT: PASS — all smoke checks verified');
      process.exit(0);
    } else {
      console.error('\n[packaged-smoke] RESULT: FAIL — some checks not found in output');
      process.exit(1);
    }
  } else {
    console.error(`[packaged-smoke] RESULT: FAIL — process exited with code ${exitCode}`);
    if (stderr) {
      console.error('[packaged-smoke] Stderr (filtered):');
      const lines = stderr.split('\n').filter(l => !l.includes('dbus') && !l.includes('ozone') && l.trim());
      lines.forEach(l => console.error(`  ${l}`));
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[packaged-smoke] FATAL: ${err.message}`);
  process.exit(1);
});
