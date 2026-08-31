import assert from "node:assert/strict";
import { hasConfiguredTicketBucket } from "./marketplaceTicketAvailability.helper.js";

assert.equal(hasConfiguredTicketBucket({ ga_ticket_quantity: 1 }, "ga"), true);
assert.equal(hasConfiguredTicketBucket({ ga_ticket_quantity: "1" }, "ga"), true);
assert.equal(hasConfiguredTicketBucket({ vip_ticket_quantity: 0 }, "vip"), false);
assert.equal(hasConfiguredTicketBucket({}, "vip"), false);

console.log("marketplace ticket availability tests passed");
