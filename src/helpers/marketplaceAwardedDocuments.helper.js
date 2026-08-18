const toDocument = (label, url) => (url ? { label, url } : null);

const deduplicateDocuments = (documents) => {
  const seen = new Set();
  return documents.filter((document) => {
    if (!document?.url || seen.has(document.url)) return false;
    seen.add(document.url);
    return true;
  });
};

export const getMarketplaceAwardedDocuments = (record = {}) => {
  const currentAttachments = (record.attachments || [])
    .filter((attachment) => attachment?.file_url || attachment?.url)
    .map((attachment, index) => ({
      label:
        attachment.original_name ||
        attachment.requirement_label ||
        attachment.attachment_type ||
        `Document ${index + 1}`,
      url: attachment.file_url || attachment.url,
    }));
  const hasCurrentComplianceAttachments = (record.attachments || []).some(
    (attachment) =>
      ["REQUIREMENT_DOCUMENT", "PERMIT_LICENSE", "COMPLIANCE_DOCUMENT"].includes(
        attachment?.attachment_type,
      ),
  );
  const legacyPermitDocuments = hasCurrentComplianceAttachments
    ? []
    : (record.permit_license_urls || []).map((url, index) => ({
        label: `Business License/Permit ${index + 1}`,
        url,
      }));

  return deduplicateDocuments([
    toDocument("Menu PDF", record.menu_pdf_url),
    toDocument("Agreement Document", record.agreement_document_url),
    toDocument("Signed Document", record.signed_document_url),
    ...legacyPermitDocuments,
    ...currentAttachments,
  ]);
};
