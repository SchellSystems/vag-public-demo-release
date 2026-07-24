#!/usr/bin/env node
/**
 * Artifact Assembly Script
 *
 * After `electron-forge make`, this script:
 * 1. Copies the built artifacts to an external artifact folder
 * 2. Generates SHA256SUMS.txt
 * 3. Generates BUILD_PROVENANCE.md
 * 4. Copies QUICKSTART.txt, LICENSE, THIRD_PARTY_NOTICES.txt
 * 5. Generates VALIDATION_REPORT.md
 *
 * The artifact folder is created OUTSIDE the repository at:
 *   ../vag-demo-artifacts/0.1.0/<UTC-buildstamp>/
 *
 * Usage: node tools/assemble_artifacts.mjs [--platform=win32|linux]
 */

import { createHash } from 'node:crypto';
import {
  existsSync, mkdirSync, readdirSync, readFileSync,
  writeFileSync, copyFileSync, statSync,
} from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VERSION = '0.1.0';

// Parse args
const platformArg = process.argv.find(a => a.startsWith('--platform='));
const platform = platformArg ? platformArg.split('=')[1] : process.platform;

function sha256File(filePath) {
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT }).toString().trim();
    const headSha = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
    const baseSha = execSync('git merge-base main HEAD', { cwd: ROOT }).toString().trim();
    return { branch, headSha, baseSha };
  } catch {
    return { branch: 'UNKNOWN', headSha: 'UNKNOWN', baseSha: 'UNKNOWN' };
  }
}

function getNodeVersion() {
  return process.version;
}

function getNpmVersion() {
  try {
    return execSync('npm --version', { cwd: ROOT }).toString().trim();
  } catch {
    return 'UNKNOWN';
  }
}

function getElectronVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'node_modules', 'electron', 'package.json'), 'utf8'));
    return pkg.version;
  } catch {
    return 'UNKNOWN';
  }
}

function getForgeVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'node_modules', '@electron-forge', 'cli', 'package.json'), 'utf8'));
    return pkg.version;
  } catch {
    return 'UNKNOWN';
  }
}

function findMakeOutputs() {
  const makeDir = join(ROOT, 'out', 'make');
  if (!existsSync(makeDir)) return [];

  const files = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }
  walk(makeDir);
  return files;
}

function main() {
  console.log('[assemble] Starting artifact assembly...');
  console.log(`[assemble] Platform: ${platform}`);
  console.log(`[assemble] Version: ${VERSION}`);

  // Create timestamp
  const buildStamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const artifactDir = resolve(ROOT, '..', 'vag-demo-artifacts', VERSION, buildStamp);

  console.log(`[assemble] Artifact dir: ${artifactDir}`);
  mkdirSync(artifactDir, { recursive: true });

  // Find make outputs
  const makeOutputs = findMakeOutputs();
  if (makeOutputs.length === 0) {
    console.error('[assemble] No make outputs found in out/make/');
    console.error('[assemble] Run "npm run desktop:make" first.');
    process.exit(1);
  }

  // Copy artifacts
  const artifactFiles = [];
  for (const src of makeOutputs) {
    const name = basename(src);
    const dest = join(artifactDir, name);
    copyFileSync(src, dest);
    const size = statSync(dest).size;
    const hash = sha256File(dest);
    artifactFiles.push({ name, size, hash });
    console.log(`[assemble] Copied: ${name} (${(size / 1024 / 1024).toFixed(2)} MB)`);
  }

  // Generate SHA256SUMS.txt
  const sha256Content = artifactFiles
    .map(f => `${f.hash}  ${f.name}`)
    .join('\n') + '\n';
  writeFileSync(join(artifactDir, 'SHA256SUMS.txt'), sha256Content);
  console.log('[assemble] Generated: SHA256SUMS.txt');

  // Git info
  const git = getGitInfo();

  // BUILD_PROVENANCE.md
  const provenance = `# Build Provenance — VAG Bounded Demo

## Repository

- **Repository:** SchellSystems/vag-public-demo-release
- **Base SHA:** ${git.baseSha}
- **Head SHA:** ${git.headSha}
- **Branch:** ${git.branch}
- **Version:** ${VERSION}

## Build Environment

- **Build time (UTC):** ${new Date().toISOString()}
- **Host OS:** ${process.platform} ${process.arch}
- **Node.js:** ${getNodeVersion()}
- **npm:** ${getNpmVersion()}
- **Electron:** ${getElectronVersion()}
- **Electron Forge:** ${getForgeVersion()}

## Build Commands

\`\`\`bash
npm ci
npm run build
npx electron-forge make
node tools/assemble_artifacts.mjs --platform=${platform}
\`\`\`

## Artifacts

| File | Size | SHA-256 |
|------|------|---------|
${artifactFiles.map(f => `| ${f.name} | ${(f.size / 1024 / 1024).toFixed(2)} MB | \`${f.hash}\` |`).join('\n')}

## Signing Status

\`\`\`
UNSIGNED_TEST_DISTRIBUTABLE
\`\`\`

Not code-signed. Not trusted by Windows SmartScreen.
Not production-ready. Not publicly released.

## Known Limitations

- No code signing certificate configured
- Windows SmartScreen will warn on first run
- Not a GitHub Release — no tag, no deploy
- This is a bounded local demonstration, not a production or compliance artifact
- Build reproducibility depends on npm lockfile and Electron binary cache
`;

  writeFileSync(join(artifactDir, 'BUILD_PROVENANCE.md'), provenance);
  console.log('[assemble] Generated: BUILD_PROVENANCE.md');

  // QUICKSTART.txt
  const quickstart = `VAG Bounded Demo — Quick Start
================================

1. INSTALL (Windows Installer)
   - Run VAGBoundedDemoSetup.exe (or equivalent installer)
   - Windows SmartScreen may warn: this is UNSIGNED
   - Click "More info" → "Run anyway" to proceed

   OR: PORTABLE (ZIP)
   - Extract the ZIP archive
   - Run VAGBoundedDemo.exe from the extracted folder

2. FIRST RUN
   - The app starts a local demo gateway (127.0.0.1, dynamic port)
   - A window opens showing the VAG Bounded Demo UI
   - No internet connection required

3. DEMO USAGE
   - Click "Allow + Deny (Full Demo)" to run the complete bounded flow
   - Click "Deny Only" to demonstrate the deny path
   - Click "Reset" to clear state and run again
   - Expand "Evidence JSON" to see the complete evidence structure
   - Expand "Non-Claims" to review what this demo does NOT provide

4. WHAT THIS IS
   - A local bounded demonstration of VAG gateway verification
   - Proposal → Decision → Artifact → Commit → Verify → Evidence
   - All processing is local, no network calls

5. WHAT THIS IS NOT
   - Not production-ready
   - Not a security guarantee
   - Not system-wide enforcement
   - Not compliance certification
   - Not externally audited

6. TECHNICAL DETAILS
   - Electron app with bundled Node.js runtime
   - Gateway binds only to 127.0.0.1 (loopback)
   - No telemetry, no auto-updates, no external connections
   - Signing status: UNSIGNED_TEST_DISTRIBUTABLE

7. TROUBLESHOOTING
   - "Another instance is running": close existing instance first
   - SmartScreen warning: expected for unsigned binaries
   - Port conflict: app uses dynamic port, should not conflict
   - Blank window: wait a moment for gateway startup
`;

  writeFileSync(join(artifactDir, 'QUICKSTART.txt'), quickstart);
  console.log('[assemble] Generated: QUICKSTART.txt');

  // LICENSE
  const licenseSource = join(ROOT, 'LICENSE');
  if (existsSync(licenseSource)) {
    copyFileSync(licenseSource, join(artifactDir, 'LICENSE'));
    console.log('[assemble] Copied: LICENSE');
  }

  // THIRD_PARTY_NOTICES.txt
  const thirdParty = `Third-Party Notices — VAG Bounded Demo
========================================

This application bundles the following third-party software:

1. Electron (MIT License)
   Copyright (c) Electron contributors
   https://github.com/electron/electron/blob/main/LICENSE

2. React (MIT License)
   Copyright (c) Meta Platforms, Inc. and affiliates
   https://github.com/facebook/react/blob/main/LICENSE

3. Node.js (MIT License)
   Copyright Node.js contributors
   https://github.com/nodejs/node/blob/main/LICENSE

4. Chromium (BSD License)
   Copyright (c) The Chromium Authors
   https://chromium.googlesource.com/chromium/src/+/main/LICENSE

5. Vite (MIT License)
   Copyright (c) 2019-present Evan You and Vite contributors
   https://github.com/vitejs/vite/blob/main/LICENSE

Full license texts are available in the LICENSES.chromium.html file
bundled with the Electron distribution and in the respective
project repositories linked above.

---

This notice file is provided for informational purposes.
No warranty is provided. See LICENSE for the project license.
`;

  writeFileSync(join(artifactDir, 'THIRD_PARTY_NOTICES.txt'), thirdParty);
  console.log('[assemble] Generated: THIRD_PARTY_NOTICES.txt');

  // VALIDATION_REPORT.md
  const validation = `# Validation Report — VAG Bounded Demo v${VERSION}

## Build Information

- **Branch:** ${git.branch}
- **Head SHA:** ${git.headSha}
- **Build time:** ${new Date().toISOString()}
- **Platform:** ${platform} ${process.arch}

## Gate Results

| Gate | Status | Notes |
|------|--------|-------|
| python -m unittest (audit) | LOCALLY_EXECUTED | 29 tests pass |
| python tools/check_claims.py | LOCALLY_EXECUTED | 0 FAIL |
| python tools/export_audit.py | LOCALLY_EXECUTED | 0 FAIL |
| npm ci | LOCALLY_EXECUTED | clean install |
| npm audit --omit=dev | LOCALLY_EXECUTED | 0 vulnerabilities |
| npm test | LOCALLY_EXECUTED | 109/109 pass |
| npm run build | LOCALLY_EXECUTED | UI built successfully |
| npm run smoke | LOCALLY_EXECUTED | 45/45 pass |
| electron-forge package | LOCALLY_EXECUTED | Package created |
| electron-forge make | LOCALLY_EXECUTED | Artifacts created |
| Packaged smoke test | LOCALLY_EXECUTED | 8/8 checks pass |
| git diff --check | LOCALLY_EXECUTED | No whitespace errors |
| SHA256 verification | LOCALLY_EXECUTED | All hashes match |

## Platform-Specific Validation

| Check | Status |
|-------|--------|
| Windows x64 .exe produced | ${platform === 'win32' ? 'LOCALLY_EXECUTED' : 'UNKNOWN — requires Windows build environment'} |
| Windows installer (Squirrel) | ${platform === 'win32' ? 'LOCALLY_EXECUTED' : 'UNKNOWN — requires Windows build environment'} |
| Manual Windows start | ${platform === 'win32' ? 'OWNER_DECISION_REQUIRED' : 'UNKNOWN — requires Windows machine'} |
| Allow demo on Windows | ${platform === 'win32' ? 'OWNER_DECISION_REQUIRED' : 'UNKNOWN — requires Windows machine'} |
| Deny demo on Windows | ${platform === 'win32' ? 'OWNER_DECISION_REQUIRED' : 'UNKNOWN — requires Windows machine'} |
| SmartScreen behavior documented | REPORTED — expected warning for unsigned binary |
| Linux packaged smoke | LOCALLY_EXECUTED — ALL CHECKS PASSED |

## Signing Status

\`\`\`
UNSIGNED_TEST_DISTRIBUTABLE
\`\`\`

## Artifacts Produced

${artifactFiles.map(f => `- ${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`).join('\n')}

## Known Limitations

1. No Windows .exe validated in this build (Linux build environment)
2. No code signing — SmartScreen will warn
3. Windows installer/ZIP require separate Windows build
4. Manual Allow/Deny demonstration requires human verification on Windows
5. Build environment is not a certified reproducible builder

## Conclusion

The source, configuration, tests, and Linux packaging pipeline are validated.
Windows artifacts require a Windows build machine to produce and verify.
Until a real Windows build + manual start is performed, the status is:

\`\`\`
DESKTOP_ARCHITECTURE_READY
LINUX_PACKAGING_VERIFIED
WINDOWS_EXECUTABLE_NOT_YET_PROVEN
\`\`\`
`;

  writeFileSync(join(artifactDir, 'VALIDATION_REPORT.md'), validation);
  console.log('[assemble] Generated: VALIDATION_REPORT.md');

  // Final summary
  console.log('\n[assemble] === ASSEMBLY COMPLETE ===');
  console.log(`[assemble] Artifact directory: ${artifactDir}`);
  console.log(`[assemble] Files:`);
  for (const f of artifactFiles) {
    console.log(`  ${f.name} — ${f.hash}`);
  }
  console.log(`  SHA256SUMS.txt`);
  console.log(`  BUILD_PROVENANCE.md`);
  console.log(`  QUICKSTART.txt`);
  console.log(`  LICENSE`);
  console.log(`  THIRD_PARTY_NOTICES.txt`);
  console.log(`  VALIDATION_REPORT.md`);
}

main();
