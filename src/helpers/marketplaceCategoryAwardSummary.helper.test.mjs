import assert from "node:assert/strict";
import { getCategoryAwardSummary } from "./marketplaceCategoryAwardSummary.helper.js";

assert.deepEqual(getCategoryAwardSummary(null), {
  ga: "0 of 1 selected · 1 remaining",
  vip: null,
  desserts: null,
  drinks: null,
});
assert.deepEqual(getCategoryAwardSummary({
  number_of_guests: 100,
  catered_vip_section_enabled: true,
  dessert_caterer_required: true,
  drinks_caterer_required: true,
}, [{
  bid_status: "AWARDED",
  vendor_user_id: "vendor-1",
  awarded_coverage: "VIP",
  awarded_specialty_services: ["DESSERTS", "DRINKS"],
}]), {
  ga: "0 of 1 selected · 1 remaining",
  vip: "1 of 1 selected · 0 remaining",
  desserts: "1 of 1 selected · 0 remaining",
  drinks: "1 of 1 selected · 0 remaining",
});

console.log("customer marketplace category award-summary tests passed");
