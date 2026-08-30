// Desserts and Drinks are additional catering needs for fully catered events
// that have a General Admission audience. Their saved field names and
// downstream specialty handling are intentionally unchanged.
export const shouldShowAdditionalCatererNeeds = (event = {}) =>
  Boolean(event.fully_catered_event) &&
  Number(event.number_of_guests || 0) > 0;
