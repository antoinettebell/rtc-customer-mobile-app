import assert from "node:assert/strict";
import {
  formatMarketplaceCalendarDate,
  formatMarketplaceZonedDate,
  normalizeMarketplaceZonedDateForForm,
} from "./marketplaceDate.helper.js";

assert.equal(formatMarketplaceCalendarDate(null), "Not set");
assert.equal(formatMarketplaceCalendarDate("2026-08-17"), "08/17/2026");
assert.equal(
  formatMarketplaceCalendarDate("2026-08-17T00:00:00.000Z"),
  "08/17/2026",
);
assert.equal(
  formatMarketplaceCalendarDate(new Date("2026-08-17T00:00:00.000Z")),
  "08/17/2026",
);
assert.equal(formatMarketplaceCalendarDate("not-a-date"), "not-a-date");
const invalidDate = new Date("not-a-date");
assert.equal(formatMarketplaceCalendarDate(invalidDate), invalidDate);

assert.equal(
  formatMarketplaceZonedDate(
    "2026-08-18T03:00:00.000Z",
    "America/New_York",
  ),
  "08/17/2026",
);
assert.equal(
  normalizeMarketplaceZonedDateForForm(
    "2026-08-18T03:00:00.000Z",
    "America/New_York",
  ),
  "2026-08-17",
);

console.log("marketplace calendar-date tests passed");
