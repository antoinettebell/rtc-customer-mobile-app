import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  new URL("../screens/marketplaceTicketCheckoutScreen.js", import.meta.url),
  "utf8",
);

assert.match(source, /const GOOGLE_PLACES_QUERY = Object\.freeze\(/);
assert.match(source, /const NO_PREDEFINED_PLACES = Object\.freeze\(\[\]\)/);
assert.match(source, /query=\{GOOGLE_PLACES_QUERY\}/);
assert.match(source, /predefinedPlaces=\{NO_PREDEFINED_PLACES\}/);
assert.doesNotMatch(source, /query=\{\{/);
assert.doesNotMatch(source, /predefinedPlaces=\{\[\]\}/);

console.log("marketplace ticket-checkout render stability tests passed");
