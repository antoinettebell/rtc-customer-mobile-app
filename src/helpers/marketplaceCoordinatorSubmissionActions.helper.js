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
  if (kind === "EVENT_VENDOR_APPLICATION") {
    return upper(submission.status || submission.application_status);
  }
  return upper(submission.application_status);
};

export const getCoordinatorSubmissionActions = (submission = {}) => {
  const kind = getCoordinatorSubmissionKind(submission);
  const status = getCoordinatorSubmissionStatus(submission);
  const canReject = ["SUBMITTED", "UNDER_REVIEW"].includes(status);
  const revokeStatuses = {
    FOOD_BID: ["AWARDED"],
    FOOD_APPLICATION: ["CONFIRMED", "PAID"],
    EVENT_VENDOR_APPLICATION: ["PAID"],
  };
  return {
    kind,
    status,
    canAward: canReject,
    canReject,
    rejectLabel: kind === "FOOD_BID" ? "Reject Bid" : "Reject Application",
    canRevoke: revokeStatuses[kind].includes(status),
    paymentPending: status === "PAYMENT_DUE",
    paidRevocationBlocked: false,
  };
};

const getErrorMessage = (error) =>
  error?.message ||
  error?.error?.message ||
  error?.data?.message ||
  error?.response?.data?.message ||
  "Please try again.";

export const getCoordinatorRevocationErrorAlert = (error) => {
  const originalMessage = getErrorMessage(error);
  const message = String(originalMessage).toLowerCase();

  if (message.includes("within 72 hours")) {
    return {
      title: "Revocation Window Closed",
      message: "Awards cannot be revoked at or within 72 hours of the event start. No award or payment changes were made.",
    };
  }

  if (message.includes("payment is still processing") || message.includes("refund is already processing")) {
    return {
      title: "Payment Processing",
      message: "The vendor payment is still processing. No award or payment changes were made. Try again after its final processor status is available.",
    };
  }

  if (
    message.includes("refund") ||
    message.includes("processor transaction") ||
    message.includes("refundable processor amount") ||
    message.includes("gateway declined")
  ) {
    const reason = String(originalMessage).trim().replace(/[.!?]+$/, "");
    return {
      title: "Refund Not Completed",
      message: `${reason}. The award remains active and the vendor slot was not released.`,
    };
  }

  return { title: "Unable to Revoke Award", message: originalMessage };
};
