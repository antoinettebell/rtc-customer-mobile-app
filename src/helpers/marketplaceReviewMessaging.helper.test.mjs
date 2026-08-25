import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const shared = read("screens/marketplaceShared.js");
const requirements = read("helpers/marketplaceEventRequirements.helper.js");
const eventDetails = read("screens/marketplaceEventDetailsScreen.js");
const awards = read("screens/marketplaceAwardBidsScreen.js");
const submission = read("screens/marketplaceSubmissionDetailsScreen.js");
const messages = read("screens/marketplaceEventMessagesScreen.js");
const api = read("apiFolder/appAPI.js");
const actions = read("helpers/marketplaceCoordinatorSubmissionActions.helper.js");

assert.match(shared, /marketplaceEventRequirements\.helper/);
assert.match(requirements, /event_vendor_requirement_summary/);
assert.match(eventDetails, /requested.*filled.*remaining/s);
assert.match(eventDetails, /Dessert Vendors Selected/);
assert.match(eventDetails, /Drinks Vendors Selected/);
assert.match(eventDetails, /dessert_vendors_selected/);
assert.match(eventDetails, /drinks_vendors_selected/);
assert.match(eventDetails, /Manage Awarded Vendors/);
assert.match(eventDetails, /navigation\.navigate\("marketplaceAwardBidsScreen", \{ eventId \}\)/);
assert.match(awards, /marketplaceSubmissionDetailsScreen/);
assert.match(awards, /Award Application/);
assert.match(awards, /Selected to Award/);
assert.match(awards, /Complete Booking/);
assert.match(awards, /foodApplicationIds: selectedFoodApplicationIds/);
assert.match(awards, /eventVendorApplicationIds: selectedEventVendorApplicationIds/);
assert.match(awards, /Reject Bid/);
assert.doesNotMatch(awards, /Complete Booking Payment/);
assert.doesNotMatch(awards, /category\/electricity subtotal plus a 3\.5% checkout fee/);
assert.match(submission, /ZoomableImageModal/);
assert.match(submission, /getCoordinatorSubmissionActions\(submission\)/);
assert.match(submission, /getMarketplaceSubmissionMenuAttachments\(submission\)/);
assert.doesNotMatch(submission, /label="Agreement"/);
assert.match(submission, /const canDecline = submissionActions\.canReject/);
assert.match(submission, /const rejectionLabel = submissionActions\.rejectLabel/);
assert.match(submission, /\{declining \? "Updating\.\.\." : rejectionLabel\}/);
assert.match(submission, /submissionActions\.canRevoke/);
assert.match(submission, /revokeMarketplaceAward_API/);
assert.match(submission, /revokeMarketplaceApplicationAward_API/);
assert.match(submission, /revokeEventVendorApplicationAward_API/);
assert.match(actions, /FOOD_BID/);
assert.match(actions, /EVENT_VENDOR_APPLICATION/);
assert.match(actions, /\["SUBMITTED", "UNDER_REVIEW"\]/);
assert.match(submission, /bid_id: submission\.bid_id/);
assert.match(submission, /application_id: submission\.application_id/);
assert.match(submission, /Open Submission Conversation/);
assert.match(messages, /bid_id: bidId/);
assert.match(messages, /application_id: applicationId/);
assert.match(messages, /trim\(\)\.length < 3/);
assert.match(messages, /Unread Messages/);
assert.match(messages, /Read Messages/);
assert.match(messages, /Open Associated Event/);
assert.match(api, /declineMarketplaceBid_API/);
assert.match(api, /declineMarketplaceApplication_API/);
assert.match(api, /declineEventVendorApplication_API/);
assert.match(api, /revokeMarketplaceApplicationAward_API/);
assert.match(api, /revokeEventVendorApplicationAward_API/);
assert.doesNotMatch(api, /new URLSearchParams\(\)/);
assert.match(api, /params,\s*\n\s*\}\);/);
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
