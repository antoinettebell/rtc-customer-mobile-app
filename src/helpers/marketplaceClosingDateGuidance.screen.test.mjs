import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  new URL("../screens/marketplaceCreateEventScreen.js", import.meta.url),
  "utf8",
);
const detailsSource = fs.readFileSync(
  new URL("../screens/marketplaceEventDetailsScreen.js", import.meta.url),
  "utf8",
);

assert.match(source, /accessibilityLabel="Closing Date information"/);
assert.match(
  source,
  /All applications and awards must be accepted by this date\./,
);
assert.match(source, /Alert\.alert\("Closing Date", infoMessage\)/);
assert.match(detailsSource, /label="Close Date"/);
assert.match(
  detailsSource,
  /infoMessage="All applications and awards must be accepted by this date\."/,
);

console.log("marketplace closing-date guidance tests passed");
