export const getVendorRating = (vendor) => {
  const average = Number(vendor?.averageRating ?? vendor?.avgRate);
  const count = Number(vendor?.reviewCount ?? vendor?.totalReviews ?? 0);
  return {
    averageRating: Number.isFinite(average) && count > 0 ? average : null,
    reviewCount: Number.isFinite(count) && count > 0 ? count : 0,
  };
};

export const formatVendorRating = (vendor, { compact = false } = {}) => {
  const { averageRating, reviewCount } = getVendorRating(vendor);
  if (averageRating === null || reviewCount === 0) return "New vendor";
  const countLabel = compact
    ? String(reviewCount)
    : `${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`;
  return `${averageRating.toFixed(1)} (${countLabel})`;
};
