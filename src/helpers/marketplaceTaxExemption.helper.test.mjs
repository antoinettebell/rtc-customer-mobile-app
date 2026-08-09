import assert from "node:assert/strict";
import { normalizeMarketplaceTaxExemptionForForm } from "./marketplaceTaxExemption.helper.js";

assert.deepEqual(normalizeMarketplaceTaxExemptionForForm({
  charitable_event: true,
  religious_organization: false,
  tax_exemption_status: "APPROVED",
  tax_exemption_entity_use_code: "E",
  tax_exemption_certificate: { file_url: "https://files/charitable.pdf" },
}), {
  charitable_event: true,
  religious_organization: false,
  tax_exemption_status: "APPROVED",
  tax_exemption_entity_use_code: "E",
  tax_exemption_certificate_url: "https://files/charitable.pdf",
});

assert.equal(normalizeMarketplaceTaxExemptionForForm({
  tax_exemption_status: "APPROVED",
  tax_exemption_entity_use_code: "F",
  tax_exemption_certificate_url: "https://files/religious.pdf",
}).religious_organization, true);
for (const code of ["E", "F"]) {
  assert.deepEqual(normalizeMarketplaceTaxExemptionForForm({
    charitable_event: false,
    religious_organization: false,
    tax_exemption_status: "APPROVED",
    tax_exemption_entity_use_code: code,
  }), {
    charitable_event: false,
    religious_organization: false,
    tax_exemption_status: "APPROVED",
    tax_exemption_entity_use_code: code,
    tax_exemption_certificate_url: "",
  });
}
assert.equal(normalizeMarketplaceTaxExemptionForForm({
  tax_exemption_status: "APPROVED",
  tax_exemption_entity_use_code: "E",
}).charitable_event, true);
assert.equal(normalizeMarketplaceTaxExemptionForForm({
  tax_exemption_status: "APPROVED",
  tax_exemption_entity_use_code: "F",
}).religious_organization, true);
assert.equal(normalizeMarketplaceTaxExemptionForForm({
  charitable_event: true, religious_organization: true,
}).religious_organization, false);
assert.deepEqual(normalizeMarketplaceTaxExemptionForForm({}), {
  charitable_event: false,
  religious_organization: false,
  tax_exemption_status: "NOT_REQUESTED",
  tax_exemption_entity_use_code: null,
  tax_exemption_certificate_url: "",
});
console.log("Marketplace tax-exemption hydration tests passed.");
