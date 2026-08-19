import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  new URL("../screens/marketplaceEventDetailsScreen.js", import.meta.url),
  "utf8",
);

assert.match(source, /label="Gross Ticket Sales"/);
assert.match(source, /label="Collected Sales Tax"/);
assert.match(source, /label="Estimated Ticket Proceeds"/);
assert.doesNotMatch(source, /RTC Ticket Fee \(1\.5% \+ \$1\/ticket\)/);
assert.doesNotMatch(source, /label="Estimated Net Payout"/);

console.log("marketplace ticket-proceeds presentation tests passed");
