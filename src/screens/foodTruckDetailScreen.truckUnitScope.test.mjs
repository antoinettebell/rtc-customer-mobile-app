import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("./foodTruckDetailScreen.js", import.meta.url),
  "utf8",
);

assert.match(
  source,
  /const getActiveTruckUnit = \(foodTruck, preferredTruckUnitId, preferredLocationId\)/,
  "the detail screen must resolve an active truck unit for generic navigation",
);
assert.match(
  source,
  /const activeTruckUnitId = selectedTruckUnitId \|\| resolvedTruckUnit\?\._id \|\| null/,
  "an explicitly selected unit must remain authoritative",
);
assert.match(
  source,
  /if \(!item\?\._id \|\| !foodTruckDetail \|\| !activeTruckUnitId\)/,
  "the screen must not fetch a menu until it knows the active unit",
);
assert.match(
  source,
  /getFoodTruckMenuDetailById_API\(\s*item\?\._id,\s*truckUnitId\s*\)/,
  "menu requests must include the resolved truck-unit ID",
);
assert.doesNotMatch(
  source,
  /getFoodTruckMenuDetailById_API\(\s*item\?\._id,\s*selectedTruckUnitId\s*\)/,
  "menu requests must not fall back to an absent route truck-unit ID",
);
assert.match(
  source,
  /truckUnitId: activeTruckUnitId/,
  "cart and checkout context must use the same active truck unit as the menu",
);

console.log("food truck detail truck-unit scoping regression test passed");
