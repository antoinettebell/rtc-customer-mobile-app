import assert from "node:assert/strict";
import { getCategoryAwardSummary } from "./marketplaceCategoryAwardSummary.helper.js";

assert.deepEqual(getCategoryAwardSummary(null), {
  ga: "0 of 1 selected · 1 remaining",
  vip: null,
  desserts: null,
  drinks: null,
  merchandise: null,
  service: null,
  other: null,
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
  merchandise: null,
  service: null,
  other: null,
});

for (const [name, awardedSpecialties, expectedDesserts, expectedDrinks] of [
  ["Desserts only", ["DESSERTS"], "1 of 1 selected · 0 remaining", "0 of 1 selected · 1 remaining"],
  ["Drinks only", ["DRINKS"], "0 of 1 selected · 1 remaining", "1 of 1 selected · 0 remaining"],
  ["No specialties", [], "0 of 1 selected · 1 remaining", "0 of 1 selected · 1 remaining"],
]) {
  const summary = getCategoryAwardSummary({
    number_of_guests: 100,
    dessert_caterer_required: true,
    drinks_caterer_required: true,
  }, [{
    bid_status: "AWARDED",
    vendor_user_id: name,
    awarded_coverage: "SPECIALTY",
    awarded_specialty_services: awardedSpecialties,
  }]);
  assert.equal(summary.desserts, expectedDesserts, `${name} fills only its offered Dessert slot`);
  assert.equal(summary.drinks, expectedDrinks, `${name} fills only its offered Drinks slot`);
}

const repairedSummaryFallback = getCategoryAwardSummary({
  number_of_guests: 100,
  dessert_caterer_required: true,
}, [{
  bid_status: "AWARDED",
  vendor_user_id: "existing-award",
  awarded_coverage: "VIP",
  awarded_specialty_services: [],
  specialty_services: ["DESSERTS"],
}]);
assert.equal(
  repairedSummaryFallback.desserts,
  "1 of 1 selected · 0 remaining",
  "an older award with an empty persisted specialty list still reflects its offered specialty"
);

const combinedAwardSummary = getCategoryAwardSummary({
  number_of_guests: 200,
  catered_vip_section_enabled: true,
}, [{
  bid_status: "AWARDED",
  vendor_user_id: { _id: "jazzy-user" },
  awarded_coverage: "BOTH",
}, {
  bid_status: "AWARDED",
  vendor_user_id: { _id: "pizza-user" },
  awarded_coverage: "REGULAR",
}], [{
  application_status: "CONFIRMED",
  vendor_user_id: { _id: "jazzy-user" },
}]);
assert.equal(
  combinedAwardSummary.ga,
  "2 of 2 selected · 0 remaining",
  "two populated Food Vendor records count as two distinct GA selections"
);
assert.equal(
  combinedAwardSummary.vip,
  "1 of 1 selected · 0 remaining",
  "the combined bid still fills the VIP selection"
);

const marketplaceVendorSummary = getCategoryAwardSummary({
  number_of_guests: 100,
  event_vendor_needs: [
    { vendor_type: "MERCHANDISE", quantity: 1 },
    { vendor_type: "SERVICE", quantity: 2 },
  ],
}, [], [{
  application_status: "AWARDED",
  vendor_user_id: "merchandise-vendor",
  vendor_types: ["MERCHANDISE"],
}]);
assert.equal(
  marketplaceVendorSummary.merchandise,
  "1 of 1 selected · 0 remaining",
  "Marketplace Vendor awards show their selected and requested quantities",
);
assert.equal(
  marketplaceVendorSummary.service,
  "0 of 2 selected · 2 remaining",
  "unawarded Marketplace Vendor needs remain visible",
);
assert.equal(marketplaceVendorSummary.other, null);

console.log("customer marketplace category award-summary tests passed");
