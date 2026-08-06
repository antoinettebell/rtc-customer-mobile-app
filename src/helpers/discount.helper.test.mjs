import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const helperSource = await readFile(
  new URL("./discount.helper.js", import.meta.url),
  "utf8"
);
const helperModuleUrl = `data:text/javascript;base64,${Buffer.from(
  helperSource
).toString("base64")}`;
const { calculateItemTotalWithDiscount, calculateOrderSubtotal } = await import(
  helperModuleUrl
);

assert.equal(
  calculateItemTotalWithDiscount({
    price: 0.01,
    quantity: 1,
    discountType: "BOGOHO",
    discountRules: { buyQty: 1, getQty: 1, discount: 0.5, repeatable: true },
    selectedToppings: ["Paid topping"],
    bogoItems: [{ price: 0.01, isSameItem: true }],
    selectedDiscountToppings: ["Reward topping"],
    toppingOptions: [
      { name: "Paid topping", hasCost: true, cost: 0.25 },
      { name: "Reward topping", hasCost: true, cost: 0.5 },
    ],
  }),
  0.77
);

const loadedFries = {
  menuItem: {
    toppingOptions: [
      { name: "Jalapeno", hasCost: true, cost: 0.5 },
      { name: "Chili and Cheese", hasCost: true, cost: 2 },
      { name: "Bacon Bits", hasCost: true, cost: 0.75 },
    ],
  },
  selectedToppings: ["Jalapeno", "Chili and Cheese", "Bacon Bits"],
};

const burger = {
  itemId: {
    toppingOptions: [{ name: "Fried Egg", hasCost: true, cost: 1 }],
  },
  selectedToppings: ["Fried Egg"],
};

assert.equal(
  calculateItemTotalWithDiscount({
    price: 0.01,
    quantity: 1,
    selectedSubItems: [loadedFries, burger],
  }),
  4.26
);

assert.equal(
  calculateItemTotalWithDiscount({
    price: 0.01,
    quantity: 1,
    discountType: "BOGO",
    selectedSubItems: [loadedFries, burger],
    selectedDiscountSubItems: [loadedFries],
  }),
  7.51
);

assert.equal(
  calculateItemTotalWithDiscount({
    price: 0.01,
    quantity: 1,
    discountType: "BOGOHO",
    selectedSubItems: [loadedFries, burger],
    selectedDiscountSubItems: [loadedFries],
  }),
  7.52
);

const basket = {
  price: 10,
  quantity: 1,
  toppingOptions: [
    { name: "Cheese", hasCost: true, cost: 0.5 },
    { name: "Jalapenos", hasCost: true, cost: 0.25 },
    { name: "Sauerkraut", hasCost: true, cost: 0.75 },
  ],
};

// Multiple quantity increases followed by one Update Order: the original line
// keeps its add-on and each new line is plain until separately customized.
assert.equal(
  calculateOrderSubtotal([
    { ...basket, selectedToppings: ["Cheese"] },
    { ...basket, selectedToppings: [] },
    { ...basket, selectedToppings: [] },
    { ...basket, selectedToppings: [] },
  ]),
  40.5
);

// Updating after every increase: each distinct line contributes only its own
// selected add-ons, regardless of how many Update Order actions occurred.
assert.equal(
  calculateOrderSubtotal([
    { ...basket, selectedToppings: ["Cheese"] },
    { ...basket, selectedToppings: ["Jalapenos"] },
    { ...basket, selectedToppings: [] },
    { ...basket, selectedToppings: ["Sauerkraut"] },
  ]),
  41.5
);

console.log("discount helper tests passed");
