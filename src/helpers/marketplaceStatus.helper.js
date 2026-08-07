export const formatMarketplaceStatus = (
  value,
  { coordinatorPaid = false } = {},
) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  if (
    coordinatorPaid &&
    ["", "NOT_REQUIRED", "NOT_STARTED", "PENDING"].includes(normalized)
  ) {
    return "Pending Event Closing";
  }
  if (!normalized) return "Not Required";
  return normalized
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
