import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeCustomerInvitationPath } from "./customerInvitationDeepLink.helper.js";

const appSource = readFileSync(new URL("../../App.js", import.meta.url), "utf8");
const androidManifest = readFileSync(
  new URL("../../android/app/src/main/AndroidManifest.xml", import.meta.url),
  "utf8",
);
const iosInfoPlist = readFileSync(
  new URL("../../ios/foodtruck/Info.plist", import.meta.url),
  "utf8",
);
const iosEntitlements = readFileSync(
  new URL("../../ios/foodtruck/foodtruck.entitlements", import.meta.url),
  "utf8",
);
const checkoutSource = readFileSync(
  new URL("../screens/marketplaceTicketCheckoutScreen.js", import.meta.url),
  "utf8",
);
const eventDetailsSource = readFileSync(
  new URL("../screens/marketplaceEventDetailsScreen.js", import.meta.url),
  "utf8",
);
const apiSource = readFileSync(
  new URL("../apiFolder/appAPI.js", import.meta.url),
  "utf8",
);

assert.match(
  appSource,
  /prefixes:\s*\["rtc-customer:\/\/",\s*"https:\/\/tickets\.roundthecornerapp\.com"\]/,
);
assert.match(appSource, /normalizeCustomerInvitationPath\(path\)/);
assert.equal(
  normalizeCustomerInvitationPath("events/token-from-email"),
  "invite/token-from-email",
);
assert.equal(
  normalizeCustomerInvitationPath("/events/token-from-email"),
  "invite/token-from-email",
);
assert.equal(
  normalizeCustomerInvitationPath("invite/legacy-token"),
  "invite/legacy-token",
);
assert.match(
  appSource,
  /marketplaceTicketCheckoutScreen:\s*"invite\/:shareToken"/,
);
assert.match(
  androidManifest,
  /<data android:scheme="rtc-customer" android:host="invite"\s*\/>/,
);
assert.match(androidManifest, /android:autoVerify="true"/);
assert.match(androidManifest, /android:scheme="https"/);
assert.match(androidManifest, /android:host="tickets\.roundthecornerapp\.com"/);
assert.match(androidManifest, /android:pathPrefix="\/events\/"/);
assert.match(iosInfoPlist, /<key>CFBundleURLSchemes<\/key>[\s\S]*<string>rtc-customer<\/string>/);
assert.match(
  iosEntitlements,
  /<key>com\.apple\.developer\.associated-domains<\/key>[\s\S]*<string>applinks:tickets\.roundthecornerapp\.com<\/string>/,
);
assert.match(appSource, /AuthNavigator[\s\S]*name="marketplaceEventDetailsScreen"/);
assert.match(appSource, /AuthNavigator[\s\S]*name="marketplaceTicketCheckoutScreen"/);
assert.match(checkoutSource, /headerTitle="Get Tickets" onBackPress={goBackWithoutSaving}/);
assert.match(checkoutSource, /Contact Information/);
assert.match(checkoutSource, /<StatePickerModal/);
assert.doesNotMatch(checkoutSource, /State \(2 letters\)/);
assert.match(checkoutSource, /checkoutGuestMarketplaceTickets_API/);
assert.doesNotMatch(checkoutSource, /AsyncStorage|persist|saveCart/i);
assert.match(eventDetailsSource, /!isSignedIn && !shareToken/);
assert.match(
  eventDetailsSource,
  /shareSubject = `\$\{event\.event_name\} - \$\{formatDate\(event\.event_date\)\} @ \$\{formatEventTime\(event\.event_time, event\)\}`/,
);
assert.match(eventDetailsSource, /message: `\$\{shareSubject\}\\nGet Tickets: \$\{url\}`/);
assert.match(eventDetailsSource, /subject: shareSubject/);
assert.match(apiSource, /MARKETPLACE_GUEST_TICKET_CHECKOUT\(shareToken\)[\s\S]*skipToken: true/);

console.log("customer invitation deep-link wiring checks passed");
