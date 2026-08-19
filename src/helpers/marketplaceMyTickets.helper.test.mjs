import assert from "node:assert/strict";
import {
  filterTicketOrders,
  isPastTicketOrder,
  MY_TICKET_FILTERS,
} from "./marketplaceMyTickets.helper.js";

const now = Date.parse("2026-08-19T16:00:00.000Z");
const order = (id, event) => ({ ticket_order_id: id, event });

const upcoming = order("upcoming", {
  event_date: "2026-08-20T00:00:00.000Z",
  event_time: "12:00 PM",
  event_timezone: "America/New_York",
  event_duration_hours: 2,
});
const active = order("active", {
  event_date: "2026-08-19T00:00:00.000Z",
  event_time: "11:00 AM",
  event_timezone: "America/New_York",
  event_duration_hours: 2,
});
const past = order("past", {
  event_date: "2026-08-19T00:00:00.000Z",
  event_time: "8:00 AM",
  event_timezone: "America/New_York",
  event_duration_hours: 2,
});
const missingTiming = order("missing", null);

assert.equal(isPastTicketOrder(past, now), true);
assert.equal(isPastTicketOrder(active, now), false);
assert.deepEqual(
  filterTicketOrders(
    [upcoming, active, past, missingTiming],
    MY_TICKET_FILTERS.UPCOMING,
    now,
  ).map(({ ticket_order_id }) => ticket_order_id),
  ["upcoming", "active", "missing"],
);
assert.deepEqual(
  filterTicketOrders(
    [upcoming, active, past, missingTiming],
    MY_TICKET_FILTERS.PAST,
    now,
  ).map(({ ticket_order_id }) => ticket_order_id),
  ["past"],
);
assert.deepEqual(filterTicketOrders(null, MY_TICKET_FILTERS.UPCOMING, now), []);

console.log("Marketplace My Tickets helper tests passed.");
