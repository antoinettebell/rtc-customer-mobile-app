import { isPdfAttachment } from "./customerPunchList.helper.js";

export const getAttachmentPreview = ({
  attachment,
  persistedUrl = "",
  persistedName = "",
  persistedMimeType = "",
} = {}) => {
  const uri = attachment?.uri || persistedUrl || "";
  if (!uri) return null;
  const name =
    attachment?.name ||
    persistedName ||
    (isPdfAttachment({ file_url: uri, mime_type: attachment?.type || persistedMimeType })
      ? "Sales Tax Exemption Certificate.pdf"
      : "Sales Tax Exemption Certificate");
  const mimeType = attachment?.type || persistedMimeType || "";
  return {
    uri,
    name,
    mimeType,
    isPdf: isPdfAttachment({ file_url: uri, mime_type: mimeType }),
    isPersisted: attachment?.uploaded === true || (!attachment && !!persistedUrl),
  };
};

export const normalizeExistingCertificateAttachment = (event = {}) => {
  const uri =
    event.tax_exemption_certificate_url ||
    event.taxExemptionCertificateUrl ||
    event.tax_exemption_certificate?.file_url;
  if (!uri) return null;
  return {
    uri,
    name:
      event.tax_exemption_certificate?.original_name ||
      event.tax_exemption_certificate_name ||
      "Sales Tax Exemption Certificate",
    type:
      event.tax_exemption_certificate?.mime_type ||
      event.tax_exemption_certificate_mime_type ||
      (String(uri).toLowerCase().includes(".pdf") ? "application/pdf" : "image/jpeg"),
    uploaded: true,
  };
};

export const getPaymentQrPreview = ({ url = "", pendingSave = false } = {}) =>
  url
    ? {
        uri: url,
        label: pendingSave ? "Payment QR Selected" : "QR Code Exists",
      }
    : null;
