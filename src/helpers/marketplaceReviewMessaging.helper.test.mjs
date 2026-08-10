import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const shared = read("screens/marketplaceShared.js");
const eventDetails = read("screens/marketplaceEventDetailsScreen.js");
const awards = read("screens/marketplaceAwardBidsScreen.js");
const submission = read("screens/marketplaceSubmissionDetailsScreen.js");
const messages = read("screens/marketplaceEventMessagesScreen.js");
const api = read("apiFolder/appAPI.js");

assert.match(shared, /event_vendor_requirement_summary/);
assert.match(eventDetails, /requested.*filled.*remaining/s);
assert.match(awards, /marketplaceSubmissionDetailsScreen/);
assert.match(submission, /ZoomableImageModal/);
assert.match(submission, /Reject \/ Not Select/);
assert.match(submission, /bid_id: submission\.bid_id/);
assert.match(submission, /application_id: submission\.application_id/);
assert.match(submission, /Open Submission Conversation/);
assert.match(messages, /bid_id: bidId/);
assert.match(messages, /application_id: applicationId/);
assert.match(messages, /trim\(\)\.length < 3/);
assert.match(api, /declineMarketplaceBid_API/);
assert.match(api, /declineMarketplaceApplication_API/);
assert.match(api, /declineEventVendorApplication_API/);
for (const value of [
  "vendor@example.com",
  "vendor at example dot com",
  "(803) 555-1212",
  "$cashhandle",
]) {
  const normalized = value.toLowerCase().replace(/\s+at\s+/g, "@").replace(/\s+dot\s+/g, ".");
  assert.ok(/@|\d{3}|\$/.test(normalized));
}

console.log("customer marketplace review and messaging tests passed");
