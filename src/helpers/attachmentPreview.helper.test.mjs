import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  getAttachmentPreview,
  getPaymentQrPreview,
  normalizeExistingCertificateAttachment,
} from "./attachmentPreview.helper.js";

const existingImage = getAttachmentPreview({
  attachment: {
    uri: "https://files/certificate.jpg",
    name: "approved.jpg",
    type: "image/jpeg",
    uploaded: true,
  },
});
assert.equal(existingImage.isPdf, false);
assert.equal(existingImage.isPersisted, true);
assert.equal(existingImage.uri, "https://files/certificate.jpg");

const existingPdf = getAttachmentPreview({
  persistedUrl: "https://files/certificate",
  persistedName: "approved-certificate.pdf",
  persistedMimeType: "application/pdf",
});
assert.equal(existingPdf.isPdf, true);
assert.equal(existingPdf.isPersisted, true);
assert.equal(existingPdf.name, "approved-certificate.pdf");

const localImage = getAttachmentPreview({
  attachment: {
    uri: "file:///tmp/new-certificate.png",
    name: "new-certificate.png",
    type: "image/png",
  },
});
assert.equal(localImage.isPdf, false);
assert.equal(localImage.isPersisted, false);

assert.deepEqual(normalizeExistingCertificateAttachment({
  tax_exemption_certificate_url: "https://files/saved-image",
  tax_exemption_certificate: {
    original_name: "saved-image.heic",
    mime_type: "image/heic",
  },
}), {
  uri: "https://files/saved-image",
  name: "saved-image.heic",
  type: "image/heic",
  uploaded: true,
});
assert.equal(normalizeExistingCertificateAttachment({
  tax_exemption_certificate_url: "https://files/saved-document",
  tax_exemption_certificate_mime_type: "application/pdf",
}).type, "application/pdf");

assert.deepEqual(getPaymentQrPreview({
  url: "https://files/saved-qr.png",
}), {
  uri: "https://files/saved-qr.png",
  label: "QR Code Exists",
});
assert.equal(
  getPaymentQrPreview({ url: "https://files/new-qr.png", pendingSave: true }).label,
  "Payment QR Selected",
);

const read = (relativePath) =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
const createEventSource = read("../screens/marketplaceCreateEventScreen.js");
const profileSource = read("../screens/userProfileScreen.js");
assert.match(createEventSource, /uri=\{certificatePreview\.uri\}/);
assert.match(createEventSource, />View Certificate</);
assert.match(createEventSource, /!exemptionCertificate\.uploaded/);
assert.match(createEventSource, /normalizeExistingCertificateAttachment\(event\)/);
assert.match(profileSource, /uri=\{paymentQrPreview\.uri\}/);
assert.doesNotMatch(profileSource, /Linking\.openURL\(eventCoordinatorPaymentQrCodeUrl/);
assert.match(profileSource, /eventCoordinatorPaymentQrCodeUrl:\s*[\s\S]*eventCoordinatorPaymentQrCodeUrl \|\| null/);

console.log("Persisted attachment preview tests passed.");
