import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentOrder: {
    foodTruckId: null,
    foodTruckName: null,
    items: [],
    totalItems: 0,
    subtotal: 0,
    tax: 0,
    total: 0,
  },
  orderHistory: [],
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    addItemToOrder: (state, { payload }) => {
      const { foodTruckId, foodTruckName, item } = payload;

      // If this is the first item or from a different food truck, reset the order
      if (
        !state.currentOrder.foodTruckId ||
        state.currentOrder.foodTruckId !== foodTruckId
      ) {
        state.currentOrder = {
          foodTruckId,
          foodTruckName,
          items: [],
          totalItems: 0,
          subtotal: 0,
          tax: 0,
          total: 0,
        };
      }

      // Check if item already exists in order
      const existingItemIndex = state.currentOrder.items.findIndex(
        (i) => i.id === item.id
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
      state.currentOrder.totalItems = state.currentOrder.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      state.currentOrder.subtotal = state.currentOrder.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      // Assuming a fixed tax rate for calculation example, adjust if dynamic
      state.currentOrder.tax = state.currentOrder.subtotal * 0.1;
      state.currentOrder.total =
        state.currentOrder.subtotal + state.currentOrder.tax;
    },

    removeItemFromOrder: (state, { payload }) => {
      const { itemId } = payload;
      const itemIndex = state.currentOrder.items.findIndex(
        (item) => item.id === itemId
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
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        state.currentOrder.tax = state.currentOrder.subtotal * 0.1;
        state.currentOrder.total =
          state.currentOrder.subtotal + state.currentOrder.tax;

        // If no items left, reset the order
        if (state.currentOrder.items.length === 0) {
          state.currentOrder = initialState.currentOrder;
        }
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
  clearCurrentOrder,
  addToOrderHistory,
  clearOrderSlice,
} = orderSlice.actions;

export default orderSlice.reducer;
