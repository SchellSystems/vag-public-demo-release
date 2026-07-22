/**
 * VAG Demo Gateway — HTTP Server
 *
 * Minimal HTTP server wrapping the core gateway logic.
 * No external dependencies. No cloud. No shell. No HTTP client imports.
 * CORS restricted to demo-ui origin only.
 *
 * Default bind: 127.0.0.1 (loopback). This is NOT a sandbox, isolation,
 * or authentication boundary.
 */

import { createServer } from 'node:http';
import { health, propose, commit, verify } from './core.mjs';

const HOST = process.env.DEMO_GATEWAY_HOST || '127.0.0.1';
const PORT = parseInt(process.env.DEMO_GATEWAY_PORT || '4400', 10);
const ALLOWED_ORIGIN = process.env.DEMO_UI_ORIGIN || 'http://127.0.0.1:5173';
const MAX_BODY_BYTES = 65536; // 64 KB

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(res, status, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    ...corsHeaders(),
    'Content-Type': 'application/json',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalLength = 0;
    req.on('data', (chunk) => {
      totalLength += chunk.length;
      if (totalLength > MAX_BODY_BYTES) {
        reject(new Error('payload_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

async function handleRequest(req, res) {
  const { method, url } = req;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  // Route matching — only allowed methods/paths
  if (method === 'GET' && url === '/health') {
    json(res, 200, health());
    return;
  }

  if (method === 'POST' && url === '/propose') {
    try {
      const body = await readBody(req);
      const result = propose(body);
      const status = result.error ? 400 : 200;
      json(res, status, result);
    } catch (e) {
      if (e.message === 'payload_too_large') {
        json(res, 413, { error: 'payload_too_large', message: 'Request body exceeds 64 KB limit.' });
      } else {
        json(res, 400, { error: 'parse_error', message: e.message });
      }
    }
    return;
  }

  if (method === 'POST' && url === '/commit') {
    try {
      const body = await readBody(req);
      const result = commit(body);
      const status = result.error ? 400 : 200;
      json(res, status, result);
    } catch (e) {
      if (e.message === 'payload_too_large') {
        json(res, 413, { error: 'payload_too_large', message: 'Request body exceeds 64 KB limit.' });
      } else {
        json(res, 400, { error: 'parse_error', message: e.message });
      }
    }
    return;
  }

  if (method === 'POST' && url === '/verify') {
    try {
      const body = await readBody(req);
      const result = verify(body);
      const status = result.error ? 400 : 200;
      json(res, status, result);
    } catch (e) {
      if (e.message === 'payload_too_large') {
        json(res, 413, { error: 'payload_too_large', message: 'Request body exceeds 64 KB limit.' });
      } else {
        json(res, 400, { error: 'parse_error', message: e.message });
      }
    }
    return;
  }

  // Default: deny unknown routes/methods
  json(res, 404, { error: 'not_found', message: 'Unknown endpoint. Deny by default.' });
}

const server = createServer(handleRequest);

server.listen(PORT, HOST, () => {
  console.log(`[demo-gateway] listening on http://${HOST}:${PORT}`);
  console.log(`[demo-gateway] CORS origin: ${ALLOWED_ORIGIN}`);
  console.log(`[demo-gateway] mode: local-bounded-demo`);
});

export { server };
