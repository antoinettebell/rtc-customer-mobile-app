import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const helperSource = await readFile(
  new URL("./tip.helper.js", import.meta.url),
  "utf8",
);
const helperModuleUrl = `data:text/javascript;base64,${Buffer.from(
  helperSource,
).toString("base64")}`;
const { calculatePresetTip, calculateFinalTotal } = await import(helperModuleUrl);

for (const [percentage, expected] of [
  [5, 1.13],
  [8, 1.8],
  [10, 2.25],
  [12, 2.7],
]) {
  assert.equal(calculatePresetTip("22.50", percentage), expected);
}

assert.equal(calculatePresetTip("19.99", 5), 1);
assert.equal(calculateFinalTotal("22.50", "1.80"), 24.3);
assert.equal(calculateFinalTotal("22.50", 1.8), 24.3);

console.log("tip helper tests passed");
