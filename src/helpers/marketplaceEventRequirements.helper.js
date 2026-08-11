export const getEventVendorRequirementRows = (event) => {
  const safeEvent = event && typeof event === "object" ? event : {};
  const summary = Array.isArray(safeEvent.event_vendor_requirement_summary)
    ? safeEvent.event_vendor_requirement_summary
    : [];

  return ["MERCHANDISE", "SERVICE", "OTHER"].map((vendorType) => {
    const item =
      summary.find((entry) => entry?.vendor_type === vendorType) || {};
    const need = (safeEvent.event_vendor_needs || []).find(
      (entry) => entry?.vendor_type === vendorType,
    ) || {};
    const requested = Number(item.requested ?? need.quantity ?? 0);
    const filled = Number(item.filled ?? 0);

    return {
      vendorType,
      requested,
      filled,
      remaining: Number(
        item.remaining ?? Math.max(0, requested - filled),
      ),
    };
  });
};
