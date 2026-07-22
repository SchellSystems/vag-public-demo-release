/**
 * Gateway HTTP contract tests — whitepaper §18.2
 *
 * Spawns demo-gateway as a child process on an ephemeral port.
 * Guarantees process teardown. Does not treat loopback as a
 * sandbox or isolation boundary.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const SERVER_SCRIPT = join(REPO_ROOT, 'demo-gateway', 'src', 'server.mjs');

const ALLOWED_ORIGIN = 'http://127.0.0.1:5173';
const VALID_DIGEST = 'a'.repeat(64);
const SERVER_DEFAULT_HOST = '127.0.0.1';

/** Find a free TCP port on 127.0.0.1. */
function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close((err) => (err ? reject(err) : resolve(port)));
    });
    s.on('error', reject);
  });
}

let gatewayProc = null;
let baseUrl = '';
let listenPort = 0;
let defaultStdout = '';

/**
 * Start gateway as child process.
 *
 * DEMO_GATEWAY_HOST is ONLY set when options.DEMO_GATEWAY_HOST is provided.
 * Ambient DEMO_GATEWAY_HOST is deleted so the server default is exercised.
 */
async function startGateway(options = {}) {
  const port = await freePort();

  const env = { ...process.env };
  delete env.DEMO_GATEWAY_HOST;
  env.DEMO_GATEWAY_PORT = String(port);
  env.DEMO_UI_ORIGIN = ALLOWED_ORIGIN;

  let bindHost = SERVER_DEFAULT_HOST;
  if (Object.prototype.hasOwnProperty.call(options, 'DEMO_GATEWAY_HOST')) {
    env.DEMO_GATEWAY_HOST = options.DEMO_GATEWAY_HOST;
    bindHost = options.DEMO_GATEWAY_HOST;
  }

  const proc = spawn(process.execPath, [SERVER_SCRIPT], {
    cwd: REPO_ROOT,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  proc.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  proc.stderr.on('data', () => {});

  // Probe via the expected bind host.
  const url = `http://${bindHost}:${port}`;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) {
        return { proc, url, host: bindHost, port, stdout };
      }
    } catch {
      // not ready
    }
    if (proc.exitCode !== null) {
      throw new Error(
        `gateway exited early with code ${proc.exitCode}; stdout=${stdout}`,
      );
    }
    await sleep(100);
  }
  proc.kill('SIGTERM');
  throw new Error(`gateway did not become ready on ${url}; stdout=${stdout}`);
}

function stopGateway(proc) {
  if (!proc || proc.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      try {
        proc.kill('SIGKILL');
      } catch {
        /* ignore */
      }
      resolve();
    }, 2000);
    proc.once('exit', () => {
      clearTimeout(t);
      resolve();
    });
    try {
      proc.kill('SIGTERM');
    } catch {
      clearTimeout(t);
      resolve();
    }
  });
}

async function jsonRequest(method, path, body, headers = {}) {
  const opts = {
    method,
    headers: { ...headers },
  };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(`${baseUrl}${path}`, opts);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, headers: res.headers, data, text };
}

before(async () => {
  // Suite-level gateway: NO DEMO_GATEWAY_HOST → server default 127.0.0.1
  const started = await startGateway();
  gatewayProc = started.proc;
  baseUrl = started.url;
  listenPort = started.port;
  defaultStdout = started.stdout;
});

after(async () => {
  await stopGateway(gatewayProc);
  gatewayProc = null;
});

describe('HTTP /health (§18.2 #35)', () => {
  it('GET /health returns 200 with ok status', async () => {
    const { status, data } = await jsonRequest('GET', '/health');
    assert.equal(status, 200);
    assert.equal(data.status, 'ok');
    assert.equal(data.gateway, 'vag-demo-gateway');
    assert.equal(data.mode, 'local-bounded-demo');
  });
});

describe('HTTP CORS (§18.2 #36 #43)', () => {
  it('OPTIONS returns 204 with configured CORS headers', async () => {
    const res = await fetch(`${baseUrl}/propose`, { method: 'OPTIONS' });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), ALLOWED_ORIGIN);
    assert.ok(
      (res.headers.get('access-control-allow-methods') || '').includes('POST'),
    );
  });

  it('does not reflect an untrusted Origin as allowed origin', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'http://evil.example' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), ALLOWED_ORIGIN);
    assert.notEqual(
      res.headers.get('access-control-allow-origin'),
      'http://evil.example',
    );
  });
});

describe('HTTP error paths (§18.2 #39 #40 #41)', () => {
  it('unknown path returns 404', async () => {
    const { status, data } = await jsonRequest('GET', '/no-such-route');
    assert.equal(status, 404);
    assert.equal(data.error, 'not_found');
  });

  it('malformed JSON returns 400 parse_error', async () => {
    const { status, data } = await jsonRequest(
      'POST',
      '/propose',
      '{not-json',
    );
    assert.equal(status, 400);
    assert.equal(data.error, 'parse_error');
  });

  it('body over 64 KiB returns 413', async () => {
    const big = 'x'.repeat(70 * 1024);
    const { status, data } = await jsonRequest(
      'POST',
      '/propose',
      `{"pad":"${big}"}`,
    );
    assert.equal(status, 413);
    assert.equal(data.error, 'payload_too_large');
  });
});

describe('HTTP propose allow/deny (§18.2 #37 #38)', () => {
  it('propose allow returns 200 with decision allow', async () => {
    const { status, data } = await jsonRequest('POST', '/propose', {
      scope: { intent: 'demo.transform_json' },
      payload: { example: true },
    });
    assert.equal(status, 200);
    assert.equal(data.decision, 'allow');
    assert.equal(data.allowed, true);
    assert.ok(data.proposal_id);
    assert.ok(data.decision_id);
  });

  it('propose deny returns 200 with decision deny', async () => {
    const { status, data } = await jsonRequest('POST', '/propose', {
      scope: { intent: 'demo.forbidden_action' },
      payload: { example: true },
    });
    assert.equal(status, 200);
    assert.equal(data.decision, 'deny');
    assert.equal(data.allowed, false);
  });

  it('domain error (missing scope.intent) returns 400', async () => {
    const { status, data } = await jsonRequest('POST', '/propose', {
      intent: 'demo.transform_json',
      payload: {},
    });
    assert.equal(status, 400);
    assert.equal(data.error, 'missing_scope_intent');
  });
});

describe('HTTP commit after deny is rejected', () => {
  it('commit of a denied proposal returns 400 denied_proposal', async () => {
    const deny = await jsonRequest('POST', '/propose', {
      scope: { intent: 'demo.forbidden_action' },
      payload: {},
    });
    assert.equal(deny.data.decision, 'deny');

    const { status, data } = await jsonRequest('POST', '/commit', {
      proposal_id: deny.data.proposal_id,
      decision_id: deny.data.decision_id,
      output_digest: VALID_DIGEST,
    });
    assert.equal(status, 400);
    assert.equal(data.error, 'denied_proposal');
  });
});

describe('HTTP verify rejects unknown or invalid commit', () => {
  it('verify unknown record_hash returns 400', async () => {
    const { status, data } = await jsonRequest('POST', '/verify', {
      record_hash: '0'.repeat(64),
      signature: '0'.repeat(64),
    });
    assert.equal(status, 400);
    assert.equal(data.error, 'unknown_record_hash');
  });

  it('verify malformed record_hash returns 400', async () => {
    const { status, data } = await jsonRequest('POST', '/verify', {
      record_hash: 'not-hex',
      signature: '0'.repeat(64),
    });
    assert.equal(status, 400);
    assert.equal(data.error, 'invalid_record_hash');
  });
});

describe('HTTP full allow commit+verify path', () => {
  it('allow → commit → verify succeeds', async () => {
    const prop = await jsonRequest('POST', '/propose', {
      scope: { intent: 'demo.transform_json' },
      payload: { n: 1 },
    });
    assert.equal(prop.data.decision, 'allow');

    const cmt = await jsonRequest('POST', '/commit', {
      proposal_id: prop.data.proposal_id,
      decision_id: prop.data.decision_id,
      output_digest: VALID_DIGEST,
    });
    assert.equal(cmt.status, 200);
    assert.equal(cmt.data.status, 'committed');

    const ver = await jsonRequest('POST', '/verify', {
      record_hash: cmt.data.record_hash,
      signature: cmt.data.signature,
    });
    assert.equal(ver.status, 200);
    assert.equal(ver.data.valid, true);
    assert.equal(ver.data.integrity, true);
  });
});

describe('HTTP bind address (§18.2 #42)', () => {
  it('default bind host is 127.0.0.1 when DEMO_GATEWAY_HOST is unset', () => {
    // Suite before() started with DEMO_GATEWAY_HOST deleted from child env.
    // Server default must therefore be exercised.
    assert.ok(
      defaultStdout.includes(`listening on http://${SERVER_DEFAULT_HOST}:`),
      `expected default bind log for ${SERVER_DEFAULT_HOST}, got: ${defaultStdout}`,
    );
    assert.ok(listenPort > 0);
    assert.ok(baseUrl.startsWith(`http://${SERVER_DEFAULT_HOST}:`));
    // Non-claim: loopback bind is NOT sandbox, isolation, or authentication.
  });

  it('DEMO_GATEWAY_HOST override binds to a distinct host value', async () => {
    // Use 'localhost' — distinct string from default '127.0.0.1'.
    // Still loopback-safe; does not claim isolation.
    const overrideHost = 'localhost';
    assert.notEqual(overrideHost, SERVER_DEFAULT_HOST);

    const second = await startGateway({ DEMO_GATEWAY_HOST: overrideHost });
    try {
      assert.equal(second.host, overrideHost);
      assert.ok(
        second.stdout.includes(`listening on http://${overrideHost}:`),
        `expected override bind log for ${overrideHost}, got: ${second.stdout}`,
      );
      assert.ok(
        !second.stdout.includes(`listening on http://${SERVER_DEFAULT_HOST}:`),
        'override stdout must not claim the default host bind',
      );
      const res = await fetch(`${second.url}/health`);
      assert.equal(res.status, 200);
    } finally {
      await stopGateway(second.proc);
    }
  });
});
