/** Gateway URL for local demo */
export const GATEWAY_URL = 'http://localhost:4400';

/** Demo mode label */
export const DEMO_MODE = 'Local Demo / Gateway-Bound Demo';

/** Non-claims that must remain visible in the UI */
export const NON_CLAIMS: string[] = [
  'not production-ready',
  'not a sandbox',
  'not OS/browser/network/process/filesystem isolation',
  'not system-wide enforcement',
  'not compliance proof',
  'not security proof',
  'not full telemetry',
  'Verify does not approve',
  'Verify does not authorize',
  'Evidence does not certify compliance',
  'Deny does not prove system-wide non-execution',
  'Gateway does not grant global tool capability',
  'no external platform integration',
];

/** Allowed demo intents */
export const DEMO_INTENT = 'demo.transform_json';
export const DEMO_SCOPE = { intent: 'demo.transform_json' };
