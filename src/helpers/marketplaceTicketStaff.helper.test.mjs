import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  hasAcceptedTicketStaffGig,
  hasVisibleTicketStaffGig,
  pendingTicketStaffAssignments,
  visibleTicketStaffAssignments,
  ticketStaffDeclineConfirmation,
} from "./marketplaceTicketStaff.helper.js";

assert.equal(hasAcceptedTicketStaffGig([]), false);
assert.equal(hasAcceptedTicketStaffGig([{ status: "PENDING" }]), false);
assert.equal(hasAcceptedTicketStaffGig([{ status: "ACCEPTED" }]), true);
assert.equal(hasVisibleTicketStaffGig([{ status: "PENDING" }]), true);
assert.equal(hasVisibleTicketStaffGig([{ status: "ACCEPTED" }]), true);
assert.equal(hasVisibleTicketStaffGig([{ status: "DECLINED" }]), false);
assert.deepEqual(
  pendingTicketStaffAssignments([
    { assignment_id: "pending", status: "PENDING" },
    { assignment_id: "accepted", status: "ACCEPTED" },
  ]).map((assignment) => assignment.assignment_id),
  ["pending"],
);
assert.deepEqual(
  visibleTicketStaffAssignments([
    { status: "PENDING" },
    { status: "ACCEPTED" },
    { status: "DECLINED" },
    { status: "REVOKED" },
    { status: "EXPIRED" },
  ]).map((item) => item.status),
  ["PENDING", "ACCEPTED"],
);
assert.match(ticketStaffDeclineConfirmation, /Are you sure\?/);
assert.match(ticketStaffDeclineConfirmation, /new invitation/);

const [myEventsSource, notificationsSource, profileSource, notificationHelper] =
  await Promise.all([
    readFile(new URL("../screens/marketplaceMyEventsScreen.js", import.meta.url), "utf8"),
    readFile(new URL("../screens/marketplaceNotificationsScreen.js", import.meta.url), "utf8"),
    readFile(new URL("../screens/profileMenuScreen.js", import.meta.url), "utf8"),
    readFile(new URL("./notification.helper.js", import.meta.url), "utf8"),
  ]);
assert.match(myEventsSource, /hasVisibleTicketStaffGig/);
assert.match(notificationsSource, /Ticket staff assignment/);
assert.match(notificationsSource, /Clear notification/);
assert.match(profileSource, /hasVisibleTicketStaffGig/);
assert.match(notificationHelper, /notificationType === "MARKETPLACE_TICKET_STAFF"/);
assert.match(notificationHelper, /navigate\("marketplaceTicketStaffScreen"/);
assert.match(notificationHelper, /id: "rtc-notifications-v2"/);
assert.match(notificationHelper, /sound: "default"/);

console.log("Marketplace ticket staff helper tests passed.");
