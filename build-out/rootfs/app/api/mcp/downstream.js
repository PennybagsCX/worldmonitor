// api/mcp/billing-denial.ts
var BILLING_VERIFICATION_CODES = /* @__PURE__ */ new Set([
  "subscription_lapsed",
  "renewal_verification_pending",
  "renewal_verification_failed",
  "entitlement_verification_unavailable"
]);
var BillingDenialError = class extends Error {
  operation;
  status;
  billingCode;
  retryAfterSeconds;
  constructor(label, status, billingCode, retryAfterSeconds) {
    super(`${label} HTTP ${status} (${billingCode})`);
    this.name = "BillingDenialError";
    this.operation = label;
    this.status = status;
    this.billingCode = billingCode;
    this.retryAfterSeconds = retryAfterSeconds;
  }
};
function throwIfBillingDenial(response, label) {
  if (response.ok) return;
  const marker = response.headers?.get("X-Billing-Verification");
  if (!marker || !BILLING_VERIFICATION_CODES.has(marker)) return;
  const retryHeader = response.headers?.get("Retry-After");
  const rawRetryAfter = retryHeader == null ? Number.NaN : Number(retryHeader);
  throw new BillingDenialError(
    label,
    response.status,
    marker,
    Number.isFinite(rawRetryAfter) ? rawRetryAfter : void 0
  );
}

// api/mcp/telemetry.ts
function telemetryEnabled() {
  const v = process.env.MCP_TELEMETRY;
  return v !== "false" && v !== "0";
}
function emitTelemetry(event, payload) {
  if (!telemetryEnabled()) return;
  try {
    console.log({ tag: event, ts: (/* @__PURE__ */ new Date()).toISOString(), ...payload });
  } catch {
  }
}
var MCP_TOOLCALL_TELEMETRY_KEYS = Object.freeze([
  "tag",
  "ts",
  "tool",
  "auth_kind",
  "user_id",
  "latency_ms",
  "bytes_pre_jmespath",
  "bytes_post_jmespath",
  "jmespath_used",
  "jmespath_failed",
  "ok",
  "error_kind",
  "budget_exceeded"
]);
var MCP_TOOLS_LIST_TELEMETRY_KEYS = Object.freeze([
  "tag",
  "ts",
  "auth_kind",
  "user_id",
  "tools_array_bytes",
  "tool_count",
  "client_user_agent"
]);
var MCP_RATE_LIMIT_HIT_TELEMETRY_KEYS = Object.freeze([
  "tag",
  "ts",
  "auth_kind",
  "user_id",
  "principal_id",
  "dimension",
  "limit",
  "window_seconds"
]);
var MCP_DOWNSTREAM_TELEMETRY_KEYS = Object.freeze([
  "tag",
  "ts",
  "tool",
  "auth_kind",
  "inbound_host_class",
  "downstream_origin",
  "downstream_operation",
  "status",
  "ok",
  "error_code",
  "response_marker"
]);

// api/mcp/downstream.ts
var MCP_CANONICAL_API_ORIGIN = "https://api.worldmonitor.app";
var VARIANT_HOSTS = /* @__PURE__ */ new Set([
  "tech.worldmonitor.app",
  "finance.worldmonitor.app",
  "commodity.worldmonitor.app",
  "happy.worldmonitor.app",
  "energy.worldmonitor.app"
]);
var SAFE_GATEWAY_ERROR_CODES = /* @__PURE__ */ new Set([
  "invalid_internal_mcp_signature",
  "internal_mcp_replay_cache_unavailable",
  "insufficient_entitlement",
  "entitlement_verification_unavailable",
  "subscription_lapsed",
  "renewal_verification_pending",
  "renewal_verification_failed",
  "payload_too_large",
  "rate_limited"
]);
var SAFE_GATEWAY_ERROR_MESSAGES = /* @__PURE__ */ new Map([
  ["invalid api key", "invalid_api_key"],
  ["invalid or expired session", "invalid_session"],
  ["api access requires an active subscription", "api_subscription_required"],
  ["pro subscription required", "pro_subscription_required"],
  ["unable to verify api access", "entitlement_verification_unavailable"],
  ["method not allowed", "method_not_allowed"],
  ["configuration", "configuration"]
]);
var ToolFetchError = class extends Error {
  operation;
  status;
  safeCode;
  responseMarker;
  constructor(operation, status, safeCode, responseMarker) {
    super(`${operation} HTTP ${status}: ${safeCode}`);
    this.name = "ToolFetchError";
    this.operation = operation;
    this.status = status;
    this.safeCode = safeCode;
    this.responseMarker = responseMarker;
  }
};
function classifyMcpInboundHost(hostname) {
  hostname = hostname.toLowerCase();
  if (hostname === "api.worldmonitor.app") return "canonical_api";
  if (hostname === "worldmonitor.app") return "apex";
  if (hostname === "www.worldmonitor.app") return "www";
  if (VARIANT_HOSTS.has(hostname)) return "variant";
  if (hostname.endsWith(".worldmonitor.app")) return "worldmonitor_subdomain";
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return "local";
  if (hostname.endsWith(".vercel.app")) return "vercel_preview";
  return "other";
}
function createMcpToolExecutionContext(requestUrl) {
  const inbound = new URL(requestUrl);
  const inboundHostClass = classifyMcpInboundHost(inbound.hostname);
  const isProductionWorldMonitorHost = inbound.hostname === "worldmonitor.app" || inbound.hostname.endsWith(".worldmonitor.app");
  const downstreamOrigin = isProductionWorldMonitorHost ? MCP_CANONICAL_API_ORIGIN : inbound.origin;
  return {
    inboundHostClass,
    downstreamOrigin,
    // Only the canonical public origin is recorded verbatim. Non-production
    // origins collapse to their bounded host class so preview names, local
    // ports, and self-hosted domains never enter telemetry.
    downstreamOriginTag: downstreamOrigin === MCP_CANONICAL_API_ORIGIN ? MCP_CANONICAL_API_ORIGIN : inboundHostClass
  };
}
function isLoopbackHostname(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}
function buildMcpDownstreamHeaders(targetOrigin, execution, headers) {
  if (execution?.inboundHostClass !== "local") return headers;
  let target;
  let expected;
  try {
    target = new URL(targetOrigin);
    expected = new URL(execution.downstreamOrigin);
  } catch {
    return headers;
  }
  if (target.origin !== expected.origin || !isLoopbackHostname(target.hostname)) return headers;
  const token = process.env.LOCAL_API_TOKEN?.trim();
  if (!token) return headers;
  return { ...headers, "X-WorldMonitor-Local-Token": token };
}
function contentType(response) {
  return (response.headers?.get("Content-Type") ?? "").toLowerCase();
}
function successMarker(response) {
  const type = contentType(response);
  if (type.includes("json")) return "json";
  if (type.includes("html")) return "html";
  return "other";
}
function defaultSafeErrorCode(status) {
  if (status === 401) return "auth_rejected";
  if (status === 403) return "forbidden";
  if (status === 405) return "method_not_allowed";
  if (status === 429) return "rate_limited";
  return "upstream_http_error";
}
function safeGatewayErrorCode(value, status) {
  if (typeof value !== "string") return defaultSafeErrorCode(status);
  const normalized = value.trim().toLowerCase();
  if (SAFE_GATEWAY_ERROR_CODES.has(normalized)) return normalized;
  return SAFE_GATEWAY_ERROR_MESSAGES.get(normalized) ?? defaultSafeErrorCode(status);
}
async function readBoundedResponseText(response, maxBytes = 4096) {
  const reader = response.body?.getReader();
  if (!reader) {
    const text2 = typeof response.text === "function" ? await response.text().catch(() => "") : "";
    return text2.slice(0, maxBytes);
  }
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = "";
  try {
    while (bytesRead < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      const remaining = maxBytes - bytesRead;
      const chunk = value.byteLength > remaining ? value.subarray(0, remaining) : value;
      text += decoder.decode(chunk, { stream: bytesRead + chunk.byteLength < maxBytes });
      bytesRead += chunk.byteLength;
      if (chunk.byteLength < value.byteLength) break;
    }
    text += decoder.decode();
    return text;
  } catch {
    return "";
  } finally {
    await reader.cancel().catch(() => {
    });
  }
}
async function classifyFailure(response) {
  if (response.status === 405) {
    return { errorCode: "method_not_allowed", marker: "method_not_allowed" };
  }
  const type = contentType(response);
  const detail = await readBoundedResponseText(response);
  if (!detail) {
    return {
      errorCode: defaultSafeErrorCode(response.status),
      marker: "empty_error"
    };
  }
  if (type.includes("json")) {
    try {
      const parsed = JSON.parse(detail);
      return {
        errorCode: safeGatewayErrorCode(parsed.code ?? parsed.error, response.status),
        marker: "json_error"
      };
    } catch {
      return {
        errorCode: defaultSafeErrorCode(response.status),
        marker: "json_error"
      };
    }
  }
  return {
    errorCode: defaultSafeErrorCode(response.status),
    marker: type.includes("html") ? "html_error" : "other"
  };
}
function emitDownstreamTelemetry(tool, operation, auth, execution, response, errorCode, responseMarker) {
  if (!execution) return;
  emitTelemetry("mcp.downstream", {
    tool,
    auth_kind: auth.kind,
    inbound_host_class: execution.inboundHostClass,
    downstream_origin: execution.downstreamOriginTag,
    downstream_operation: operation,
    status: response.status,
    ok: response.ok,
    error_code: errorCode,
    response_marker: responseMarker
  });
}
async function assertMcpToolFetchOk(response, observation) {
  const { operation, tool, auth, execution } = observation;
  if (response.ok) {
    emitDownstreamTelemetry(
      tool,
      operation,
      auth,
      execution,
      response,
      null,
      successMarker(response)
    );
    return;
  }
  try {
    throwIfBillingDenial(response, operation);
  } catch (error) {
    if (error instanceof BillingDenialError) {
      emitDownstreamTelemetry(
        tool,
        operation,
        auth,
        execution,
        response,
        error.billingCode,
        "billing_verification"
      );
    }
    throw error;
  }
  const failure = await classifyFailure(response);
  emitDownstreamTelemetry(
    tool,
    operation,
    auth,
    execution,
    response,
    failure.errorCode,
    failure.marker
  );
  throw new ToolFetchError(
    operation,
    response.status,
    failure.errorCode,
    failure.marker
  );
}
function classifyFailureReason(reason) {
  if (reason instanceof Error) {
    if (reason.name === "AbortError" || reason.name === "TimeoutError") return "timeout";
    const m = reason.message.match(/^HTTP (\d+)/);
    if (m) return `http_${m[1]}`;
    if (/\b(auth|secret|key|unauthorized|forbidden)\b/i.test(reason.message)) return "auth_error";
    return "error";
  }
  return reason == null ? "unknown" : String(reason);
}
function formatErrorDetail(err) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
var BothSourcesFailedError = class extends Error {
  civilianFailure;
  militaryFailure;
  civilianFailureDetail;
  militaryFailureDetail;
  constructor(civDetail, milDetail) {
    super("Airspace data unavailable: both civilian and military sources failed");
    this.name = "BothSourcesFailedError";
    this.civilianFailure = classifyFailureReason(civDetail);
    this.militaryFailure = classifyFailureReason(milDetail);
    this.civilianFailureDetail = formatErrorDetail(civDetail);
    this.militaryFailureDetail = formatErrorDetail(milDetail);
  }
};
function downstreamErrorTags(error) {
  if (error instanceof BillingDenialError) {
    return {
      downstream_operation: error.operation,
      downstream_status: String(error.status),
      downstream_error_code: error.billingCode,
      downstream_response_marker: "billing_verification"
    };
  }
  if (error instanceof ToolFetchError) {
    return {
      downstream_operation: error.operation,
      downstream_status: String(error.status),
      downstream_error_code: error.safeCode,
      downstream_response_marker: error.responseMarker
    };
  }
  if (error instanceof BothSourcesFailedError) {
    return {
      civilian_failure: error.civilianFailure,
      military_failure: error.militaryFailure
    };
  }
  return {};
}
export {
  BothSourcesFailedError,
  MCP_CANONICAL_API_ORIGIN,
  ToolFetchError,
  assertMcpToolFetchOk,
  buildMcpDownstreamHeaders,
  classifyFailureReason,
  createMcpToolExecutionContext,
  downstreamErrorTags
};
