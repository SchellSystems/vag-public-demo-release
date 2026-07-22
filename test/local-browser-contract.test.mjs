import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

async function read(path) {
  return readFile(join(root, path), 'utf8');
}

describe('local browser contract', () => {
  it('aligns gateway bind, CORS, UI endpoint, and Vite host', async () => {
    const [gateway, constants, vite] = await Promise.all([
      read('demo-gateway/src/server.mjs'),
      read('demo-ui/src/constants.ts'),
      read('demo-ui/vite.config.ts'),
    ]);

    assert.match(
      gateway,
      /DEMO_GATEWAY_HOST \|\| '127\.0\.0\.1'/,
      'gateway default bind must be 127.0.0.1',
    );
    assert.match(
      gateway,
      /DEMO_UI_ORIGIN \|\| 'http:\/\/127\.0\.0\.1:5173'/,
      'gateway default CORS origin must match the UI origin',
    );
    assert.match(
      constants,
      /GATEWAY_URL = 'http:\/\/127\.0\.0\.1:4400'/,
      'UI gateway URL must match the gateway bind',
    );
    assert.match(vite, /host: '127\.0\.0\.1'/);
    assert.match(vite, /port: 5173/);
  });

  it('keeps public run instructions on the same browser origin', async () => {
    const [readme, walkthrough, runbook] = await Promise.all([
      read('README.md'),
      read('docs/demo/walkthrough.md'),
      read('docs/demo/runbook.md'),
    ]);

    for (const [name, content] of [
      ['README.md', readme],
      ['docs/demo/walkthrough.md', walkthrough],
      ['docs/demo/runbook.md', runbook],
    ]) {
      assert.ok(
        content.includes('http://127.0.0.1:5173'),
        `${name} must name the bounded UI origin`,
      );
      assert.equal(
        content.includes('http://localhost:5173'),
        false,
        `${name} must not direct browser users to a mismatched localhost origin`,
      );
    }
  });

  it('keeps walkthrough negative evidence UI-bounded', async () => {
    const walkthrough = await read('docs/demo/walkthrough.md');

    assert.ok(
      walkthrough.includes('negative_evidence_scope`: bounded_ui_path_only'),
    );
    assert.equal(
      walkthrough.includes('negative_evidence_scope`: bounded_demo_path_only'),
      false,
    );
  });
});
