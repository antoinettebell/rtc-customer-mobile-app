const upper = (value) => String(value || "").trim().toUpperCase();

export const getCoordinatorSubmissionKind = (submission = {}) => {
  if (submission.bid_id) return "FOOD_BID";
  if (
    submission.profile_id ||
    (Array.isArray(submission.vendor_types) &&
      Object.prototype.hasOwnProperty.call(submission, "status"))
  ) {
    return "EVENT_VENDOR_APPLICATION";
  }
  return "FOOD_APPLICATION";
};

export const getCoordinatorSubmissionStatus = (submission = {}) => {
  const kind = getCoordinatorSubmissionKind(submission);
  if (kind === "FOOD_BID") return upper(submission.bid_status);
  if (kind === "EVENT_VENDOR_APPLICATION") return upper(submission.status);
  return upper(submission.application_status);
};

export const getCoordinatorSubmissionActions = (submission = {}) => {
  const kind = getCoordinatorSubmissionKind(submission);
  const status = getCoordinatorSubmissionStatus(submission);
  const canReject = ["SUBMITTED", "UNDER_REVIEW"].includes(status);
  const revokeStatuses = {
    FOOD_BID: ["AWARDED"],
    FOOD_APPLICATION: ["ACCEPTED", "PAYMENT_DUE", "CONFIRMED", "PAID"],
    EVENT_VENDOR_APPLICATION: ["AWARDED", "PAYMENT_DUE", "PAID"],
  };
  const vendorFeePaid =
    upper(submission.payment_status) === "PAID" || status === "PAID";
  return {
    kind,
    status,
    canReject,
    rejectLabel: kind === "FOOD_BID" ? "Reject Bid" : "Reject Application",
    canRevoke: revokeStatuses[kind].includes(status) && !vendorFeePaid,
    paidRevocationBlocked: revokeStatuses[kind].includes(status) && vendorFeePaid,
  };
};
