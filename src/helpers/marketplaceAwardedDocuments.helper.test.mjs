import assert from "node:assert/strict";
import { getMarketplaceAwardedDocuments } from "./marketplaceAwardedDocuments.helper.js";

const currentLicenseUrl = "https://files.example/current-license.pdf";
const documents = getMarketplaceAwardedDocuments({
  menu_pdf_url: "https://files.example/menu.pdf",
  permit_license_urls: [
    "https://files.example/old-license-1.pdf",
    "https://files.example/old-license-2.pdf",
  ],
  attachments: [
    {
      attachment_type: "REQUIREMENT_DOCUMENT",
      original_name: "Current Business License.pdf",
      file_url: currentLicenseUrl,
    },
    {
      attachment_type: "REQUIREMENT_DOCUMENT",
      original_name: "Duplicate Current Business License.pdf",
      file_url: currentLicenseUrl,
    },
  ],
});

assert.deepEqual(documents, [
  { label: "Menu PDF", url: "https://files.example/menu.pdf" },
  { label: "Current Business License.pdf", url: currentLicenseUrl },
]);

assert.deepEqual(
  getMarketplaceAwardedDocuments({
    permit_license_urls: ["https://files.example/legacy-license.pdf"],
  }),
  [
    {
      label: "Business License/Permit 1",
      url: "https://files.example/legacy-license.pdf",
    },
  ],
);

console.log("marketplace awarded documents helper tests passed");
