import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getCustomerOrderListParams } from "./customerOrderView.helper.js";

assert.deepEqual(getCustomerOrderListParams({ page: 2 }), {
  page: 2,
  limit: 20,
  orderView: "active",
  orderStatus: "PLACED,ACCEPTED,PREPARING,READY_FOR_PICKUP,DRIVER_PICKED_UP",
});

assert.deepEqual(getCustomerOrderListParams({ isPast: true }), {
  page: 1,
  limit: 20,
  orderView: "past",
  orderStatus: "CANCEL,REJECTED,DELIVERED,COMPLETED",
});

const apiSource = await readFile(
  new URL("../apiFolder/appAPI.js", import.meta.url),
  "utf8",
);
assert.match(apiSource, /orderView/);

console.log("Customer order view request tests passed.");
