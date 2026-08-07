import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./marketplaceDraftState.helper.js", import.meta.url), "utf8");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const { buildMarketplaceDraftSnapshot } = await import(moduleUrl);

const baseForm = {
  event_name: "Festival",
  event_description: "Community event",
  event_date: "2026-09-01",
  event_time: "12:00",
  event_address: "1 Main St",
  event_visibility: "PRIVATE",
  ticket_sales_enabled: false,
  ga_ticket_quantity: "100",
  ga_ticket_price: "10",
  vip_ticket_quantity: "20",
  vip_ticket_price: "25",
  vip_section_enabled: true,
  vip_section_details: "Tent",
  catered_vip_section_enabled: true,
  ga_food_sales_allowed: true,
  waive_vendor_fee_for_combined_award: true,
  separate_vip_vendor_required: true,
  number_of_vendors_needed: "2",
  cuisine_preferences: ["BBQ"],
  free_food_offered: false,
  budgeted_amount: "500",
  vendor_fee: "25",
  vendor_fee_payment_deadline: "2026-08-20",
  requirements: "Insurance",
};
const snapshot = (form = baseForm, eventImages = [], exemptionCertificate = null) =>
  buildMarketplaceDraftSnapshot({ form, eventImages, exemptionCertificate });

assert.equal(snapshot(), snapshot(), "an untouched form remains clean");

for (const [field, value] of [
  ["ticket_sales_enabled", true],
  ["ga_ticket_price", "12"],
  ["vip_section_enabled", false],
  ["catered_vip_section_enabled", false],
  ["ga_food_sales_allowed", false],
  ["waive_vendor_fee_for_combined_award", false],
  ["number_of_vendors_needed", "3"],
  ["free_food_offered", true],
  ["budgeted_amount", "750"],
  ["vendor_fee_payment_deadline", "2026-08-21"],
  ["requirements", "Insurance and power"],
  ["event_date", "2026-09-02"],
  ["event_description", "Updated description"],
]) {
  assert.notEqual(snapshot({ ...baseForm, [field]: value }), snapshot(), `${field} marks the draft dirty`);
}

const image = { uri: "file:///event.jpg", name: "event.jpg", type: "image/jpeg" };
const certificate = { uri: "file:///certificate.pdf", name: "certificate.pdf", type: "application/pdf" };
assert.notEqual(snapshot(baseForm, [image]), snapshot(), "adding an image marks the draft dirty");
assert.notEqual(snapshot(baseForm, [], certificate), snapshot(), "adding a document marks the draft dirty");
assert.notEqual(snapshot(baseForm, []), snapshot(baseForm, [image]), "removing an image marks the draft dirty");

const hydratedBaseline = snapshot(baseForm, [image], certificate);
assert.equal(snapshot(baseForm, [image], certificate), hydratedBaseline, "hydration can establish a clean baseline");
const edited = snapshot({ ...baseForm, event_name: "Edited" }, [image], certificate);
assert.notEqual(edited, hydratedBaseline, "an edit after hydration is dirty");
const savedBaseline = edited;
assert.equal(edited, savedBaseline, "a successful save can reset the baseline");

console.log("marketplace draft state helper tests passed");
