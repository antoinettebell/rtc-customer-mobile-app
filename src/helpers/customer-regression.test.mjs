import assert from "node:assert/strict";
import fs from "node:fs";
import {
  canCancelCoordinatorEvent,
  getPermissionRequestAction,
  getTicketAttendancePatch,
  initializeAddressEdit,
  leaveWithFallback,
  normalizeEventDateForForm,
  normalizeCurrencyOnBlur,
  sanitizeCurrencyInput,
  toFormString,
} from "./customerRegression.helper.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const createEvent = read("../screens/marketplaceCreateEventScreen.js");
const marketplaceShared = read("../screens/marketplaceShared.js");
const details = read("../screens/marketplaceEventDetailsScreen.js");
const profile = read("../screens/userProfileScreen.js");
const splash = read("../screens/splashScreen.js");
const guestAction = read("./guestAction.helper.js");
const signIn = read("../screens/signinScreen.js");
const authMap = read("../screens/authMapScreen.js");

assert.equal(canCancelCoordinatorEvent({ status: "OPEN", ticket_sales_enabled: false }), true);
assert.equal(canCancelCoordinatorEvent({ status: "OPEN", ticket_sales_enabled: true }), true);
assert.equal(canCancelCoordinatorEvent({ status: "DRAFT" }), false);
assert.equal(canCancelCoordinatorEvent({ status: "CANCELLED" }), false);
assert.match(details, /ticketSalesEnabled \? "Cancel Event & Refund Tickets" : "Cancel Event"/);
assert.match(details, /ticketSalesEnabled\s*\? "Refunds are due immediately upon cancellation/);
assert.match(details, /: "This event will be cancelled and affected vendors will be notified/);
assert.match(details, /text: ticketSalesEnabled \? "Cancel & Refund" : "Cancel Event"/);
assert.equal((details.match(/>Share Event<\/Text>/g) || []).length, 2);
assert.doesNotMatch(details, /Ticket invitations are available for private events/);

assert.equal(sanitizeCurrencyInput(""), "");
assert.equal(normalizeCurrencyOnBlur(""), "");
assert.equal(normalizeCurrencyOnBlur("12"), "12.00");
assert.equal(normalizeCurrencyOnBlur("12.3"), "12.30");
assert.equal(normalizeCurrencyOnBlur("12.34"), "12.34");
assert.equal(normalizeCurrencyOnBlur("12..3x4"), "12.34");
assert.equal(normalizeCurrencyOnBlur("$1,234.567"), "1234.56");
assert.notEqual(normalizeCurrencyOnBlur("..."), "NaN");
assert.equal(toFormString(150), "150");
assert.equal(toFormString(0), "0");
assert.equal(toFormString(null), "");
assert.equal(toFormString(undefined), "");
assert.equal(normalizeEventDateForForm("2026-08-19T00:00:00.000Z"), "2026-08-19");
assert.equal(normalizeEventDateForForm("2026-08-19"), "2026-08-19");

const ticketed = {
  ticket_sales_enabled: true,
  ga_ticket_quantity: "150",
  vip_section_enabled: true,
  vip_ticket_quantity: "50",
  number_of_guests: "1",
  vip_guest_count: "2",
  ga_tickets_sold: 100,
  vip_tickets_sold: 25,
};
assert.deepEqual(getTicketAttendancePatch(ticketed), {
  number_of_guests: "150",
  vip_guest_count: "50",
});
assert.equal(ticketed.ga_ticket_quantity, "150");
assert.equal(ticketed.vip_ticket_quantity, "50");
assert.deepEqual(getTicketAttendancePatch({ ...ticketed, ticket_sales_enabled: false }), {});

const RESULTS = { GRANTED: "granted", BLOCKED: "blocked", UNAVAILABLE: "unavailable", DENIED: "denied" };
assert.equal(getPermissionRequestAction(RESULTS.GRANTED, RESULTS), "GRANTED");
assert.equal(getPermissionRequestAction(RESULTS.DENIED, RESULTS), "REQUEST");
assert.equal(getPermissionRequestAction(RESULTS.BLOCKED, RESULTS), "SETTINGS");
assert.equal(getPermissionRequestAction(RESULTS.UNAVAILABLE, RESULTS), "UNAVAILABLE");

const calls = [];
assert.equal(leaveWithFallback({ canGoBack: () => true, goBack: () => calls.push("back") }, "signin"), "BACK");
assert.deepEqual(calls, ["back"]);
assert.equal(leaveWithFallback({ canGoBack: () => false, replace: (route) => calls.push(route) }, "signin"), "FALLBACK");
assert.deepEqual(calls, ["back", "signin"]);

const savedAddress = { line1: "10 Main St", city: "Atlanta", state: "GA", zip: "30303" };
const editingAddress = initializeAddressEdit(savedAddress);
assert.deepEqual(editingAddress, savedAddress);
assert.notEqual(editingAddress, savedAddress);

assert.equal((createEvent.match(/Vendor Capacity/g) || []).length, 1);
assert.equal((createEvent.match(/Payment & Budget/g) || []).length, 1);
assert.match(createEvent, /Food Vendor Fee/);
assert.match(createEvent, /formatTimeForDisplay\(form\.event_time\)/);
assert.match(createEvent, /formatDurationLabel\(form\.event_duration_total_minutes\)/);
const permitOptionsSource = marketplaceShared.match(
  /export const PERMIT_OPTIONS = \[([\s\S]*?)\];/,
)?.[1] || "";
assert.match(permitOptionsSource, /"City Permit"/);
assert.doesNotMatch(permitOptionsSource, /"Food Vendor"/);
assert.match(createEvent, /editable: !form\.ticket_sales_enabled/);
assert.match(createEvent, /number_of_guests: toFormString\(event\.number_of_guests\)/);
assert.match(createEvent, /ga_ticket_quantity: toFormString\(event\.ga_ticket_quantity\)/);
assert.match(createEvent, /flexBasis: 0/);
assert.match(createEvent, /minWidth: 0/);
assert.match(createEvent, /Budgeted amount is based on average price per plate/);
assert.doesNotMatch(createEvent, /Budget Calculation/);
assert.match(profile, /getCoordinatorAddressSelectionFromLocation/);
assert.match(profile, /mode: "select"/);
assert.match(profile, /returnParamKey: "selectedCoordinatorLocation"/);
assert.match(splash, /guests can browse without granting location/);
assert.match(guestAction, /navigate\?\.\("signin", \{ returnToPrevious: true \}\)/);
assert.doesNotMatch(guestAction, /intendedDestination/);
assert.match(signIn, /returnToPrevious && navigation\.canGoBack\(\)/);
assert.match(signIn, /navigation\.reset\(\{ index: 0, routes: \[\{ name: "authIntro" \}\] \}\)/);
assert.match(authMap, /leaveWithFallback/);

console.log("Customer behavioral regression checks passed.");
