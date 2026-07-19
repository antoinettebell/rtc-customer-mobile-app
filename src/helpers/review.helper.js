const formatReviewCount = (value) => {
  const count = Number(value || 0);
  if (!Number.isFinite(count) || count <= 0) return "0";
  if (count >= 1000000) {
    const millions = count / 1000000;
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`;
  }
  if (count >= 1000) {
    const thousands = count / 1000;
    return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}K`;
  }
  return `${count}`;
};

export const getSanitationGrade = (foodTruck) =>
  foodTruck?.sanitationGrade || foodTruck?.sanitation_grade || "N/A";

export const formatRatingWithSanitationGrade = (foodTruck) => {
  const rating = foodTruck?.avgRate ?? 0;
  const reviews = formatReviewCount(foodTruck?.totalReviews);
  return `${rating} (${getSanitationGrade(foodTruck)} - ${reviews} reviews)`;
};
