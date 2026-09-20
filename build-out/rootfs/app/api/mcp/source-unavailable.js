// api/mcp/source-unavailable.ts
var McpSourceUnavailableError = class extends Error {
  unavailableInputs;
  failedInputs;
  constructor(message, unavailableInputs, failedInputs) {
    super(message);
    this.name = "McpSourceUnavailableError";
    this.unavailableInputs = [...unavailableInputs];
    this.failedInputs = [...failedInputs];
  }
};
export {
  McpSourceUnavailableError
};
