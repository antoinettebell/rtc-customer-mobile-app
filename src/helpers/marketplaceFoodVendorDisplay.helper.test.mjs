import assert from "node:assert/strict";
import { getLockedFoodVendorDisplayName } from "./marketplaceFoodVendorDisplay.helper.js";

assert.equal(
  getLockedFoodVendorDisplayName("Vendor RTC - 70C80B"),
  "Vendor RTC - 70C80B",
  "the backend-provided canonical Food Vendor Profile suffix is displayed unchanged"
);
assert.equal(
  getLockedFoodVendorDisplayName(null),
  "Vendor RTC - MASKED",
  "the client never derives a support code from bid, application, event, user, or food-truck fields"
);

console.log("customer Food Vendor display ID tests passed");
