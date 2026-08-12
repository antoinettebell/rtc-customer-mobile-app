const MENU_ATTACHMENT_TYPES = new Set([
  "BID_MENU_PDF",
  "APPLICATION_MENU_PDF",
]);

export const getMarketplaceSubmissionMenuAttachments = (submission = {}) => {
  const attachments = (submission.attachments || []).filter((attachment) =>
    MENU_ATTACHMENT_TYPES.has(attachment?.attachment_type)
  );
  const menuUrl = submission.menu_pdf_url || submission.menuPdfUrl || submission.menu_url;
  if (!menuUrl) return attachments;
  return [
    { attachment_id: "menu_pdf_url", file_url: menuUrl, original_name: "Menu PDF" },
    ...attachments.filter((attachment) => attachment.file_url !== menuUrl),
  ];
};
