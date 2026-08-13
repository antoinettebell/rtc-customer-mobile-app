const AWARDED_BID_STATUSES = new Set(["AWARDED"]);
const AWARDED_APPLICATION_STATUSES = new Set([
  "ACCEPTED",
  "PAYMENT_DUE",
  "PAID",
  "CONFIRMED",
]);

const getVendorId = (record = {}) => String(
  record?.vendor_user_id?._id || record?.vendor_user_id?.id || record?.vendor_user_id || ""
);

export const getRemainingFoodVendorAwards = ({ event, bids = [], applications = [] }) => {
  const awardedVendorIds = new Set();
  bids.forEach((bid) => {
    if (AWARDED_BID_STATUSES.has(String(bid?.bid_status || "").toUpperCase())) {
      const id = getVendorId(bid);
      if (id) awardedVendorIds.add(id);
    }
  });
  applications.forEach((application) => {
    if (AWARDED_APPLICATION_STATUSES.has(
      String(application?.application_status || "").toUpperCase()
    )) {
      const id = getVendorId(application);
      if (id) awardedVendorIds.add(id);
    }
  });
  const limit = Math.max(1, Number(event?.number_of_vendors_needed || 1));
  return Math.max(0, limit - awardedVendorIds.size);
};
