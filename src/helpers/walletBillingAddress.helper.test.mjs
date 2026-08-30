import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const helperSource = await readFile(
  new URL("./walletBillingAddress.helper.js", import.meta.url),
  "utf8",
);
const helperModuleUrl = `data:text/javascript;base64,${Buffer.from(
  helperSource,
).toString("base64")}`;
const { normalizeWalletBillingAddress } = await import(helperModuleUrl);

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
