/**
 * Test-only resolve hook for Node type-stripping.
 *
 * demo-ui TypeScript sources use extensionless relative imports
 * (bundler resolution). Node ESM requires an explicit extension.
 * This hook appends ".ts" for relative bare imports during tests so
 * the real production modules can be imported without rewriting them.
 *
 * Not a production runtime dependency.
 */

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
