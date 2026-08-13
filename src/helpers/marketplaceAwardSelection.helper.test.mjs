import assert from "node:assert/strict";
import { getRemainingFoodVendorAwards } from "./marketplaceAwardSelection.helper.js";

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

console.log("marketplace incremental award selection tests passed");
