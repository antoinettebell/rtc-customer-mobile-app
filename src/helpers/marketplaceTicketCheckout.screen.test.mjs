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
assert.match(
  source,
  /<ScrollView contentContainerStyle=\{styles\.body\} keyboardShouldPersistTaps="always">/,
);
assert.match(source, /placesList: \{ maxHeight: 220, marginTop: 4,/);
assert.doesNotMatch(source, /placesList: \{ position: "absolute"/);
assert.match(source, /text: guestCheckout \? "View Ticket" : "View All Tickets"/);
assert.match(source, /navigation\.replace\("marketplaceMyTicketsScreen"\)/);
assert.doesNotMatch(source, /text: "View First Ticket"/);
assert.match(source, /hasConfiguredTicketBucket\(event, "ga"\)/);
assert.match(source, /hasConfiguredTicketBucket\(event, "vip"\)/);
assert.match(source, /hasGaTickets \? <TicketRow type="ga"/);
assert.match(source, /hasVipTickets \? <TicketRow type="vip"/);

const ticketListSource = fs.readFileSync(
  new URL("../screens/marketplaceMyTicketsScreen.js", import.meta.url),
  "utf8",
);
const ticketViewerSource = fs.readFileSync(
  new URL("../screens/marketplaceTicketWebViewScreen.js", import.meta.url),
  "utf8",
);
assert.match(ticketListSource, /returnToMyTickets: true/);
assert.match(ticketViewerSource, /isSignedIn && returnToMyTickets/);
assert.match(ticketViewerSource, /navigation\.goBack\(\)/);

console.log("marketplace ticket-checkout render stability tests passed");
