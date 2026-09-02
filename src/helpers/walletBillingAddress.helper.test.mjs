import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const helperSource = await readFile(
  new URL("./walletBillingAddress.helper.js", import.meta.url),
  "utf8",
);
const helperModuleUrl = `data:text/javascript;base64,${Buffer.from(
  helperSource,
).toString("base64")}`;
const {
  assertApplePayConfiguration,
  normalizeWalletBillingAddress,
} = await import(helperModuleUrl);

// The iOS payments package currently puts Apple's city/state in address2/3.
// Preserve those fields as CyberSource locality/administrativeArea.

assert.deepEqual(
  normalizeWalletBillingAddress({
    address1: "1 Infinite Loop",
    address2: "Cupertino",
    address3: "CA",
    administrativeArea: "",
    countryCode: "US",
    postalCode: "95014",
  }),
  {
    address1: "1 Infinite Loop",
    locality: "Cupertino",
    administrativeArea: "CA",
    postalCode: "95014",
    country: "US",
  },
);

assert.doesNotThrow(() => assertApplePayConfiguration({
  APPLE_PAY_ENABLED: "true",
  APPLE_PAY_MERCHANT_ID: "merchant.example.customer",
}));
assert.throws(
  () => assertApplePayConfiguration({ APPLE_PAY_ENABLED: "false" }),
  /Apple Pay is disabled/,
);
assert.deepEqual(
  normalizeWalletBillingAddress({
    address1: "123 Main St",
    locality: "Austin",
    administrativeArea: "TX",
    countryCode: "US",
    postalCode: "78701",
  }),
  {
    address1: "123 Main St",
    locality: "Austin",
    administrativeArea: "TX",
    postalCode: "78701",
    country: "US",
  },
);

console.log("wallet billing address helper tests passed");
