import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const source = fs.readFileSync(
  fileURLToPath(new URL("../screens/marketplaceMyTicketsScreen.js", import.meta.url)),
  "utf8",
);

assert.match(source, /Upcoming Events/);
assert.match(source, /Past Events/);
assert.match(source, /filterTicketOrders\(orders, activeFilter\)/);
assert.match(source, /toggleOrderExpanded/);
assert.match(source, /expandedOrderIds\.has\(order\.ticket_order_id\)/);
assert.match(source, /accessibilityState=\{\{ expanded \}\}/);

console.log("Marketplace My Tickets screen tests passed.");
