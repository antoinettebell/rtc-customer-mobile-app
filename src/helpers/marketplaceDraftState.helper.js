const normalizeValue = (value) => {
  if (value === undefined || typeof value === "function") return undefined;
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeValue);

  return Object.keys(value)
    .sort()
    .reduce((result, key) => {
      const normalized = normalizeValue(value[key]);
      if (normalized !== undefined) result[key] = normalized;
      return result;
    }, {});
};

const normalizeAttachment = (attachment = {}) => ({
  id:
    attachment.event_image_id ||
    attachment.image_id ||
    attachment.document_id ||
    attachment.id ||
    "",
  name: attachment.name || attachment.file_name || "",
  type: attachment.type || attachment.mime_type || "",
  uri: attachment.uri || attachment.path || attachment.image_url || attachment.url || "",
  uploaded: Boolean(attachment.uploaded),
});

export const buildMarketplaceDraftSnapshot = ({
  form = {},
  eventImages = [],
  exemptionCertificate = null,
} = {}) =>
  JSON.stringify(
    normalizeValue({
      form,
      eventImages: eventImages.map(normalizeAttachment),
      exemptionCertificate: exemptionCertificate
        ? normalizeAttachment(exemptionCertificate)
        : null,
    }),
  );
