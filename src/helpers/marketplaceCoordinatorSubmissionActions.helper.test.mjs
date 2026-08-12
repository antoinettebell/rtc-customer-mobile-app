import assert from "node:assert/strict";
import { getCoordinatorSubmissionActions } from "./marketplaceCoordinatorSubmissionActions.helper.js";

assert.deepEqual(
  getCoordinatorSubmissionActions({ bid_id: "bid-1", bid_status: "SUBMITTED" }),
  {
    kind: "FOOD_BID", status: "SUBMITTED", canReject: true,
    rejectLabel: "Reject Bid", canRevoke: false, paidRevocationBlocked: false,
  }
);
assert.equal(getCoordinatorSubmissionActions({
  application_id: "food-app-1", application_status: "UNDER_REVIEW",
}).rejectLabel, "Reject Application");
assert.equal(getCoordinatorSubmissionActions({
  application_id: "event-app-1", profile_id: "profile-1",
  vendor_types: ["MERCHANDISE"], status: "SUBMITTED",
}).canReject, true);
assert.equal(getCoordinatorSubmissionActions({
  bid_id: "bid-1", bid_status: "AWARDED", payment_status: "NOT_REQUIRED",
}).canRevoke, true);
assert.equal(getCoordinatorSubmissionActions({
  application_id: "event-app-1", profile_id: "profile-1",
  vendor_types: ["SERVICE"], status: "PAYMENT_DUE",
}).canRevoke, true);
const paid = getCoordinatorSubmissionActions({
  application_id: "food-app-1", application_status: "PAID", payment_status: "PAID",
});
assert.equal(paid.canRevoke, false);
assert.equal(paid.paidRevocationBlocked, true);

console.log("coordinator submission action tests passed");
