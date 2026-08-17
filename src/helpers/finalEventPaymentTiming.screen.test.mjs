import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  new URL("../screens/marketplaceEventDetailsScreen.js", import.meta.url),
  "utf8",
);

assert.match(source, /final_payment_timing\?\.available_at/);
assert.match(source, /currentTime >= paymentAvailableAt/);
assert.doesNotMatch(source, /Date\.now\(\) < timing\.end_at/);
assert.match(source, /finalPaymentStatus === "PAID"[\s\S]*Final payment has been completed/);
assert.match(source, /disabled=\{!!finalPaymentLoadingId \|\| !eventHasStarted\}/);

console.log("Customer final-event payment timing screen tests passed.");
