import assert from "node:assert/strict";
import fs from "node:fs";
import { parseUsAddressFromGooglePlace } from "./address.helper.js";
import {
  getCheckoutPricePresentation,
  getDeliveryAddressPayload,
  getSelectedOptionLabels,
  getAttachmentSaveOutcome,
  isEligiblePublicEvent,
  isTicketPurchaseAvailable,
  isPdfAttachment,
  reconcileUploadResults,
  removeEventImageAt,
} from "./customerPunchList.helper.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const foodDetail = read("../screens/foodTruckDetailScreen.js");
const checkout = read("../screens/checkoutScreen.js");
const createEvent = read("../screens/marketplaceCreateEventScreen.js");
const eventDetails = read("../screens/marketplaceEventDetailsScreen.js");
const guestAction = read("./guestAction.helper.js");
const signIn = read("../screens/signinScreen.js");

assert.match(foodDetail, /Is This Item the Same\?/);
assert.match(foodDetail, /_startAdditionalItem: true/);
assert.match(foodDetail, /handleAddItem\(existingOrderItem\)/);
assert.match(foodDetail, /text: "Cancel"/);

const combo = {
  price: 15,
  quantity: 1,
  selectedSubItems: [{ name: "Crab Rangoon", qty: 1, hasAdditionalCost: true, additionalCost: 2 }],
};
assert.deepEqual(getCheckoutPricePresentation(combo), { basePrice: 15, lineTotal: 17 });
assert.deepEqual(
  getSelectedOptionLabels(
    { selectedFlavors: ["Premium"], flavorOptions: [{ name: "Premium", cost: 1.5 }] },
    "flavor",
  ),
  ["Premium (+$1.50)"],
);
assert.match(checkout, /Base price:/);
assert.match(checkout, /Line total:/);

assert.deepEqual(
  getDeliveryAddressPayload({
    address: "411 Myrtle Ave",
    formattedAddress: "411 Myrtle Ave, Irvington, NJ 07111, USA",
    lat: "40.724",
    long: "-74.231",
  }),
  {
    deliveryAddress: "411 Myrtle Ave, Irvington, NJ 07111, USA",
    deliveryLat: 40.724,
    deliveryLong: -74.231,
  },
);

const attachments = [{ uri: "certificate.pdf" }, { uri: "event.jpg", image_id: "2", uploaded: true }];
const uploadOutcome = reconcileUploadResults(attachments, [
  { status: "rejected", reason: new Error("upload failed") },
  { status: "fulfilled", value: { data: { marketplaceEventImage: { image_id: "2" } } } },
]);
assert.deepEqual(uploadOutcome.failedAttachments, [attachments[0]]);
assert.equal(uploadOutcome.successfulValues.length, 1);
let deletedPayload = null;
assert.deepEqual(await removeEventImageAt({
  images: attachments,
  image: attachments[1],
  index: 1,
  eventId: "event-1",
  deleteRemote: async (payload) => { deletedPayload = payload; },
}), [attachments[0]]);
assert.deepEqual(deletedPayload, { eventId: "event-1", imageId: "2" });
await assert.rejects(removeEventImageAt({
  images: attachments,
  image: attachments[1],
  index: 1,
  eventId: "event-1",
  deleteRemote: async () => { throw new Error("remote failed"); },
}), /remote failed/);
assert.equal(attachments.length, 2);
assert.equal(isPdfAttachment({ mime_type: "application/pdf", file_url: "https://signed/no-extension" }), true);
assert.equal(isPdfAttachment({ mime_type: "image/jpeg", file_url: "https://signed/document.pdf" }), false);
assert.deepEqual(getAttachmentSaveOutcome({ status: "DRAFT", hasFailures: true }), {
  message: "Draft saved, but some attachments failed. They remain selected so you can retry.",
  type: "error",
  shouldNavigate: false,
});
assert.equal(getAttachmentSaveOutcome({ status: "DRAFT", hasFailures: false }), null);
assert.match(createEvent, /shouldUploadImages = eventId && imagesToUpload\.length/);
assert.match(createEvent, /normalizeExistingCertificate/);
assert.match(createEvent, /deleteMarketplaceEventImage_API/);
assert.match(eventDetails, /Open Certificate/);

const now = Date.parse("2026-08-08T12:00:00Z");
assert.equal(isEligiblePublicEvent({ type: "EVENT", event_visibility: "PUBLIC", event_end_at: "2026-08-08T13:00:00Z" }, now), true);
assert.equal(isEligiblePublicEvent({ type: "EVENT", event_visibility: "PUBLIC", event_end_at: "2026-08-08T11:00:00Z" }, now), false);
assert.equal(isEligiblePublicEvent({ type: "EVENT", event_visibility: "PRIVATE", event_end_at: "2026-08-09T11:00:00Z" }, now), false);
assert.equal(isEligiblePublicEvent({ type: "FOOD" }, now), true);
const closedTicketEvent = {
  type: "EVENT",
  status: "CLOSED",
  event_visibility: "PUBLIC",
  event_end_at: "2026-08-08T11:00:00Z",
  ticket_sales_enabled: true,
  ticket_sales_closed_at: null,
  ga_ticket_quantity: 10,
  ga_tickets_sold: 9,
  ga_tickets_reserved: 0,
};
assert.equal(isEligiblePublicEvent(closedTicketEvent, now), true);
assert.equal(isTicketPurchaseAvailable(closedTicketEvent), true);
assert.equal(isEligiblePublicEvent({
  ...closedTicketEvent,
  ticket_sales_closed_at: "2026-08-08T11:30:00Z",
}, now), false);
assert.equal(isEligiblePublicEvent({
  ...closedTicketEvent,
  ga_tickets_sold: 10,
}, now), false);
assert.equal(
  isEligiblePublicEvent(
    {
      type: "EVENT",
      event_visibility: "PUBLIC",
      event_date: "2026-08-08",
      event_time: "12:00 PM",
      event_duration_total_minutes: 2880,
      event_timezone: "America/New_York",
    },
    Date.parse("2026-08-09T15:00:00Z"),
  ),
  true,
);

assert.match(guestAction, /navigate\?\.\("signin", \{ returnToPrevious: true \}\)/);
assert.match(signIn, /returnToPrevious && navigation\.canGoBack\(\)/);

const parsed = parseUsAddressFromGooglePlace({
  data: { place_id: "place-1" },
  details: {
    formatted_address: "411 Myrtle Ave, Irvington, NJ 07111, USA",
    geometry: { location: { lat: 40.724, lng: -74.231 } },
    address_components: [
      { long_name: "411", short_name: "411", types: ["street_number"] },
      { long_name: "Myrtle Avenue", short_name: "Myrtle Ave", types: ["route"] },
      { long_name: "Irvington", short_name: "Irvington", types: ["locality"] },
      { long_name: "New Jersey", short_name: "NJ", types: ["administrative_area_level_1"] },
      { long_name: "07111", short_name: "07111", types: ["postal_code"] },
      { long_name: "United States", short_name: "US", types: ["country"] },
    ],
  },
});
assert.deepEqual(parsed, {
  line1: "411 Myrtle Avenue",
  city: "Irvington",
  state: "NJ",
  zip: "07111",
  latitude: "40.724",
  longitude: "-74.231",
  country: "US",
  formattedAddress: "411 Myrtle Ave, Irvington, NJ 07111, USA",
  placeId: "place-1",
});

const inventory = { capacity: 100, sold: 4 };
getCheckoutPricePresentation({ price: 10, quantity: 1 });
assert.deepEqual(inventory, { capacity: 100, sold: 4 });

console.log("Customer punch-list tests passed.");
