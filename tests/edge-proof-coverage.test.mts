import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import {
  hasUnprovenCloudflareClientIp as serverUnproven,
  hasCloudflareTransitProof as serverProof,
  getClientIp as getServerClientIp,
  resetEdgeProofMismatchWarnedForTest as resetServer,
} from '../server/_shared/client-ip.ts';
import {
  hasUnprovenCloudflareClientIp as apiUnproven,
  hasCloudflareTransitProof as apiProof,
  getClientIp as getApiClientIp,
  resetEdgeProofMismatchWarnedForTest as resetApi,
} from '../api/_client-ip.js';
import {
  checkEndpointRateLimit,
  ENDPOINT_RATE_POLICIES,
  resetEdgeProofRateLimitReportedForTest as resetServerEdgeProofReport,
} from '../server/_shared/rate-limit.ts';
import {
  EDGE_PROOF_TRANSFORM_EXPRESSION,
  EDGE_PROOF_PATH_PREFIXES,
} from '../scripts/cloudflare-edge-proof-rule.mjs';

afterEach(() => {
  delete process.env.CF_EDGE_PROOF_SECRET;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  resetServer();
  resetApi();
  resetServerEdgeProofReport();
});

function requestWith(headers) {
  return new Request('https://worldmonitor.app/api/skills/fetch-agentskills', { headers });
}

describe('unproven Cloudflare client IP (#8402)', () => {
  it('is false when the edge-proof secret is unset', () => {
    const req = requestWith({
      'cf-connecting-ip': '203.0.113.7',
      'x-real-ip': '192.0.2.5',
    });
    assert.equal(serverUnproven(req), false);
    assert.equal(apiUnproven(req), false);
  });

  it('is false for a true direct-origin request with no cf-connecting-ip', () => {
    process.env.CF_EDGE_PROOF_SECRET = 'edge-secret-xyz';
    const req = requestWith({ 'x-real-ip': '198.51.100.9' });
    assert.equal(serverUnproven(req), false);
    assert.equal(getServerClientIp(req), '198.51.100.9');
  });

  it('is true for a direct-to-Vercel spoof of cf-connecting-ip', () => {
    process.env.CF_EDGE_PROOF_SECRET = 'edge-secret-xyz';
    const req = requestWith({
      'cf-connecting-ip': '203.0.113.7',
      'x-real-ip': '198.51.100.9',
      'x-wm-edge-proof': 'wrong',
    });
    assert.equal(serverUnproven(req), true);
    assert.equal(apiUnproven(req), true);
    assert.equal(serverProof(req), false);
    assert.equal(apiProof(req), false);
    // getClientIp still refuses the forged CF IP…
    assert.equal(getApiClientIp(req), '198.51.100.9');
  });

  it('is false when the Transform Rule proof matches', () => {
    process.env.CF_EDGE_PROOF_SECRET = 'edge-secret-xyz';
    const req = requestWith({
      'cf-connecting-ip': '203.0.113.7',
      'x-real-ip': '173.245.48.1',
      'x-wm-edge-proof': 'edge-secret-xyz',
    });
    assert.equal(serverUnproven(req), false);
    assert.equal(getServerClientIp(req), '203.0.113.7');
  });
});

describe('IP-scoped endpoint rate limits reject unproven CF client IP (#8402)', () => {
  it('returns 403 instead of trusting a forged cf-connecting-ip', async () => {
    process.env.CF_EDGE_PROOF_SECRET = 'edge-secret-xyz';
    // Intentionally omit Upstash env: the edge-proof gate must fire before the
    // Redis availability check so fail-open Redis outages cannot re-admit spoofs.
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const pathname = '/api/skills/fetch-agentskills';
    assert.ok(pathname in ENDPOINT_RATE_POLICIES, 'fixture path must carry an endpoint policy');

    const response = await checkEndpointRateLimit(
      requestWith({
        'cf-connecting-ip': '203.0.113.7',
        'x-real-ip': '198.51.100.9',
      }),
      pathname,
      {},
      { failClosed: false },
    );

    assert.ok(response, 'must reject rather than admit');
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('X-RateLimit-Mode'), 'edge-proof');
    assert.deepEqual(await response.json(), { error: 'Cloudflare edge proof required' });
  });

  it('does not reject when a principal-scoped budget is in use', async () => {
    process.env.CF_EDGE_PROOF_SECRET = 'edge-secret-xyz';
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

    // Without Redis actually answering, principal path still hits missing-config
    // only when Redis client construction fails — here URL/token are set so the
    // limiter constructs; the unproven CF header must not short-circuit to 403
    // when principalUserId is supplied. We only assert the edge-proof branch is
    // skipped by checking status is not 403 with X-RateLimit-Mode edge-proof.
    const response = await checkEndpointRateLimit(
      requestWith({
        'cf-connecting-ip': '203.0.113.7',
        'x-real-ip': '198.51.100.9',
      }),
      '/api/skills/fetch-agentskills',
      {},
      { principalUserId: 'user_test_principal' },
    );

    if (response) {
      assert.notEqual(response.headers.get('X-RateLimit-Mode'), 'edge-proof');
    }
  });
});

describe('Cloudflare edge-proof Transform Rule coverage (#8402)', () => {
  it('documents path prefixes that must receive x-wm-edge-proof', () => {
    assert.match(EDGE_PROOF_TRANSFORM_EXPRESSION, /api\|mcp\|ask\|oauth\|a2a/);
    assert.deepEqual(EDGE_PROOF_PATH_PREFIXES, ['/api/', '/mcp', '/ask', '/oauth/', '/a2a']);
  });

  it('covers every ENDPOINT_RATE_POLICIES path with the published expression', () => {
    const covered = (pathname) => /^\/(api|mcp|ask|oauth|a2a)(\/|$)/.test(pathname);
    for (const pathname of Object.keys(ENDPOINT_RATE_POLICIES)) {
      assert.ok(
        covered(pathname),
        `${pathname} must match the Transform Rule expression ${EDGE_PROOF_TRANSFORM_EXPRESSION}`,
      );
    }
  });
});
