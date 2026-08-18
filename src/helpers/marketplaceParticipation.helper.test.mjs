import assert from "node:assert/strict";
import {
  getMarketplaceBudget,
  getMarketplaceVendorCapacity,
  getMarketplaceServiceRequirements,
  getMarketplaceFilledSlotSummary,
  getVendorReductionProtection,
  getTicketInventory,
  isTicketInventorySoldOut,
  isFoodVendorMarketplaceEvent,
} from "./marketplaceParticipation.helper.js";

assert.equal(isFoodVendorMarketplaceEvent({ service_types: ["Food Truck"] }), true);
assert.equal(isFoodVendorMarketplaceEvent({ service_type: "Full-Service Catering" }), true);
assert.equal(isFoodVendorMarketplaceEvent({ primary_service_style: "Plated" }), true);
assert.equal(isFoodVendorMarketplaceEvent({ service_types: ["Photography"] }), false);
assert.equal(
  getMarketplaceVendorCapacity({ number_of_guests: 50 }).calculatedMaximum,
  1,
  "fifty guests cannot authorize two Food Vendors",
);

const fullyCatered = {
  number_of_guests: 150,
  vip_section_enabled: true,
  vip_guest_count: 50,
  fully_catered_event: true,
};
assert.deepEqual(getMarketplaceBudget(fullyCatered), {
  gaGuests: 150,
  vipGuests: 50,
  cateredGuests: 200,
  minimumBudget: 5000,
});
assert.deepEqual(getMarketplaceVendorCapacity(fullyCatered), {
  gaMaximum: 2,
  vipRequirement: 1,
  calculatedMaximum: 2,
});
assert.deepEqual(getMarketplaceServiceRequirements(fullyCatered), {
  gaRequirement: 2,
  vipRequirement: 1,
});
const fullyCateredGaOnly = {
  number_of_guests: 150,
  vip_section_enabled: false,
  vip_guest_count: 50,
  fully_catered_event: true,
};
assert.deepEqual(getMarketplaceVendorCapacity(fullyCateredGaOnly), {
  gaMaximum: 2,
  vipRequirement: 0,
  calculatedMaximum: 2,
});
assert.deepEqual(getMarketplaceServiceRequirements(fullyCateredGaOnly), {
  gaRequirement: 2,
  vipRequirement: 0,
});

const mixed = {
  number_of_guests: 150,
  vip_section_enabled: true,
  vip_guest_count: 50,
  catered_vip_section_enabled: true,
  ga_food_sales_allowed: true,
};
assert.equal(getMarketplaceBudget(mixed).minimumBudget, 1250);
assert.deepEqual(getMarketplaceVendorCapacity(mixed), {
  gaMaximum: 2,
  vipRequirement: 1,
  calculatedMaximum: 2,
});
assert.equal(
  getMarketplaceVendorCapacity({ ...mixed, separate_vip_vendor_required: true })
    .calculatedMaximum,
  3,
);
assert.deepEqual(getVendorReductionProtection({ requested: 1, filledMinimum: 2 }), {
  blocked: true,
  minimum: 2,
});
assert.equal(getVendorReductionProtection({ requested: 2, filledMinimum: 2 }).blocked, false);
assert.equal(
  getVendorReductionProtection({
    requested: 2,
    filledMinimum: 2,
    gaRequirement: 1,
    gaFilled: 2,
    vipRequirement: 1,
    vipFilled: 0,
  }).blocked,
  true,
);
assert.equal(
  getMarketplaceBudget({ ...mixed, ga_ticket_quantity: 999 }).minimumBudget,
  1250,
);
assert.deepEqual(
  getTicketInventory({
    ga_ticket_quantity: 125,
    ga_tickets_sold: 20,
    ga_tickets_reserved: 5,
  }),
  { capacity: 125, sold: 20, reserved: 5, remaining: 100 },
);
assert.deepEqual(
  getTicketInventory(null),
  { capacity: 0, sold: 0, reserved: 0, remaining: 0 },
  "ticket inventory should remain safe while the event is still loading",
);
assert.equal(
  isTicketInventorySoldOut(null),
  false,
  "an event that has not loaded must not render as sold out",
);
assert.equal(
  isTicketInventorySoldOut({
    ga_ticket_quantity: 2,
    ga_tickets_sold: 2,
    vip_ticket_quantity: 1,
    vip_tickets_reserved: 1,
  }),
  true,
);
assert.equal(
  isTicketInventorySoldOut({
    ga_ticket_quantity: 2,
    ga_tickets_sold: 1,
  }),
  false,
);
assert.deepEqual(
  getMarketplaceFilledSlotSummary({
    gaSlotsFilled: 1,
    vipSlotsFilled: 1,
    combinedVendors: 1,
    gaRequirement: 2,
    vipRequirement: 1,
  }),
  {
    gaSlotsFilled: 1,
    vipSlotsFilled: 1,
    combinedVendors: 1,
    separateVipVendorRequired: false,
    minimumUniqueVendors: 1,
    totalServiceSlotsRequired: 3,
    totalServiceSlotsFilled: 2,
    remainingGaSlots: 1,
    remainingVipSlots: 0,
    remainingTotalServiceSlots: 1,
    remainingUniqueVendors: 1,
  },
);
assert.deepEqual(
  getMarketplaceFilledSlotSummary({
    gaSlotsFilled: 1,
    vipSlotsFilled: 1,
    combinedVendors: 1,
    separateVipVendorRequired: true,
    gaRequirement: 1,
    vipRequirement: 1,
  }),
  {
    gaSlotsFilled: 1,
    vipSlotsFilled: 1,
    combinedVendors: 1,
    separateVipVendorRequired: true,
    minimumUniqueVendors: 1,
    totalServiceSlotsRequired: 2,
    totalServiceSlotsFilled: 2,
    remainingGaSlots: 0,
    remainingVipSlots: 0,
    remainingTotalServiceSlots: 0,
    remainingUniqueVendors: 0,
  },
);
const separateVendors = getMarketplaceFilledSlotSummary({
  gaSlotsFilled: 1,
  vipSlotsFilled: 1,
  combinedVendors: 0,
  separateVipVendorRequired: true,
  gaRequirement: 1,
  vipRequirement: 1,
});
assert.equal(separateVendors.totalServiceSlotsFilled, 2);
assert.equal(separateVendors.minimumUniqueVendors, 2);
assert.equal(separateVendors.remainingTotalServiceSlots, 0);
const fullyCateredFilled = getMarketplaceFilledSlotSummary({
  gaSlotsFilled: 2,
  vipSlotsFilled: 1,
  combinedVendors: 1,
  gaRequirement: 2,
  vipRequirement: 1,
});
assert.equal(fullyCateredFilled.totalServiceSlotsFilled, 3);
assert.equal(fullyCateredFilled.minimumUniqueVendors, 2);
assert.equal(fullyCateredFilled.remainingTotalServiceSlots, 0);
const fullyCateredFiftyEach = getMarketplaceFilledSlotSummary({
  gaSlotsFilled: 1,
  vipSlotsFilled: 1,
  combinedVendors: 1,
  gaRequirement: 1,
  vipRequirement: 1,
});
assert.equal(fullyCateredFiftyEach.minimumUniqueVendors, 1);
assert.equal(fullyCateredFiftyEach.remainingTotalServiceSlots, 0);
const fullyCateredReduction = getVendorReductionProtection({
  requested: 1,
  filledMinimum: fullyCateredFilled.minimumUniqueVendors,
  ...getMarketplaceServiceRequirements(fullyCatered, 1),
  gaFilled: fullyCateredFilled.gaSlotsFilled,
  vipFilled: fullyCateredFilled.vipSlotsFilled,
});
assert.equal(fullyCateredReduction.blocked, true);

console.log("marketplace participation helper tests passed");
