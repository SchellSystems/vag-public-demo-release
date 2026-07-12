import { timingSafeEqual } from 'node:crypto';

const HEX64_RE = /^[0-9a-f]{64}$/;

/**
 * Check supplied and stored signatures against one expected record HMAC.
 * This internal helper is pure and does not access gateway state.
 */
export function verifySignatureRelationships(
  expectedSignature,
  suppliedSignature,
  storedSignature,
) {
  if (!HEX64_RE.test(expectedSignature)) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const matchesExpected = (candidate) => (
    typeof candidate === 'string' &&
    HEX64_RE.test(candidate) &&
    timingSafeEqual(Buffer.from(candidate, 'hex'), expectedBuffer)
  );

  return matchesExpected(suppliedSignature) && matchesExpected(storedSignature);
}
