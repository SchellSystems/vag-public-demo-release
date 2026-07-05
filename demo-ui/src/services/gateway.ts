/**
 * Gateway client service.
 * All calls go to the local demo gateway. No external HTTP calls.
 */

import { GATEWAY_URL } from '../constants';
import type { HealthResult, ProposeResult, CommitResult, VerifyResult } from '../types';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(`${data.error}: ${data.message}`);
  }
  return data as T;
}

async function postRaw<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<T>;
}

export async function checkHealth(): Promise<HealthResult> {
  const res = await fetch(`${GATEWAY_URL}/health`);
  return res.json();
}

export async function proposeAllow(): Promise<ProposeResult> {
  return post<ProposeResult>('/propose', {
    scope: { intent: 'demo.transform_json' },
    payload: { demo: true },
  });
}

export async function proposeDeny(): Promise<ProposeResult> {
  return postRaw<ProposeResult>('/propose', {
    scope: { intent: 'demo.forbidden_action' },
    payload: { demo: true },
  });
}

export async function proposeTopLevelOnlyForNegativeTest(): Promise<{ error: string; message: string }> {
  return postRaw<{ error: string; message: string }>('/propose', {
    intent: 'demo.transform_json',
    payload: { demo: true },
  });
}

export async function commitProposal(proposalId: string, decisionId: string, outputDigest: string): Promise<CommitResult> {
  return post<CommitResult>('/commit', {
    proposal_id: proposalId,
    decision_id: decisionId,
    output_digest: outputDigest,
  });
}

export async function verifyRecord(recordHash: string, signature: string): Promise<VerifyResult> {
  return post<VerifyResult>('/verify', {
    record_hash: recordHash,
    signature,
  });
}
