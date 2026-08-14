import assert from "node:assert/strict";
import {
  getCoordinatorRevocationErrorAlert,
  getCoordinatorSubmissionActions,
} from "./marketplaceCoordinatorSubmissionActions.helper.js";

assert.deepEqual(
  getCoordinatorSubmissionActions({ bid_id: "bid-1", bid_status: "SUBMITTED" }),
  {
    kind: "FOOD_BID", status: "SUBMITTED", canAward: true, canReject: true,
    rejectLabel: "Reject Bid", canRevoke: false, paymentPending: false,
    paidRevocationBlocked: false,
  }
);
assert.equal(getCoordinatorSubmissionActions({
  application_id: "food-app-1", application_status: "UNDER_REVIEW",
}).rejectLabel, "Reject Application");
assert.equal(getCoordinatorSubmissionActions({
  application_id: "event-app-1", profile_id: "profile-1",
  vendor_types: ["MERCHANDISE"], status: "SUBMITTED",
}).canReject, true);
assert.deepEqual(
  getCoordinatorSubmissionActions({
    application_id: "event-app-hydrated", profile_id: "profile-1",
    vendor_types: ["SERVICE"], application_status: "under_review",
  }),
  {
    kind: "EVENT_VENDOR_APPLICATION", status: "UNDER_REVIEW",
    canAward: true, canReject: true, rejectLabel: "Reject Application",
    canRevoke: false, paymentPending: false, paidRevocationBlocked: false,
  }
);
assert.equal(getCoordinatorSubmissionActions({
  bid_id: "bid-1", bid_status: "AWARDED", payment_status: "NOT_REQUIRED",
}).canRevoke, true);
assert.equal(getCoordinatorSubmissionActions({
  application_id: "event-app-1", profile_id: "profile-1",
  vendor_types: ["SERVICE"], status: "PAYMENT_DUE",
}).canRevoke, false);
assert.equal(getCoordinatorSubmissionActions({
  application_id: "event-app-1", profile_id: "profile-1",
  vendor_types: ["SERVICE"], status: "PAYMENT_DUE",
}).paymentPending, true);
const paid = getCoordinatorSubmissionActions({
  application_id: "food-app-1", application_status: "PAID", payment_status: "PAID",
});
assert.equal(paid.canRevoke, true);

const coordinatorPaidFoodBid = getCoordinatorSubmissionActions({
  bid_id: "bid-awarded",
  bid_status: "AWARDED",
  payment_status: "PAID",
});
assert.equal(coordinatorPaidFoodBid.canRevoke, true);
assert.equal(coordinatorPaidFoodBid.paidRevocationBlocked, false);

const vendorFeePaidFoodBid = getCoordinatorSubmissionActions({
  bid_id: "bid-awarded",
  bid_status: "AWARDED",
  payment_status: "PAID",
  linked_vendor_payment_status: "PAID",
});
assert.equal(vendorFeePaidFoodBid.canRevoke, true);
assert.equal(vendorFeePaidFoodBid.paidRevocationBlocked, false);
assert.equal(paid.paidRevocationBlocked, false);

assert.equal(getCoordinatorSubmissionActions({
  application_id: "event-app-processing", profile_id: "profile-1",
  vendor_types: ["MERCHANDISE"], status: "PAYMENT_DUE", payment_status: "PROCESSING",
}).canRevoke, false);

assert.deepEqual(
  getCoordinatorRevocationErrorAlert({ message: "Awards cannot be revoked at or within 72 hours of the event start." }),
  {
    title: "Revocation Window Closed",
    message: "Awards cannot be revoked at or within 72 hours of the event start. No award or payment changes were made.",
  }
);
assert.deepEqual(
  getCoordinatorRevocationErrorAlert({ message: "The vendor fee payment is still processing." }),
  {
    title: "Payment Processing",
    message: "The vendor payment is still processing. No award or payment changes were made. Try again after its final processor status is available.",
  }
);
assert.deepEqual(
  getCoordinatorRevocationErrorAlert({ message: "Gateway declined refund" }),
  {
    title: "Refund Not Completed",
    message: "Gateway declined refund. The award remains active and the vendor slot was not released.",
  }
);
assert.deepEqual(
  getCoordinatorRevocationErrorAlert({ data: { message: "Temporary server failure" } }),
  { title: "Unable to Revoke Award", message: "Temporary server failure" }
);

console.log("coordinator submission action tests passed");
