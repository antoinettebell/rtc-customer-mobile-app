import assert from "node:assert/strict";
import {
  MARKETPLACE_EVENT_REQUIRED_FIELDS,
  getMarketplaceRequiredFieldValue,
  getMissingMarketplaceRequiredField,
} from "./marketplaceEventRequiredFields.helper.js";

const requiredFields = ["event_name", "primary_service_style"];

assert.equal(
  getMarketplaceRequiredFieldValue(
    { primary_service_style: "", service_styles: ["Buffet"] },
    "primary_service_style",
  ),
  "Buffet",
);
assert.equal(
  getMissingMarketplaceRequiredField(
    {
      event_name: "Direct submit event",
      primary_service_style: "",
      service_styles: ["Buffet"],
    },
    requiredFields,
  ),
  null,
);
assert.equal(
  getMissingMarketplaceRequiredField(
    {
      event_name: "Direct submit event",
      primary_service_style: "",
      service_styles: [],
    },
    requiredFields,
  ),
  "primary_service_style",
);
assert.equal(
  MARKETPLACE_EVENT_REQUIRED_FIELDS.includes("event_close_time"),
  false,
);
assert.equal(
  getMissingMarketplaceRequiredField(
    {
      event_name: "Direct submit event",
      event_type: "Wedding",
      primary_service_style: "Family Style / Stations",
      event_date: "2026-08-29",
      event_time: "3:30 PM",
      event_address: "437 Hyde Street",
      event_city: "San Francisco",
      event_state: "CA",
      number_of_guests: "150",
      event_close_date: "2026-08-25",
      event_close_time: "",
    },
    MARKETPLACE_EVENT_REQUIRED_FIELDS,
  ),
  null,
);

console.log("marketplace event required-field tests passed");
