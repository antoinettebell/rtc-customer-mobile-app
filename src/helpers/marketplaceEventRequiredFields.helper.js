export const MARKETPLACE_EVENT_REQUIRED_FIELDS = [
  "event_name",
  "event_type",
  "primary_service_style",
  "event_date",
  "event_time",
  "event_address",
  "event_city",
  "event_state",
  "number_of_guests",
  "event_close_date",
];

export const getMarketplaceRequiredFieldValue = (form = {}, field) => {
  if (field === "primary_service_style") {
    return form.primary_service_style || form.service_styles?.[0] || "";
  }
  return form[field];
};

export const getMissingMarketplaceRequiredField = (
  form = {},
  requiredFields = [],
) =>
  requiredFields.find(
    (field) =>
      !String(getMarketplaceRequiredFieldValue(form, field) ?? "").trim(),
  ) || null;
