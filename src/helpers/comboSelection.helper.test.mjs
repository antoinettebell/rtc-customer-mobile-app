import assert from "node:assert/strict";
import { hasMissingConfiguredComboChildren } from "./comboSelection.helper.js";

const configured = [
  { _id: "egg-roll", qty: 2, isAddOn: false },
  { _id: "loaded-rice", qty: 1, isAddOn: true },
];

assert.equal(
  hasMissingConfiguredComboChildren(
    configured,
    [
      { _id: "egg-roll", qty: 2, isAddOn: false },
      { _id: "loaded-rice", qty: 1 },
    ],
    1
  ),
  false,
  "optional add-ons must not count against the required included-item count"
);
assert.equal(
  hasMissingConfiguredComboChildren(
    configured,
    [{ _id: "loaded-rice", qty: 1, isAddOn: true }],
    1
  ),
  true,
  "an add-on cannot satisfy the required included combo item"
);

console.log("customer combo selection validation tests passed");
