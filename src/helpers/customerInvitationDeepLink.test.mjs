import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  consumePendingCustomerNavigation,
  normalizeCustomerInvitationPath,
  setPendingCustomerNavigation,
} from "./customerInvitationDeepLink.helper.js";

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
const ticketWebViewSource = readFileSync(
  new URL("../screens/marketplaceTicketWebViewScreen.js", import.meta.url),
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
  "event-invitation/token-from-email",
);
assert.equal(
  normalizeCustomerInvitationPath("/events/token-from-email"),
  "event-invitation/token-from-email",
);
assert.equal(
  normalizeCustomerInvitationPath("invite/legacy-token"),
  "invite/legacy-token",
);
assert.match(
  appSource,
  /marketplaceEventDetailsScreen:\s*"event-invitation\/:shareToken"/,
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
assert.match(appSource, /consumePendingCustomerNavigation\(\)/);
assert.match(appSource, /navigationRef\.navigate\(destination\.name, destination\.params\)/);
assert.match(checkoutSource, /headerTitle="Get Tickets" onBackPress={goBackWithoutSaving}/);
assert.match(checkoutSource, /Contact & Billing Information/);
assert.match(checkoutSource, /Email address \(required\)/);
assert.match(checkoutSource, /Phone number \(required\)/);
assert.match(checkoutSource, /Tickets and QR codes are texted to the phone number and emailed to the email address below/);
assert.match(checkoutSource, /Email: \{accountEmail/);
assert.match(checkoutSource, /Phone: \{accountPhone/);
assert.match(checkoutSource, /navigation\.reset\(\{ index: 0, routes: \[destination\] \}\)/);
assert.match(ticketWebViewSource, /navigation\.reset\(\{ index: 0, routes: \[destination\] \}\)/);
assert.match(
  ticketWebViewSource,
  /if \(isSignedIn && returnToMyTickets\)[\s\S]*navigation\.goBack\(\)/,
);
assert.match(checkoutSource, /<StatePickerModal/);
assert.doesNotMatch(checkoutSource, /State \(2 letters\)/);
assert.match(checkoutSource, /checkoutGuestMarketplaceTickets_API/);
assert.doesNotMatch(checkoutSource, /AsyncStorage|saveCart|persist(?:ed|ence|Checkout|TicketCart)/i);
assert.doesNotMatch(eventDetailsSource, /if \(!isSignedIn && !shareToken\)/);
assert.match(
  eventDetailsSource,
  /handleBuyTickets[\s\S]*if \(shareToken && !isSignedIn\)[\s\S]*navigation\.navigate\("signin", \{ returnToPrevious: true \}\)/,
);
setPendingCustomerNavigation({ name: "marketplaceTicketCheckoutScreen", params: { shareToken: "token" } });
assert.deepEqual(consumePendingCustomerNavigation(), {
  name: "marketplaceTicketCheckoutScreen",
  params: { shareToken: "token" },
});
assert.equal(consumePendingCustomerNavigation(), null);
assert.match(
  eventDetailsSource,
  /shareSubject = `\$\{event\.event_name\} - \$\{formatDate\(event\.event_date\)\} @ \$\{formatEventTime\(event\.event_time, event\)\}`/,
);
assert.match(eventDetailsSource, /message = `\$\{shareSubject\}\\nGet Tickets: \$\{url\}`/);
assert.match(eventDetailsSource, /smsSeparator = Platform\.OS === "ios" \? "&" : "\?"/);
assert.match(eventDetailsSource, /Linking\.openURL\(`sms:\$\{smsSeparator\}body=\$\{encodeURIComponent\(message\)\}`\)/);
assert.doesNotMatch(eventDetailsSource, /Share\.share\(/);
assert.match(apiSource, /MARKETPLACE_GUEST_TICKET_CHECKOUT\(shareToken\)[\s\S]*skipToken: true/);

console.log("customer invitation deep-link wiring checks passed");
