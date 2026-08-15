import assert from "node:assert/strict";
import {
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

console.log("marketplace event required-field tests passed");
