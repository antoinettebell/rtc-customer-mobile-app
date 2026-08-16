import assert from "node:assert/strict";
import { getMarketplaceTicketExitRoute } from "./marketplaceTicketNavigation.helper.js";

assert.deepEqual(getMarketplaceTicketExitRoute(true), {
  name: "bottomRoot",
  params: { screen: "exploreScreen" },
});
assert.deepEqual(getMarketplaceTicketExitRoute(false), { name: "signin" });

console.log("marketplace ticket navigation helper tests passed");
