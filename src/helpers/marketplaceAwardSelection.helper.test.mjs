import assert from "node:assert/strict";
import {
  getEstimatedAwardVendorCounts,
  getRemainingFoodVendorAwards,
} from "./marketplaceAwardSelection.helper.js";

assert.equal(getRemainingFoodVendorAwards({
  event: { number_of_vendors_needed: 2 },
  bids: [{ bid_status: "AWARDED", vendor_user_id: "vendor-1" }],
  applications: [{ application_status: "PAYMENT_DUE", vendor_user_id: "vendor-1" }],
}), 1, "the same vendor is counted once across a linked bid and application");

assert.equal(getRemainingFoodVendorAwards({
  event: { number_of_vendors_needed: 2 },
  bids: [{ bid_status: "AWARDED", vendor_user_id: "vendor-1" }],
  applications: [{ application_status: "CONFIRMED", vendor_user_id: "vendor-2" }],
}), 0);

assert.deepEqual(
  getEstimatedAwardVendorCounts({
    number_of_vendors_needed: 2,
    event_vendor_needs: [
      { vendor_type: "MERCHANDISE", quantity: 3 },
      { vendor_type: "SERVICE", quantity: 1 },
      { vendor_type: "OTHER", quantity: 2 },
    ],
  }),
  { foodVendorCount: 2, applicationVendorCount: 6 },
);

assert.deepEqual(
  getEstimatedAwardVendorCounts({
    number_of_vendors_needed: 1,
    event_vendor_requirement_summary: [
      { vendor_type: "MERCHANDISE", requested: 2, filled: 1, remaining: 1 },
      { vendor_type: "SERVICE", requested: 1, filled: 0, remaining: 1 },
    ],
  }),
  { foodVendorCount: 1, applicationVendorCount: 3 },
);

console.log("marketplace incremental award selection tests passed");
