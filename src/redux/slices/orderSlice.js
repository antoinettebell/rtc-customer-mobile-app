import { createSlice } from "@reduxjs/toolkit";
import { foodTypeStrings } from "../../utils/constants";

const initialState = {
  currentOrder: {
    foodTruckId: null,
    foodTruckName: null,
    foodTruckLogo: null,
    truckUnitId: null,
    locationId: null,
    items: [],
    totalItems: 0,
    subtotal: 0,
    tax: 0,
    total: 0,
    lastUpdate: null,
  },
  orderHistory: [],
};

import { calculateItemTotalWithDiscount } from "../../helpers/discount.helper";

const calculateItemTotal = (item) => {
  return calculateItemTotalWithDiscount(item);
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    addItemToOrder: (state, { payload }) => {
      const {
        foodTruckId,
        foodTruckName,
        foodTruckLogo,
        truckUnitId = null,
        locationId = null,
        item,
      } = payload;

      // If this is the first item or from a different food truck, reset the order
      if (
        !state.currentOrder.foodTruckId ||
        state.currentOrder.foodTruckId !== foodTruckId ||
        state.currentOrder.truckUnitId !== truckUnitId ||
        state.currentOrder.locationId !== locationId
      ) {
        state.currentOrder = {
          foodTruckId,
          foodTruckName,
          foodTruckLogo,
          truckUnitId,
          locationId,
          items: [],
          totalItems: 0,
          subtotal: 0,
          tax: 0,
          total: 0,
          lastUpdate: new Date().toISOString(),
        };
      }

      const forceNewLine = item._forceNewLine === true;
      const cleanItem = { ...item };
      delete cleanItem._forceNewLine;
      const existingItemIndex = forceNewLine
        ? -1
        : state.currentOrder.items.findIndex((i) =>
            cleanItem._cartLineId
              ? (i._cartLineId || i._id) === cleanItem._cartLineId
              : i._id === cleanItem._id
          );

      if (existingItemIndex === -1) {
        // Add new item
        state.currentOrder.items.push({
          ...cleanItem,
          quantity: 1, // Always start with 1, UI handles minQty check before adding
        });
      } else {
        // Increment quantity of existing item. UI should have already checked maxQty.
        state.currentOrder.items[existingItemIndex].quantity += 1;
      }

      // Update order totals
      state.currentOrder.totalItems = state.currentOrder.items.reduce(
        (sum, orderItem) => sum + (Number(orderItem.quantity) || 0),
        0
      );
      state.currentOrder.subtotal = state.currentOrder.items.reduce(
        (sum, item) => sum + calculateItemTotal(item),
        0
      );
      state.currentOrder.lastUpdate = new Date().toISOString();
    },

    removeItemFromOrder: (state, { payload }) => {
      const { itemId } = payload;
      const itemIndex = state.currentOrder.items.findIndex(
        (item) =>
          (item._cartLineId || item._id) === itemId || item._id === itemId
      );

      if (itemIndex !== -1) {
        // Decrement quantity if more than 1, otherwise remove the item.
        // UI should have already handled minQty checks before dispatching.
        if (state.currentOrder.items[itemIndex].quantity > 1) {
          state.currentOrder.items[itemIndex].quantity -= 1;
        } else {
          // Remove item if quantity is 1 (or less, though it shouldn't go below 0)
          state.currentOrder.items.splice(itemIndex, 1);
        }

        // Update order totals
        state.currentOrder.totalItems = state.currentOrder.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        state.currentOrder.subtotal = state.currentOrder.items.reduce(
          (sum, item) => sum + calculateItemTotal(item),
          0
        );

        // If no items left, reset the order
        if (state.currentOrder.items.length === 0) {
          state.currentOrder = initialState.currentOrder;
        }
        state.currentOrder.lastUpdate = new Date().toISOString();
      }
    },

    updateAllItemsOfOrder: (state, { payload }) => {
      const newItems = payload;

      // Customized copies of the same menu item are separate cart lines. Match
      // those lines by their stable cart ID so one copy's selections cannot be
      // applied to every copy during the checkout menu-data refresh.
      const existingItemsByLineId = new Map();
      const existingItemsByMenuId = new Map();
      state.currentOrder.items.forEach((item) => {
        if (item._cartLineId) {
          existingItemsByLineId.set(item._cartLineId, item);
        }
        const menuId = item._id;
        const matchingItems = existingItemsByMenuId.get(menuId) || [];
        matchingItems.push(item);
        existingItemsByMenuId.set(menuId, matchingItems);
      });

      // Map new items while preserving existing data
      const updatedItems = newItems.map((newItem) => {
        const fallbackItems = existingItemsByMenuId.get(newItem._id) || [];
        const existingData = newItem._cartLineId
          ? existingItemsByLineId.get(newItem._cartLineId)
          : fallbackItems.shift();
        const preserved = existingData || {};
        return {
          ...newItem,
          quantity: preserved.quantity || 1,
          customizationInput: preserved.customizationInput || "",
          selectedFlavors: preserved.selectedFlavors || [],
          selectedToppings: preserved.selectedToppings || [],
          selectedDiscountFlavors: preserved.selectedDiscountFlavors || [],
          selectedDiscountToppings: preserved.selectedDiscountToppings || [],
          selectedDiscountCustomizationInput:
            preserved.selectedDiscountCustomizationInput || "",
          selectedDiscountComboSides:
            preserved.selectedDiscountComboSides || [],
          selectedDiscountSubItems:
            preserved.selectedDiscountSubItems || [],
          selectedComboSides: preserved.selectedComboSides || [],
          selectedSubItems: preserved.selectedSubItems || [],
        };
      });

      // Update the items array
      state.currentOrder.items = updatedItems;

      // Recalculate totals
      state.currentOrder.totalItems = updatedItems.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
      );
      state.currentOrder.subtotal = updatedItems.reduce(
        (sum, item) => sum + calculateItemTotal(item),
        0
      );
    },

    updateItemProperty: (state, { payload }) => {
      const { itemId, keyName, value } = payload;

      // Find the item index
      const itemIndex = state.currentOrder.items.findIndex(
        (item) => (item._cartLineId || item._id) === itemId
      );

      if (itemIndex !== -1) {
        // Update or add the property while preserving all other data
        state.currentOrder.items[itemIndex] = {
          ...state.currentOrder.items[itemIndex],
          [keyName]: value,
        };

        // Recalculate totals if the updated property affects pricing
        if (
          [
            "price",
            "discount",
            "quantity",
            "selectedFlavors",
            "selectedToppings",
            "selectedDiscountFlavors",
            "selectedDiscountToppings",
            "selectedDiscountComboSides",
            "selectedDiscountSubItems",
            "selectedSubItems",
          ].includes(keyName)
        ) {
          state.currentOrder.subtotal = state.currentOrder.items.reduce(
            (sum, item) => sum + calculateItemTotal(item),
            0
          );
        }
        state.currentOrder.lastUpdate = new Date().toISOString();
      }
    },

    clearCurrentOrder: (state) => {
      state.currentOrder = initialState.currentOrder;
    },

    addToOrderHistory: (state, { payload }) => {
      state.orderHistory.unshift(payload);
    },

    clearOrderSlice: () => initialState,
  },
});

export const {
  addItemToOrder,
  removeItemFromOrder,
  updateAllItemsOfOrder,
  updateItemProperty,
  clearCurrentOrder,
  addToOrderHistory,
  clearOrderSlice,
} = orderSlice.actions;

export default orderSlice.reducer;
