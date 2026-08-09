import assert from "node:assert/strict";
import fs from "node:fs";
const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const appApi = read("../apiFolder/appAPI.js");
const eventDetails = read("../screens/marketplaceEventDetailsScreen.js");
const guestAction = read("./guestAction.helper.js");
const signIn = read("../screens/signinScreen.js");

assert.match(appApi, /getPublicMarketplaceEventById_API[\s\S]*skipToken: !isSignedIn/);
assert.match(eventDetails, /if \(!isSignedIn\) \{\s*showGuestSignupRequired\(navigation\);\s*return;/);
assert.match(guestAction, /"Sign Up Required",\s*"Please Sign Up to complete this action\."/);
assert.match(guestAction, /returnToPrevious: true/);
assert.match(signIn, /returnToPrevious && navigation\.canGoBack\(\)/);
assert.match(signIn, /navigation\.goBack\(\)/);
assert.match(signIn, /navigation\.reset\(\{ index: 0, routes: \[\{ name: "authIntro" \}\] \}\)/);
console.log("Guest public-event access tests passed.");
