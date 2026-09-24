export const hasAcceptedTicketStaffGig = (assignments = []) =>
  assignments.some((assignment) => assignment?.status === "ACCEPTED");

export const visibleTicketStaffAssignments = (assignments = []) =>
  assignments.filter((assignment) => ["PENDING", "ACCEPTED"].includes(assignment?.status));

export const ticketStaffDeclineConfirmation =
  "Are you sure? Declining means you will not be able to scan tickets unless a new invitation is sent.";
