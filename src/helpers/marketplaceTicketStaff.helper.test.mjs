import assert from "node:assert/strict";
import {
  hasAcceptedTicketStaffGig,
  visibleTicketStaffAssignments,
  ticketStaffDeclineConfirmation,
} from "./marketplaceTicketStaff.helper.js";

assert.equal(hasAcceptedTicketStaffGig([]), false);
assert.equal(hasAcceptedTicketStaffGig([{ status: "PENDING" }]), false);
assert.equal(hasAcceptedTicketStaffGig([{ status: "ACCEPTED" }]), true);
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

console.log("Marketplace ticket staff helper tests passed.");
