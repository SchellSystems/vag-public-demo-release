/**
 * VAG Demo Gateway — HTTP Server
 *
 * Minimal HTTP server wrapping the core gateway logic.
 * No external dependencies. No cloud. No shell. No HTTP client imports.
 * CORS restricted to demo-ui origin only.
 *
 * Default bind: 127.0.0.1 (loopback). This is NOT a sandbox, isolation,
 * or authentication boundary.
 *
 * Exports startDemoServer() for programmatic use (desktop mode).
 * When run directly (node server.mjs), starts with env-based or default config.
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { health, propose, commit, verify, reset } from './core.mjs';

const MAX_BODY_BYTES = 65536; // 64 KB

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function createCorsHeaders(allowedOrigin) {
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(res, status, data, allowedOrigin) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    ...createCorsHeaders(allowedOrigin),
    'Content-Type': 'application/json',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalLength = 0;
    let tooLarge = false;
    let settled = false;

    req.on('data', (chunk) => {
      if (tooLarge) {
        return;
      }
      totalLength += chunk.length;
      if (totalLength > MAX_BODY_BYTES) {
        tooLarge = true;
        chunks.length = 0;
        if (!settled) {
          settled = true;
          reject(new Error('payload_too_large'));
        }
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge || settled) return;
      settled = true;
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
  });
}

/**
 * Serve a static file from staticDir, path-secured.
 * Returns true if file was served, false if not found.
 */
function serveStatic(req, res, staticDir) {
  if (!staticDir) return false;

  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  // Path traversal protection: resolve and confirm within staticDir
  const resolved = join(staticDir, urlPath);
  if (!resolved.startsWith(staticDir)) return false;

  if (!existsSync(resolved)) return false;

  try {
    const stat = statSync(resolved);
    if (!stat.isFile()) return false;
  } catch {
    return false;
  }

  const ext = extname(resolved);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = readFileSync(resolved);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
    return true;
  } catch {
    return false;
  }
}

/**
 * Start the demo gateway server.
 *
 * @param {object} [options]
 * @param {string} [options.host='127.0.0.1'] - Bind host (always loopback for desktop)
 * @param {number} [options.port=4400] - Bind port (0 for OS-assigned)
 * @param {string} [options.allowedOrigin] - CORS origin (auto-derived in desktop mode)
 * @param {string|null} [options.staticDir=null] - Directory for serving static UI files
 * @returns {Promise<{ server: import('node:http').Server, address: { host: string, port: number }, url: string, close: () => Promise<void> }>}
 */
export function startDemoServer(options = {}) {
  const host = options.host || '127.0.0.1';
  const port = options.port ?? 4400;
  const staticDir = options.staticDir || null;

  return new Promise((resolve, reject) => {
    // allowedOrigin will be finalized after we know the actual port
    let allowedOrigin = options.allowedOrigin || null;

    function createHandler(origin) {
      return async function handleRequest(req, res) {
        const { method, url } = req;

        // CORS preflight
        if (method === 'OPTIONS') {
          res.writeHead(204, createCorsHeaders(origin));
          res.end();
          return;
        }

        // API routes first
        if (method === 'GET' && url === '/health') {
          json(res, 200, health(), origin);
          return;
        }

        if (method === 'POST' && url === '/propose') {
          try {
            const body = await readBody(req);
            const result = propose(body);
            const status = result.error ? 400 : 200;
            json(res, status, result, origin);
          } catch (e) {
            if (e.message === 'payload_too_large') {
              json(res, 413, { error: 'payload_too_large', message: 'Request body exceeds 64 KB limit.' }, origin);
            } else {
              json(res, 400, { error: 'parse_error', message: e.message }, origin);
            }
          }
          return;
        }

        if (method === 'POST' && url === '/commit') {
          try {
            const body = await readBody(req);
            const result = commit(body);
            const status = result.error ? 400 : 200;
            json(res, status, result, origin);
          } catch (e) {
            if (e.message === 'payload_too_large') {
              json(res, 413, { error: 'payload_too_large', message: 'Request body exceeds 64 KB limit.' }, origin);
            } else {
              json(res, 400, { error: 'parse_error', message: e.message }, origin);
            }
          }
          return;
        }

        if (method === 'POST' && url === '/verify') {
          try {
            const body = await readBody(req);
            const result = verify(body);
            const status = result.error ? 400 : 200;
            json(res, status, result, origin);
          } catch (e) {
            if (e.message === 'payload_too_large') {
              json(res, 413, { error: 'payload_too_large', message: 'Request body exceeds 64 KB limit.' }, origin);
            } else {
              json(res, 400, { error: 'parse_error', message: e.message }, origin);
            }
          }
          return;
        }

        if (method === 'POST' && url === '/reset') {
          reset();
          json(res, 200, { status: 'reset', message: 'In-memory state cleared.' }, origin);
          return;
        }

        // Static file serving (SPA fallback) — only for GET, only if staticDir configured
        if (method === 'GET' && staticDir) {
          if (serveStatic(req, res, staticDir)) return;

          // SPA fallback: serve index.html for non-API, non-file paths
          const indexPath = join(staticDir, 'index.html');
          if (existsSync(indexPath)) {
            try {
              const content = readFileSync(indexPath);
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(content);
              return;
            } catch {
              // fall through to 404
            }
          }
        }

        // Default: deny unknown routes/methods
        json(res, 404, { error: 'not_found', message: 'Unknown endpoint. Deny by default.' }, origin);
      };
    }

    const server = createServer((req, res) => {
      // Delegate to handler — origin is resolved at listen time
      createHandler(allowedOrigin)(req, res);
    });

    server.on('error', (err) => {
      reject(err);
    });

    server.listen(port, host, () => {
      const addr = server.address();
      const actualHost = addr.address;
      const actualPort = addr.port;

      // For URL construction and CORS, use the requested host if it differs
      // from the resolved address (e.g. 'localhost' → '127.0.0.1').
      const displayHost = host || actualHost;

      // If no explicit origin was provided, use same-origin (desktop mode)
      if (!allowedOrigin) {
        allowedOrigin = `http://${actualHost}:${actualPort}`;
      }

      const url = `http://${displayHost}:${actualPort}`;

      console.log(`[demo-gateway] listening on ${url}`);
      console.log(`[demo-gateway] CORS origin: ${allowedOrigin}`);
      console.log(`[demo-gateway] mode: local-bounded-demo`);
      if (staticDir) {
        console.log(`[demo-gateway] static dir: ${staticDir}`);
      }

      resolve({
        server,
        address: { host: actualHost, port: actualPort },
        url,
        close: () => new Promise((res, rej) => {
          server.close((err) => err ? rej(err) : res());
        }),
      });
    });
  });
}

// --- CLI entry point (preserves existing behavior) ---
// Detect if this module is the entry point (node server.mjs)
function _isEntryModule() {
  if (process.env.__DEMO_GATEWAY_PROGRAMMATIC__) return false;
  if (process.env.__DEMO_GATEWAY_CLI__ === '1') return true;
  if (!process.argv[1]) return false;
  // Normalize paths for comparison
  const scriptUrl = import.meta.url;
  const argPath = process.argv[1].replace(/\\/g, '/');
  return (
    scriptUrl === `file://${argPath}` ||
    scriptUrl === `file:///${argPath}` ||
    scriptUrl.endsWith(argPath.split('/').pop())
  );
}

if (_isEntryModule()) {
  const HOST = process.env.DEMO_GATEWAY_HOST || '127.0.0.1';
  const PORT = parseInt(process.env.DEMO_GATEWAY_PORT || '4400', 10);
  const ALLOWED_ORIGIN = process.env.DEMO_UI_ORIGIN || 'http://127.0.0.1:5173';

  startDemoServer({ host: HOST, port: PORT, allowedOrigin: ALLOWED_ORIGIN }).catch((err) => {
    console.error(`[demo-gateway] Failed to start: ${err.message}`);
    process.exit(1);
  });
}
