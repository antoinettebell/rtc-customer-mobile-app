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
