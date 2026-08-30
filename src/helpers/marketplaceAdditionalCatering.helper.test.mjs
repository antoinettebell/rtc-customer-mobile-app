import assert from "node:assert/strict";
import fs from "node:fs";
import { shouldShowAdditionalCatererNeeds } from "./marketplaceAdditionalCatering.helper.js";

assert.equal(
  shouldShowAdditionalCatererNeeds({
    fully_catered_event: true,
    number_of_guests: "100",
    catered_vip_section_enabled: false,
  }),
  true,
  "fully catered GA events must show the additional caterer questions without VIP catering",
);
assert.equal(
  shouldShowAdditionalCatererNeeds({
    fully_catered_event: true,
    number_of_guests: 0,
    catered_vip_section_enabled: true,
  }),
  false,
  "VIP catering alone must not make the questions visible",
);
assert.equal(
  shouldShowAdditionalCatererNeeds({
    fully_catered_event: false,
    number_of_guests: 100,
    catered_vip_section_enabled: true,
  }),
  false,
  "non-fully-catered events must not show the questions",
);

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const createEventSource = read("../screens/marketplaceCreateEventScreen.js");
const marketplaceApiSource = read("../apiFolder/appAPI.js");

assert.match(
  createEventSource,
  /shouldShowAdditionalCatererNeeds\(form\)/,
  "the event form must use the focused visibility rule",
);
assert.match(
  marketplaceApiSource,
  /"dessert_caterer_required",\n\s*"drinks_caterer_required"/,
  "the existing dessert and drinks field names must reach the marketplace API",
);

console.log("marketplace additional catering eligibility tests passed");
