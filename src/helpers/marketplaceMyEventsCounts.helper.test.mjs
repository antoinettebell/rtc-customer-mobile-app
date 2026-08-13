import assert from "node:assert/strict";
import { formatMarketplaceSubmissionCounts } from "./marketplaceMyEventsCounts.helper.js";

assert.equal(
  formatMarketplaceSubmissionCounts({ bid_count: 2, application_count: 4 }),
  "2 bids • 4 applications",
);
assert.equal(formatMarketplaceSubmissionCounts({}), "0 bids • 0 applications");

console.log("marketplace My Events count tests passed");
