import assert from "node:assert/strict";
import { getMarketplaceSubmissionMenuAttachments } from "./marketplaceSubmissionDocuments.helper.js";

const visible = getMarketplaceSubmissionMenuAttachments({
  menu_pdf_url: "https://files/menu.pdf",
  attachments: [
    { attachment_id: "menu-copy", attachment_type: "APPLICATION_MENU_PDF", file_url: "https://files/menu.pdf" },
    { attachment_id: "menu-2", attachment_type: "BID_MENU_PDF", file_url: "https://files/menu-2.pdf" },
    { attachment_id: "agreement", attachment_type: "AGREEMENT_DOCUMENT", file_url: "https://files/signed.pdf", mime_type: "application/pdf" },
    { attachment_id: "permit", attachment_type: "REQUIREMENT_DOCUMENT", file_url: "https://files/permit.pdf", mime_type: "application/pdf" },
  ],
});

assert.deepEqual(visible.map((attachment) => attachment.attachment_id), [
  "menu_pdf_url",
  "menu-2",
]);
console.log("marketplace submission document visibility tests passed");
