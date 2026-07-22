/**
 * Local browser-origin contract regression test.
 *
 * Guards against documentation and configuration drift between:
 *   - gateway CORS default origin (http://127.0.0.1:5173)
 *   - UI gateway URL constant (http://127.0.0.1:4400)
 *   - Vite dev/preview host binding (127.0.0.1:5173)
 *   - public start/browser documentation
 *   - negative_evidence_scope value
 *
 * This is a static file-content contract test. It does NOT:
 *   - start servers or execute runtime code
 *   - substitute for human browser acceptance
 *   - copy production logic
 *   - test gateway core behavior
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

function readConfigBlock(source, blockName) {
  const match = source.match(
    new RegExp(`\\b${blockName}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`),
  );
  assert.ok(match, `vite config must define a ${blockName} block`);
  return match[1];
}

const EXPECTED_GATEWAY_ORIGIN = 'http://127.0.0.1:5173';
const EXPECTED_UI_GATEWAY_URL = 'http://127.0.0.1:4400';
const EXPECTED_EVIDENCE_SCOPE = 'bounded_ui_path_only';

describe('origin contract — gateway server defaults', () => {
  const server = read('demo-gateway/src/server.mjs');

  it('ALLOWED_ORIGIN defaults to http://127.0.0.1:5173', () => {
    assert.match(
      server,
      /const ALLOWED_ORIGIN = process\.env\.DEMO_UI_ORIGIN \|\| 'http:\/\/127\.0\.0\.1:5173';/,
      'gateway ALLOWED_ORIGIN default must be http://127.0.0.1:5173',
    );
  });

  it('HOST defaults to 127.0.0.1', () => {
    assert.match(
      server,
      /const HOST = process\.env\.DEMO_GATEWAY_HOST \|\| '127\.0\.0\.1';/,
      'gateway HOST default must be 127.0.0.1',
    );
  });

  it('PORT defaults to 4400', () => {
    assert.match(
      server,
      /const PORT = parseInt\(process\.env\.DEMO_GATEWAY_PORT \|\| '4400', 10\);/,
      'gateway PORT default must be 4400',
    );
  });
});

describe('origin contract — UI constants', () => {
  const constants = read('demo-ui/src/constants.ts');

  it('GATEWAY_URL is http://127.0.0.1:4400', () => {
    assert.match(
      constants,
      /export const GATEWAY_URL = 'http:\/\/127\.0\.0\.1:4400';/,
      `UI GATEWAY_URL must be ${EXPECTED_UI_GATEWAY_URL}`,
    );
  });
});

describe('origin contract — Vite configuration', () => {
  const viteConfig = read('demo-ui/vite.config.ts');

  it('server binds explicitly to 127.0.0.1:5173', () => {
    const serverBlock = readConfigBlock(viteConfig, 'server');
    assert.match(serverBlock, /host:\s*'127\.0\.0\.1'/);
    assert.match(serverBlock, /port:\s*5173/);
  });

  it('preview binds explicitly to 127.0.0.1:5173', () => {
    const previewBlock = readConfigBlock(viteConfig, 'preview');
    assert.match(previewBlock, /host:\s*'127\.0\.0\.1'/);
    assert.match(previewBlock, /port:\s*5173/);
  });
});

describe('origin contract — documentation does not use localhost as default', () => {
  const DOCS_TO_CHECK = [
    'docs/demo/runbook.md',
    'docs/demo/walkthrough.md',
    'demo-gateway/README.md',
  ];

  for (const docPath of DOCS_TO_CHECK) {
    it(`${docPath} does not present http://localhost:4400 as the default`, () => {
      const content = read(docPath);
      const localhostGateway = content.includes('http://localhost:4400');
      assert.equal(
        localhostGateway,
        false,
        `${docPath} must not use http://localhost:4400 as the standard gateway address`,
      );
    });

    it(`${docPath} does not present http://localhost:5173 as the default`, () => {
      const content = read(docPath);
      const localhostUI = content.includes('http://localhost:5173');
      assert.equal(
        localhostUI,
        false,
        `${docPath} must not use http://localhost:5173 as the standard UI address`,
      );
    });
  }
});

describe('origin contract — negative_evidence_scope', () => {
  it('walkthrough documents negative_evidence_scope as bounded_ui_path_only', () => {
    const walkthrough = read('docs/demo/walkthrough.md');
    assert.ok(
      walkthrough.includes(`negative_evidence_scope\`: ${EXPECTED_EVIDENCE_SCOPE}`) ||
      walkthrough.includes(`negative_evidence_scope: ${EXPECTED_EVIDENCE_SCOPE}`),
      `walkthrough must document negative_evidence_scope as ${EXPECTED_EVIDENCE_SCOPE}`,
    );
  });

  it('evidence service uses bounded_ui_path_only', () => {
    const evidenceService = read('demo-ui/src/services/evidence.ts');
    assert.match(
      evidenceService,
      /negative_evidence_scope:\s*'bounded_ui_path_only'/,
      `evidence service must use ${EXPECTED_EVIDENCE_SCOPE}`,
    );
  });

  it('evidence test asserts bounded_ui_path_only', () => {
    const evidenceTest = read('test/evidence.test.mjs');
    assert.ok(
      evidenceTest.includes(EXPECTED_EVIDENCE_SCOPE),
      `evidence test must assert ${EXPECTED_EVIDENCE_SCOPE}`,
    );
  });
});

describe('origin contract — non-claims preserved', () => {
  it('demo-gateway/README.md preserves CORS non-claim', () => {
    const gatewayReadme = read('demo-gateway/README.md');
    assert.ok(
      gatewayReadme.includes('not authentication') ||
      gatewayReadme.includes('is not authentication'),
      'gateway README must state CORS is not authentication',
    );
    assert.ok(
      gatewayReadme.includes('not a sandbox') ||
      gatewayReadme.includes('is not a sandbox'),
      'gateway README must state gateway is not a sandbox',
    );
  });
});
