/**
 * Test-only resolve and load hooks for TypeScript production modules.
 *
 * demo-ui TypeScript sources use extensionless relative imports
 * (bundler resolution). Node ESM requires an explicit extension.
 * The resolve hook appends ".ts" for relative bare imports.
 *
 * Node 20 does not natively strip TypeScript syntax. The load hook uses
 * demo-ui's existing TypeScript dev dependency to transpile the real
 * production modules in memory for tests. No production predicates are copied.
 *
 * Not a production runtime dependency.
 */

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const requireFromUi = createRequire(
  new URL('../demo-ui/package.json', import.meta.url),
);
const ts = requireFromUi('typescript');

export async function resolve(specifier, context, nextResolve) {
  if (
    specifier.startsWith('.') &&
    !/\.(mjs|cjs|js|ts|json|node|wasm)$/.test(specifier)
  ) {
    try {
      return await nextResolve(specifier + '.ts', context);
    } catch {
      // fall through to default resolution
    }
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (!url.endsWith('.ts')) {
    return nextLoad(url, context);
  }

  const filename = fileURLToPath(url);
  const source = await readFile(filename, 'utf8');
  const result = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    reportDiagnostics: false,
  });

  return {
    format: 'module',
    source: result.outputText,
    shortCircuit: true,
  };
}
