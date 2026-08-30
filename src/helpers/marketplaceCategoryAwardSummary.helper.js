const getVendorId = (submission = {}) => {
  const vendorUser = submission.vendor_user_id;
  if (vendorUser && typeof vendorUser === "object") {
    return String(vendorUser._id || vendorUser.id || "");
  }
  return String(vendorUser || "");
};

export const getCategoryAwardSummary = (event, bids = [], applications = []) => {
  const safeEvent = event || {};
  const awardedBids = bids.filter((bid) => bid.bid_status === "AWARDED");
  const awardedApplications = applications.filter((item) =>
    ["AWARDED", "ACCEPTED", "PAYMENT_DUE", "PAID", "CONFIRMED"].includes(
      item.application_status,
    ),
  );
  const ga = new Set(awardedApplications.map(getVendorId).filter(Boolean));
  const vip = new Set(); const desserts = new Set(); const drinks = new Set();
  const marketplaceVendorAwards = {
    MERCHANDISE: new Set(),
    SERVICE: new Set(),
    OTHER: new Set(),
  };
  awardedApplications.forEach((application) => {
    const vendorId = getVendorId(application);
    if (!vendorId) return;
    (application.vendor_types || []).forEach((vendorType) => {
      if (marketplaceVendorAwards[vendorType]) {
        marketplaceVendorAwards[vendorType].add(vendorId);
      }
    });
  });
  awardedBids.forEach((bid) => {
    const vendorId = getVendorId(bid);
    if (!vendorId) return;
    const coverage = bid.awarded_coverage || bid.guest_coverage;
    if (["REGULAR", "BOTH"].includes(coverage)) ga.add(vendorId);
    if (["VIP", "BOTH"].includes(coverage)) vip.add(vendorId);
    const specialties = Array.isArray(bid.awarded_specialty_services) &&
      bid.awarded_specialty_services.length
      ? bid.awarded_specialty_services
      : bid.specialty_services || [];
    if (specialties.includes("DESSERTS")) desserts.add(vendorId);
    if (specialties.includes("DRINKS")) drinks.add(vendorId);
  });
  const gaNeed = Math.max(1, Math.ceil(Number(safeEvent.number_of_guests || 0) / 100));
  const marketplaceNeeds = ["MERCHANDISE", "SERVICE", "OTHER"].reduce(
    (needs, vendorType) => ({
      ...needs,
      [vendorType]: (safeEvent.event_vendor_needs || [])
        .filter((need) => need?.vendor_type === vendorType)
        .reduce((total, need) => total + Math.max(0, Number(need.quantity || 0)), 0),
    }),
    {},
  );
  const getMarketplaceVendorSummary = (vendorType) => {
    const requested = marketplaceNeeds[vendorType];
    if (!requested) return null;
    const selected = marketplaceVendorAwards[vendorType].size;
    return `${selected} of ${requested} selected · ${Math.max(0, requested - selected)} remaining`;
  };
  return {
    ga: `${ga.size} of ${gaNeed} selected · ${Math.max(0, gaNeed - ga.size)} remaining`,
    vip: safeEvent.catered_vip_section_enabled ? `${vip.size} of 1 selected · ${Math.max(0, 1 - vip.size)} remaining` : null,
    desserts: safeEvent.dessert_caterer_required ? `${desserts.size} of 1 selected · ${Math.max(0, 1 - desserts.size)} remaining` : null,
    drinks: safeEvent.drinks_caterer_required ? `${drinks.size} of 1 selected · ${Math.max(0, 1 - drinks.size)} remaining` : null,
    merchandise: getMarketplaceVendorSummary("MERCHANDISE"),
    service: getMarketplaceVendorSummary("SERVICE"),
    other: getMarketplaceVendorSummary("OTHER"),
  };
};
