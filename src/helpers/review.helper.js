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
  foodTruck?.sanitationGrade || foodTruck?.sanitation_grade || null;

export const formatRatingWithSanitationGrade = (foodTruck) => {
  const rating = Number(foodTruck?.averageRating ?? foodTruck?.avgRate);
  const rawReviewCount = Number(
    foodTruck?.reviewCount ?? foodTruck?.totalReviews ?? 0,
  );
  const hasReviews =
    Number.isFinite(rating) &&
    Number.isFinite(rawReviewCount) &&
    rawReviewCount > 0;
  const grade = getSanitationGrade(foodTruck);

  if (!hasReviews) {
    return grade ? `New vendor (${grade})` : "New vendor";
  }

  const reviews = formatReviewCount(rawReviewCount);
  const reviewLabel = rawReviewCount === 1 ? "review" : "reviews";
  const ratingLabel = rating.toFixed(1);

  return grade
    ? `${ratingLabel} (${grade} - ${reviews} ${reviewLabel})`
    : `${ratingLabel} (${reviews} ${reviewLabel})`;
};
