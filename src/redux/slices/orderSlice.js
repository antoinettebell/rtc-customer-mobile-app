import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentOrder: {
    foodTruckId: null,
    foodTruckName: null,
    foodTruckLogo: null,
    items: [],
    totalItems: 0,
    subtotal: 0,
    tax: 0,
    total: 0,
    lastUpdate: null,
  },
  orderHistory: [],
};

// Helper function to calculate item price with BOGO/BOGOHO discounts
const calculateItemTotal = (item) => {
  let total = item.price * item.quantity;

  // Handle BOGOHO discount type
  if (
    item.discountType === "BOGOHO" &&
    item.bogoItems &&
    item.bogoItems.length > 0
  ) {
    // For BOGOHO, add half price of each bogo item for each quantity
    item.bogoItems.forEach((bogoItem) => {
      // Add half price of each bogo item for each quantity of the main item
      total += bogoItem.itemId.price * 0.5 * item.quantity * bogoItem.qty;
    });
  }
  // Note: For BOGO, no additional charge (free items)

  return total;
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    addItemToOrder: (state, { payload }) => {
      const { foodTruckId, foodTruckName, foodTruckLogo, item } = payload;

      // If this is the first item or from a different food truck, reset the order
      if (
        !state.currentOrder.foodTruckId ||
        state.currentOrder.foodTruckId !== foodTruckId
      ) {
        state.currentOrder = {
          foodTruckId,
          foodTruckName,
          foodTruckLogo,
          items: [],
          totalItems: 0,
          subtotal: 0,
          tax: 0,
          total: 0,
          lastUpdate: new Date().toISOString(),
        };
      }

      // Check if item already exists in order
      const existingItemIndex = state.currentOrder.items.findIndex(
        (i) => i._id === item._id
      );

      if (existingItemIndex === -1) {
        // Add new item
        state.currentOrder.items.push({
          ...item,
          quantity: 1, // Always start with 1, UI handles minQty check before adding
        });
      } else {
        // Increment quantity of existing item. UI should have already checked maxQty.
        state.currentOrder.items[existingItemIndex].quantity += 1;
      }

      // Update order totals
      state.currentOrder.totalItems = state.currentOrder.items.length;
      // state.currentOrder.totalItems = state.currentOrder.items.reduce(
      //   (sum, item) => sum + item.quantity,
      //   0
      // );
      state.currentOrder.subtotal = state.currentOrder.items.reduce(
        (sum, item) => sum + calculateItemTotal(item),
        0
      );
      state.currentOrder.lastUpdate = new Date().toISOString();
    },

    removeItemFromOrder: (state, { payload }) => {
      const { itemId } = payload;
      const itemIndex = state.currentOrder.items.findIndex(
        (item) => item._id === itemId
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

      // Create maps of existing item data for quick lookup
      const existingItemData = {};
      state.currentOrder.items.forEach((item) => {
        existingItemData[item._id] = {
          quantity: item.quantity || 1,
          customizationInput: item.customizationInput || "",
        };
      });

      // Map new items while preserving existing data
      const updatedItems = newItems.map((newItem) => {
        const existingData = existingItemData[newItem._id] || {};
        return {
          ...newItem,
          quantity: existingData.quantity || 1, // default to 1 if not found
          customizationInput: existingData.customizationInput || "", // default to empty string
        };
      });

      // Update the items array
      state.currentOrder.items = updatedItems;

      // Recalculate totals
      state.currentOrder.totalItems = updatedItems.length;
      state.currentOrder.subtotal = updatedItems.reduce(
        (sum, item) => sum + calculateItemTotal(item),
        0
      );
    },

    updateItemProperty: (state, { payload }) => {
      const { itemId, keyName, value } = payload;

      // Find the item index
      const itemIndex = state.currentOrder.items.findIndex(
        (item) => item._id === itemId
      );

      if (itemIndex !== -1) {
        // Update or add the property while preserving all other data
        state.currentOrder.items[itemIndex] = {
          ...state.currentOrder.items[itemIndex],
          [keyName]: value,
        };

        // Recalculate totals if the updated property affects pricing
        if (["price", "discount", "quantity"].includes(keyName)) {
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
