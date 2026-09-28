import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [screen, api] = await Promise.all([
  readFile(
    new URL("../screens/marketplaceEventDetailsScreen.js", import.meta.url),
    "utf8",
  ),
  readFile(new URL("../apiFolder/appAPI.js", import.meta.url), "utf8"),
]);

assert.match(screen, /Coordinator Budget/);
assert.match(screen, /setAwardedVipCoordinatorBudget/);
assert.match(
  screen,
  /updateMarketplaceAwardedVipGuestCount_API\([\s\S]*requestedCount,[\s\S]*requestedBudget/,
);
assert.match(api, /budgeted_amount:/);
assert.match(api, /Number\(budgetedAmount\)/);

console.log("marketplace award amendment budget screen tests passed");
