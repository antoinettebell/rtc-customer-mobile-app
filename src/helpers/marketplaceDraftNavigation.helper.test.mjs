import assert from "node:assert/strict";
import { getMarketplaceExitMode } from "./marketplaceDraftNavigation.helper.js";

assert.equal(getMarketplaceExitMode({ submitted: false, hasChanges: true }), "PROMPT_TO_SAVE");
assert.equal(getMarketplaceExitMode({ submitted: false, hasChanges: false }), "EXIT");
assert.equal(getMarketplaceExitMode({ submitted: true, hasChanges: true }), "EXIT_TO_MY_EVENTS");

console.log("marketplace draft navigation helper tests passed");
