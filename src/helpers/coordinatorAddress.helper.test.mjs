import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildCoordinatorAddressProfileFields,
  getCoordinatorAddressSelectionFromLocation,
  getGooglePlaceAddressSelection,
  hydrateCoordinatorAddressProfileFields,
  normalizeAddressStateInput,
  parseUsAddressFromGooglePlace,
  splitUsFormattedAddress,
} from "./address.helper.js";

const fullDetails = parseUsAddressFromGooglePlace({
  data: { place_id: "place-rockingham" },
  details: {
    formatted_address: "318 Rockingham Rd, Columbia, SC 29223, USA",
    geometry: { location: { lat: 34.089, lng: -80.938 } },
    address_components: [
      { long_name: "318", short_name: "318", types: ["street_number"] },
      { long_name: "Rockingham Road", short_name: "Rockingham Rd", types: ["route"] },
      { long_name: "Columbia", short_name: "Columbia", types: ["locality"] },
      { long_name: "South Carolina", short_name: "SC", types: ["administrative_area_level_1"] },
      { long_name: "29223", short_name: "29223", types: ["postal_code"] },
      { long_name: "United States", short_name: "US", types: ["country"] },
    ],
  },
});
assert.deepEqual(fullDetails, {
  line1: "318 Rockingham Road",
  city: "Columbia",
  state: "SC",
  zip: "29223",
  latitude: "34.089",
  longitude: "-80.938",
  country: "US",
  formattedAddress: "318 Rockingham Rd, Columbia, SC 29223, USA",
  placeId: "place-rockingham",
});

for (const description of [
  "318 Rockingham Rd, Columbia, SC 29223, USA",
  "318 Rockingham Rd, Columbia, SC 29223",
]) {
  const parsed = parseUsAddressFromGooglePlace({ data: { description } });
  assert.equal(parsed.line1, "318 Rockingham Rd");
  assert.equal(parsed.city, "Columbia");
  assert.equal(parsed.state, "SC");
  assert.equal(parsed.zip, "29223");
  assert.equal(parsed.formattedAddress, description);
}
const legacyCommaStyle = parseUsAddressFromGooglePlace({
  data: { description: "318 Rockingham Rd, Columbia SC 29223, USA" },
});
assert.equal(legacyCommaStyle.line1, "318 Rockingham Rd");
assert.equal(legacyCommaStyle.city, "Columbia");
assert.equal(legacyCommaStyle.state, "SC");
assert.equal(legacyCommaStyle.zip, "29223");

assert.deepEqual(
  splitUsFormattedAddress("138 Essie Bell Rd, Eastover SC 29044"),
  {
    line1: "138 Essie Bell Rd",
    city: "Eastover",
    state: "SC",
    zip: "29044",
  },
);
assert.deepEqual(splitUsFormattedAddress("138 Essie Bell Rd"), {
  line1: "",
  city: "",
  state: "",
  zip: "",
});

const validSelection = getGooglePlaceAddressSelection({
  data: { description: "318 Rockingham Rd, Columbia, SC 29223, USA" },
});
assert.equal(validSelection.shouldCloseSelection, true);
assert.equal(validSelection.error, "");

const incompleteSelection = getGooglePlaceAddressSelection({
  data: { description: "318 Rockingham Rd" },
});
assert.equal(incompleteSelection.shouldCloseSelection, false);
assert.match(incompleteSelection.error, /city, state, ZIP code/);
assert.equal(incompleteSelection.address.line1, "318 Rockingham Rd");

assert.equal(normalizeAddressStateInput("SC"), "SC");
assert.equal(typeof normalizeAddressStateInput("SC"), "string");
assert.equal(normalizeAddressStateInput({ value: "SC" }), "[object Object]");

const savedProfileFields = buildCoordinatorAddressProfileFields({
  ...fullDetails,
  line2: "Suite 4",
});
assert.deepEqual(hydrateCoordinatorAddressProfileFields(savedProfileFields), {
  ...fullDetails,
  line2: "Suite 4",
});

const locationSelection = getCoordinatorAddressSelectionFromLocation({
  title: "318 Rockingham Rd",
  address: "318 Rockingham Rd, Columbia, SC 29223, USA",
  city: "Columbia",
  state: "SC",
  zip: "29223",
  formattedAddress: "318 Rockingham Rd, Columbia, SC 29223, USA",
  placeId: "place-rockingham",
  lat: 34.089,
  long: -80.938,
  country: "US",
});
assert.equal(locationSelection.isComplete, true);
assert.equal(locationSelection.error, "");
assert.deepEqual(locationSelection.address, {
  line1: "318 Rockingham Rd",
  line2: "",
  city: "Columbia",
  state: "SC",
  zip: "29223",
  formattedAddress: "318 Rockingham Rd, Columbia, SC 29223, USA",
  placeId: "place-rockingham",
  latitude: "34.089",
  longitude: "-80.938",
  country: "US",
});

const incompleteLocationSelection = getCoordinatorAddressSelectionFromLocation({
  title: "318 Rockingham Rd",
  address: "318 Rockingham Rd, Columbia, SC, USA",
  city: "Columbia",
  state: "SC",
});
assert.equal(incompleteLocationSelection.isComplete, false);
assert.match(incompleteLocationSelection.error, /ZIP code/);

const ticketCheckoutSource = await readFile(
  new URL("../screens/marketplaceTicketCheckoutScreen.js", import.meta.url),
  "utf8",
);
assert.match(ticketCheckoutSource, /GooglePlacesAutocomplete/);
assert.doesNotMatch(
  ticketCheckoutSource,
  /textInputProps=\{\{[\s\S]*?value:\s*address\.line1[\s\S]*?\}\}/,
  "Google Places street input must not be controlled by its own onChange state",
);
assert.doesNotMatch(
  ticketCheckoutSource,
  /textInputProps=\{\{[\s\S]*?onChangeText[\s\S]*?\}\}/,
  "Ticket checkout must hydrate address fields from a selected Google result",
);
assert.match(ticketCheckoutSource, /onPress={selectGoogleAddress}/);
assert.match(ticketCheckoutSource, /getGooglePlaceAddressSelection/);
assert.match(ticketCheckoutSource, /components: "country:us"/);
assert.match(ticketCheckoutSource, /suppressDefaultStyles/);

console.log("Coordinator address autocomplete tests passed.");
