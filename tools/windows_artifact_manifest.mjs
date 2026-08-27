#!/usr/bin/env node
/**
 * Windows Artifact Manifest Generator
 *
 * Runs inside the Windows build workflow AFTER the installer (.exe) and ZIP
 * have been copied into the bundle directory under their canonical names.
 *
 * Generates, in the bundle directory:
 *   - SHA256SUMS.txt
 *   - BUILD_PROVENANCE.json
 *   - WINDOWS_BUILD_REPORT.md
 *
 * Inputs are taken from environment variables set by the workflow:
 *   BUNDLE_DIR                 directory holding the renamed .exe and .zip
 *   SMOKE_RESULT               must be PASS (packaged runtime smoke)
 *   GH_REPOSITORY              e.g. SchellSystems/vag-public-demo-release
 *   GH_REQUESTED_REF           explicitly requested branch, tag, or SHA
 *   GH_SHA                     commit SHA
 *   GH_RUN_ID                  workflow run id
 *
 * This script does NOT sign, upload, tag, or release anything.
 *
 * Usage: node tools/windows_artifact_manifest.mjs
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const BUNDLE_DIR = process.env.BUNDLE_DIR || join(ROOT, 'artifact-bundle');
const SMOKE_RESULT = (process.env.SMOKE_RESULT || 'UNKNOWN').toUpperCase();

const CANONICAL_EXE = 'VAG-Bounded-Demo-Setup-x64.exe';
const CANONICAL_ZIP = 'VAG-Bounded-Demo-win32-x64.zip';

function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function readPkgVersion(...segments) {
  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'node_modules', ...segments, 'package.json'), 'utf8'));
    return pkg.version;
  } catch {
    return 'UNKNOWN';
  }
}

function requireEnvironment(name) {
  const value = process.env[name];
  if (typeof value !== 'string' || value.trim() === '') {
    console.error(`[manifest] Required environment variable is missing: ${name}`);
    process.exit(1);
  }
  return value;
}

function main() {
  if (SMOKE_RESULT !== 'PASS') {
    console.error(`[manifest] Packaged runtime smoke must be PASS, got: ${SMOKE_RESULT}`);
    process.exit(1);
  }

  if (!existsSync(BUNDLE_DIR)) {
    console.error(`[manifest] Bundle dir not found: ${BUNDLE_DIR}`);
    process.exit(1);
  }

  const present = readdirSync(BUNDLE_DIR);
  const files = [];
  for (const name of [CANONICAL_EXE, CANONICAL_ZIP]) {
    const full = join(BUNDLE_DIR, name);
    if (existsSync(full)) {
      const size = statSync(full).size;
      const hash = sha256File(full);
      files.push({ name, size_bytes: size, sha256: hash });
    } else {
      console.error(`[manifest] Expected artifact missing: ${name}`);
      process.exit(1);
    }
  }

  if (files.length !== 2) {
    console.error('[manifest] Canonical installer and ZIP are required. Present files:', present.join(', '));
    process.exit(1);
  }

  // SHA256SUMS.txt (sha256sum-compatible format)
  const sumsContent = files.map((f) => `${f.sha256}  ${f.name}`).join('\n') + '\n';
  writeFileSync(join(BUNDLE_DIR, 'SHA256SUMS.txt'), sumsContent);
  console.log('[manifest] Wrote SHA256SUMS.txt');

  const writtenSums = readFileSync(join(BUNDLE_DIR, 'SHA256SUMS.txt'), 'utf8');
  if (writtenSums !== sumsContent) {
    console.error('[manifest] SHA256SUMS.txt round-trip verification failed');
    process.exit(1);
  }
  for (const file of files) {
    if (sha256File(join(BUNDLE_DIR, file.name)) !== file.sha256) {
      console.error(`[manifest] SHA-256 verification failed for ${file.name}`);
      process.exit(1);
    }
  }
  console.log('[manifest] SHA-256 verification: PASS');

  const nodeVersion = process.version;
  const electronVersion = readPkgVersion('electron');
  const forgeVersion = readPkgVersion('@electron-forge', 'cli');
  const packagerVersion = readPkgVersion('@electron-forge', 'core', 'node_modules', '@electron', 'packager');
  const expectedVersions = [
    ['Node', nodeVersion, 'v22.12.0'],
    ['Electron', electronVersion, '43.2.0'],
    ['Electron Forge', forgeVersion, '7.11.2'],
    ['Electron Packager', packagerVersion, '18.4.4'],
  ];
  for (const [label, actual, expected] of expectedVersions) {
    if (actual !== expected) {
      console.error(`[manifest] ${label} must be ${expected}, got: ${actual}`);
      process.exit(1);
    }
  }
  const buildTimeUtc = new Date().toISOString();

  const provenance = {
    product: 'VAG Bounded Demo',
    version: '0.1.0',
    repository: requireEnvironment('GH_REPOSITORY'),
    requested_ref: requireEnvironment('GH_REQUESTED_REF'),
    commit_sha: requireEnvironment('GH_SHA'),
    workflow_run_id: requireEnvironment('GH_RUN_ID'),
    node_version: nodeVersion,
    electron_version: electronVersion,
    electron_forge_version: forgeVersion,
    electron_packager_version: packagerVersion,
    build_time_utc: buildTimeUtc,
    platform: 'win32-x64',
    files: files.map((f) => ({ name: f.name, size_bytes: f.size_bytes, sha256: f.sha256 })),
    sha256: Object.fromEntries(files.map((f) => [f.name, f.sha256])),
    unsigned_build: true,
    code_signed: false,
    windows_packaged_runtime_smoke: SMOKE_RESULT,
    sha256_verification: 'PASS',
  };

  writeFileSync(
    join(BUNDLE_DIR, 'BUILD_PROVENANCE.json'),
    JSON.stringify(provenance, null, 2) + '\n',
  );
  console.log('[manifest] Wrote BUILD_PROVENANCE.json');

  const exeRuntimeLine = 'BUILT and STARTED (non-interactive packaged --smoke-test exited 0)';

  const report = `# Windows Build Report — VAG Bounded Demo v0.1.0

## Build Identity

- Repository: ${provenance.repository}
- Requested ref: ${provenance.requested_ref}
- Commit SHA: ${provenance.commit_sha}
- Workflow run ID: ${provenance.workflow_run_id}
- Build time (UTC): ${provenance.build_time_utc}
- Platform: win32-x64
- Node: ${nodeVersion}
- Electron: ${electronVersion}
- Electron Forge: ${forgeVersion}
- Electron Packager: ${packagerVersion}

## Signing

\`\`\`
UNSIGNED_TEST_DISTRIBUTABLE
unsigned_build: true
\`\`\`

Windows SmartScreen will warn on first run. This is expected for an unsigned
binary and is not a defect.

## Where each check ran

Linux/PR CI evidence is external to this Windows artifact and is not asserted by this report.

### Ran on Windows (this workflow, windows-latest, before packaging)
- \`npm ci\`
- \`python -m unittest discover -s test/audit -p 'test_*.py'\`
- \`python tools/check_claims.py .\`
- \`python tools/export_audit.py .\`
- \`npm audit --omit=dev\`
- \`npm audit --audit-level=high\`
- \`npm test\`
- \`npm run build\`
- \`npm run smoke\`
- \`electron-forge make\`
- Packaged runtime smoke
- Artifact collection (Squirrel installer + ZIP)
- SHA-256 generation and verification

## Was the .exe only built or also started?

- Installer/ZIP: ${files.map((f) => f.name).join(', ')}
- Packaged runtime: **${exeRuntimeLine}**
- WINDOWS_PACKAGED_RUNTIME_SMOKE: ${SMOKE_RESULT}

## Status summary

\`\`\`
WINDOWS_ARTIFACT_BUILD: PASS
WINDOWS_PACKAGED_RUNTIME_SMOKE: PASS
WINDOWS_FINAL_ACCEPTANCE: PASS
\`\`\`

## Remaining UNKNOWNs

- Interactive UI behavior (window rendering, Allow/Deny click paths) was not tested by the non-interactive packaged runtime smoke.
- Code signing / SmartScreen trust: not addressed in this stage (unsigned).

## Boundaries

This is bounded Public Demo evidence for an unsigned test distributable. It does
not assert a release, deployment, production readiness, system-wide enforcement,
Core authority, or code signing.

## Artifacts in this bundle

${files.map((f) => `- ${f.name} (${(f.size_bytes / 1024 / 1024).toFixed(2)} MB) — sha256 ${f.sha256}`).join('\n')}
- SHA256SUMS.txt
- BUILD_PROVENANCE.json
- WINDOWS_BUILD_REPORT.md

## Verify downloaded files

On Windows (PowerShell):

\`\`\`powershell
Get-FileHash .\\${CANONICAL_EXE} -Algorithm SHA256
Get-FileHash .\\${CANONICAL_ZIP} -Algorithm SHA256
\`\`\`

Compare the printed hashes against SHA256SUMS.txt / BUILD_PROVENANCE.json.

On Linux/macOS:

\`\`\`bash
sha256sum -c SHA256SUMS.txt
\`\`\`
`;

  writeFileSync(join(BUNDLE_DIR, 'WINDOWS_BUILD_REPORT.md'), report);
  console.log('[manifest] Wrote WINDOWS_BUILD_REPORT.md');

  console.log('\n[manifest] Bundle contents:');
  for (const f of files) {
    console.log(`  ${f.name} — ${f.sha256}`);
  }
  console.log('  SHA256SUMS.txt');
  console.log('  BUILD_PROVENANCE.json');
  console.log('  WINDOWS_BUILD_REPORT.md');
}

main();
