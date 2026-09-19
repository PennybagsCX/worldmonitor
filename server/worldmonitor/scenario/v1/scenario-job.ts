import type { PremiumCallerIdentity } from '../../../_shared/premium-check';
import { hashKeySync } from '../../../_shared/usage-identity';

/**
 * New jobs use a 128-bit hex suffix. The 8-character form stays valid so
 * in-flight jobs and published examples still parse.
 */
export const JOB_ID_RE = /^scenario:\d{13}:(?:[a-f0-9]{32}|[a-z0-9]{8})$/;

/** hashKeySync output: two base36 uint32s, no separators. */
export const OWNER_TOKEN_RE = /^[a-z0-9]{1,16}$/;

export const SCENARIO_RESULT_TTL_SECONDS = 86400;

export function generateScenarioJobId(now = Date.now()): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let suffix = '';
  for (const byte of bytes) suffix += byte.toString(16).padStart(2, '0');
  return `scenario:${now}:${suffix}`;
}

export function scenarioOwnerKey(jobId: string): string {
  return `scenario-owner:${jobId}`;
}

export function scenarioResultKey(owner: string, jobId: string): string {
  return `scenario-result:${owner}:${jobId}`;
}

/**
 * Principal token stored beside the job. User-bound callers share one token
 * so a person can poll a job they enqueued with a different credential.
 * Enterprise keys have no user id; hash the presented key instead of writing
 * it raw. Returns null when premium was granted without a bindable principal.
 */
export function scenarioOwnerToken(
  identity: PremiumCallerIdentity,
  request: Request,
): string | null {
  if (!identity.isPremium) return null;
  if (identity.userId) {
    const token = hashKeySync(`user:${identity.userId}`);
    return OWNER_TOKEN_RE.test(token) ? token : null;
  }
  const presented =
    request.headers.get('X-WorldMonitor-Key') ??
    request.headers.get('X-Api-Key') ??
    '';
  if (!presented) return null;
  const token = hashKeySync(`key:${presented}`);
  return OWNER_TOKEN_RE.test(token) ? token : null;
}
