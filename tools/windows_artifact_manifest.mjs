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
 * Inputs are taken from environment variables (set by the workflow) with
 * safe fallbacks so the script can also be exercised locally:
 *   BUNDLE_DIR                 directory holding the renamed .exe and .zip
 *   SMOKE_RESULT               PASS | UNKNOWN | FAIL  (packaged runtime smoke)
 *   GH_REPOSITORY              e.g. SchellSystems/vag-public-demo-release
 *   GH_REF_NAME                branch name
 *   GH_SHA                     commit SHA
 *   GH_RUN_ID                  workflow run id
 *   LINUX_GATES                short text describing which gates ran on Linux
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

function main() {
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
      console.error(`[manifest] WARNING: expected artifact missing: ${name}`);
    }
  }

  if (files.length === 0) {
    console.error('[manifest] No canonical artifacts found. Present files:', present.join(', '));
    process.exit(1);
  }

  // SHA256SUMS.txt (sha256sum-compatible format)
  const sumsContent = files.map((f) => `${f.sha256}  ${f.name}`).join('\n') + '\n';
  writeFileSync(join(BUNDLE_DIR, 'SHA256SUMS.txt'), sumsContent);
  console.log('[manifest] Wrote SHA256SUMS.txt');

  const nodeVersion = process.version;
  const electronVersion = readPkgVersion('electron');
  const forgeVersion = readPkgVersion('@electron-forge', 'cli');
  const buildTimeUtc = new Date().toISOString();

  const provenance = {
    product: 'VAG Bounded Demo',
    version: '0.1.0',
    repository: process.env.GH_REPOSITORY || 'UNKNOWN',
    branch: process.env.GH_REF_NAME || 'UNKNOWN',
    commit_sha: process.env.GH_SHA || 'UNKNOWN',
    workflow_run_id: process.env.GH_RUN_ID || 'UNKNOWN',
    node_version: nodeVersion,
    electron_version: electronVersion,
    electron_forge_version: forgeVersion,
    build_time_utc: buildTimeUtc,
    platform: 'win32-x64',
    files: files.map((f) => ({ name: f.name, size_bytes: f.size_bytes, sha256: f.sha256 })),
    sha256: Object.fromEntries(files.map((f) => [f.name, f.sha256])),
    unsigned_build: true,
    code_signed: false,
    windows_packaged_runtime_smoke: SMOKE_RESULT,
  };

  writeFileSync(
    join(BUNDLE_DIR, 'BUILD_PROVENANCE.json'),
    JSON.stringify(provenance, null, 2) + '\n',
  );
  console.log('[manifest] Wrote BUILD_PROVENANCE.json');

  const smokeStarted = SMOKE_RESULT === 'PASS';
  const exeRuntimeLine = smokeStarted
    ? 'BUILT and STARTED (non-interactive packaged --smoke-test exited 0)'
    : 'BUILT only — packaged runtime start was NOT confirmed in CI';

  const report = `# Windows Build Report — VAG Bounded Demo v0.1.0

## Build Identity

- Repository: ${provenance.repository}
- Branch: ${provenance.branch}
- Commit SHA: ${provenance.commit_sha}
- Workflow run ID: ${provenance.workflow_run_id}
- Build time (UTC): ${provenance.build_time_utc}
- Platform: win32-x64
- Node: ${nodeVersion}
- Electron: ${electronVersion}
- Electron Forge: ${forgeVersion}

## Signing

\`\`\`
UNSIGNED_TEST_DISTRIBUTABLE
unsigned_build: true
\`\`\`

Windows SmartScreen will warn on first run. This is expected for an unsigned
binary and is not a defect.

## Where each check ran

### Ran on Linux (pre-existing branch validation, separate from this run)
- Gateway/UI/desktop unit tests (\`npm test\`)
- Audit fixture tests (\`python -m unittest discover -s test/audit\`)
- Claim audit and export audit
- Gateway smoke and public probe
- Electron dev smoke and packaged Linux smoke (xvfb)

### Ran on Windows (this workflow, windows-latest, before packaging)
- \`npm ci\`
- \`npm test\`
- \`python -m unittest discover -s test/audit -p 'test_*.py'\`
- \`python tools/check_claims.py .\`
- \`python tools/export_audit.py .\`
- \`npm audit --omit=dev\`
- \`npm run build\`
- \`npm run smoke\`
- Electron Forge Windows packaging (Squirrel installer + ZIP)

## Was the .exe only built or also started?

- Installer/ZIP: ${files.map((f) => f.name).join(', ')}
- Packaged runtime: **${exeRuntimeLine}**
- WINDOWS_PACKAGED_RUNTIME_SMOKE: ${SMOKE_RESULT}

## Status summary

\`\`\`
WINDOWS_BUILD: PASS
WINDOWS_PACKAGED_RUNTIME_SMOKE: ${SMOKE_RESULT}
MANUAL_WINDOWS_ACCEPTANCE_REQUIRED: ${smokeStarted ? 'RECOMMENDED' : 'YES'}
\`\`\`

## Remaining UNKNOWNs

${smokeStarted
  ? '- Interactive UI behavior (window rendering, Allow/Deny click paths) still needs one manual human acceptance run.'
  : '- Packaged runtime start on Windows was not confirmed in CI (headless/GPU limits). Manual start on a real Windows desktop is required.\n- Interactive UI behavior still needs manual human acceptance.'}
- Code signing / SmartScreen trust: not addressed in this stage (unsigned).

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
