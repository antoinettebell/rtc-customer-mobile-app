import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getEventVendorRequirementRows } from "./marketplaceEventRequirements.helper.js";

const emptyRows = [
  { vendorType: "MERCHANDISE", requested: 0, filled: 0, remaining: 0 },
  { vendorType: "SERVICE", requested: 0, filled: 0, remaining: 0 },
  { vendorType: "OTHER", requested: 0, filled: 0, remaining: 0 },
];

assert.deepEqual(getEventVendorRequirementRows(null), emptyRows);
assert.deepEqual(getEventVendorRequirementRows(undefined), emptyRows);
assert.deepEqual(getEventVendorRequirementRows({}), emptyRows);

assert.deepEqual(
  getEventVendorRequirementRows({
    event_vendor_requirement_summary: [
      { vendor_type: "MERCHANDISE", requested: 3, filled: 1, remaining: 2 },
    ],
    event_vendor_needs: [
      { vendor_type: "SERVICE", quantity: 2 },
    ],
  }),
  [
    { vendorType: "MERCHANDISE", requested: 3, filled: 1, remaining: 2 },
    { vendorType: "SERVICE", requested: 2, filled: 0, remaining: 2 },
    { vendorType: "OTHER", requested: 0, filled: 0, remaining: 0 },
  ],
);

const detailsSource = await readFile(
  new URL("../screens/marketplaceEventDetailsScreen.js", import.meta.url),
  "utf8",
);
assert.match(detailsSource, /useState\(!initialEvent\)/);
assert.match(detailsSource, /\) : !event \? \(/);
assert.match(detailsSource, /requirement\.requested > 0/);
assert.match(detailsSource, /Vendors Selected: \{requirement\.filled\} of \{requirement\.requested\}/);

console.log("Marketplace event requirement rows tests passed.");
