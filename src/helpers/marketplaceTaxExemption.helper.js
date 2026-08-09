const getCertificateUrl = (event = {}) =>
  event.tax_exemption_certificate_url ||
  event.taxExemptionCertificateUrl ||
  event.tax_exemption_certificate?.file_url ||
  "";

export const normalizeMarketplaceTaxExemptionForForm = (event = {}) => {
  const hasCharitableField = Object.prototype.hasOwnProperty.call(
    event,
    "charitable_event",
  );
  const hasReligiousField = Object.prototype.hasOwnProperty.call(
    event,
    "religious_organization",
  );
  const booleansAreMissing = !hasCharitableField && !hasReligiousField;
  const approvedEntityCode = event.tax_exemption_status === "APPROVED"
    ? event.tax_exemption_entity_use_code
    : null;
  const charitable = event.charitable_event === true ||
    (booleansAreMissing && approvedEntityCode === "E");
  const religious = !charitable && (
    event.religious_organization === true ||
    (booleansAreMissing && approvedEntityCode === "F")
  );
  return {
    charitable_event: charitable,
    religious_organization: religious,
    tax_exemption_status: event.tax_exemption_status || "NOT_REQUESTED",
    tax_exemption_entity_use_code: event.tax_exemption_entity_use_code || null,
    tax_exemption_certificate_url: getCertificateUrl(event),
  };
};
