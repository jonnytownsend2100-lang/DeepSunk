import assert from "node:assert/strict";
import test from "node:test";
import { DEV_STANDIN_FILE_ID, developmentRequestId, isDevelopmentRequestId, liveXaiBillingEnabled } from "./billing.ts";

test("workspace preview never enables billed xAI calls", () => {
  assert.equal(liveXaiBillingEnabled(true), false);
  assert.equal(liveXaiBillingEnabled(false), true);
});

test("development request ids stay local and recognizable", () => {
  const id = developmentRequestId("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
  assert.equal(isDevelopmentRequestId(id), true);
  assert.equal(isDevelopmentRequestId("req_live_12345678"), false);
  assert.match(DEV_STANDIN_FILE_ID, /^file_[A-Za-z0-9_-]{8,128}$/);
});
