import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const helperSource = await readFile(
  new URL("./review.helper.js", import.meta.url),
  "utf8"
);
const helperModuleUrl = `data:text/javascript;base64,${Buffer.from(
  helperSource
).toString("base64")}`;
const { formatRatingWithSanitationGrade } = await import(helperModuleUrl);

assert.equal(
  formatRatingWithSanitationGrade({ featured: true, reviewCount: 0 }),
  "Featured Vendor"
);
assert.equal(
  formatRatingWithSanitationGrade({ featured: false, reviewCount: 0 }),
  "New vendor"
);
assert.equal(
  formatRatingWithSanitationGrade({
    featured: true,
    averageRating: 4.5,
    reviewCount: 2,
  }),
  "4.5 (2 reviews)"
);

console.log("review helper tests passed");
