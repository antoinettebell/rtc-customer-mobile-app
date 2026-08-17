import assert from "node:assert/strict";
import fs from "node:fs";
const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const appApi = read("../apiFolder/appAPI.js");
const eventDetails = read("../screens/marketplaceEventDetailsScreen.js");
const guestAction = read("./guestAction.helper.js");
const signIn = read("../screens/signinScreen.js");

assert.match(appApi, /getPublicMarketplaceEventById_API[\s\S]*skipToken: !isSignedIn/);
assert.doesNotMatch(eventDetails, /showGuestSignupRequired\(navigation\)/);
assert.match(eventDetails, /navigation\.navigate\("marketplaceTicketCheckoutScreen", \{ event, shareToken \}\)/);
assert.match(eventDetails, /const handleBuyTickets = \(\) => \{\s*navigation\.navigate/);
assert.match(eventDetails, /const handleCustomerEventImagePress = async \(\) => \{[\s\S]*navigation\.navigate\("marketplaceTicketCheckoutScreen"/);
assert.match(guestAction, /"Sign Up Required",\s*"Please Sign Up to complete this action\."/);
assert.match(guestAction, /returnToPrevious: true/);
assert.match(signIn, /returnToPrevious && navigation\.canGoBack\(\)/);
assert.match(signIn, /navigation\.goBack\(\)/);
assert.match(signIn, /navigation\.reset\(\{ index: 0, routes: \[\{ name: "authIntro" \}\] \}\)/);
console.log("Guest public-event access tests passed.");
