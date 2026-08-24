export const getLockedFoodVendorDisplayName = (vendorDisplayId) =>
  typeof vendorDisplayId === "string" && vendorDisplayId.trim()
    ? vendorDisplayId
    : "Vendor RTC - MASKED";
