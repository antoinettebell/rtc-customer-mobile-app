import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getFavoriteFoodTruck_API,
  addFavoriteFoodTruck_API,
  removeFavoriteFoodTruck_API,
} from "../../apiFolder/appAPI";
import { store } from "../store";

// Async thunk to fetch favorite food trucks
export const fetchFavorites = createAsyncThunk(
  "favorites/fetchFavorites",
  async (_, { rejectWithValue }) => {
    try {
      const { defaultLocation } = store.getState().locationReducer; // Get defaultLocation from the Redux store

      let params = {};
      if (defaultLocation && defaultLocation.lat && defaultLocation.long) {
        params = {
          lat: defaultLocation.lat,
          long: defaultLocation.long,
        };
      }

      const response = await getFavoriteFoodTruck_API(params); // Pass params to the API call
      if (response?.success) {
        const normalizedFavorites = response.data.favoriteList.map((fav) => ({
          _id: fav._id, // The favorite entry ID
          foodTruck: fav.foodTruck || fav, // Ensure foodTruck object is present
          reviews: fav.reviews,
          distance: fav.distance,
          // Add other necessary fields from the favorite object if they exist directly on `fav`
        }));
        return normalizedFavorites;
      } else {
        return rejectWithValue(
          response?.message || "Failed to fetch favorite trucks"
        );
      }
    } catch (error) {
      console.error("Error fetching favorite trucks:", error);
      return rejectWithValue(
        error?.message || "Failed to fetch favorite trucks"
      );
    }
  }
);

// Async thunk to toggle favorite status
export const toggleFavorite = createAsyncThunk(
  "favorites/toggleFavorite",
  async (
    { foodTruckId, isCurrentlyLiked, foodTruckData = {} },
    { dispatch, rejectWithValue }
  ) => {
    try {
      if (isCurrentlyLiked) {
        // Remove from favorites
        const response = await removeFavoriteFoodTruck_API(foodTruckId);
        if (response?.success) {
          return { foodTruckId, action: "removed" };
        } else {
          return rejectWithValue(
            response?.message || "Failed to remove from favorites"
          );
        }
      } else {
        // Add to favorites
        const response = await addFavoriteFoodTruck_API(foodTruckId);
        if (response?.success) {
          const addedFoodTruck = response.data?.foodTruck || {
            _id: foodTruckId,
            ...foodTruckData,
          };
          return { foodTruck: addedFoodTruck, action: "added" };
        } else {
          return rejectWithValue(
            response?.message || "Failed to add to favorites"
          );
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      return rejectWithValue(error?.message || "Failed to toggle favorite");
    }
  }
);

const favoritesSlice = createSlice({
  name: "favorites",
  initialState: {
    favorites: [],
    loading: {}, // Changed to an object to track loading per foodTruckId
    isLoadingFavorites: false, // NEW: Added to track overall fetch loading
    error: null,
  },
  reducers: {
    // Synchronous actions (if needed, though async thunks handle most cases)
    clearFavorites: (state) => {
      state.favorites = [];
      state.loading = {}; // Clear individual loading states
      state.isLoadingFavorites = false; // Clear global loading state
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchFavorites lifecycle
      .addCase(fetchFavorites.pending, (state) => {
        state.isLoadingFavorites = true; // Set global loading for fetch
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.isLoadingFavorites = false; // Turn off global loading
        state.favorites = action.payload;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.isLoadingFavorites = false; // Turn off global loading
        state.error = action.payload;
      })
      // Handle toggleFavorite lifecycle
      .addCase(toggleFavorite.pending, (state, action) => {
        // Set loading for the specific foodTruckId
        state.loading[action.meta.arg.foodTruckId] = true;
        state.error = null;
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        // Remove loading for the specific foodTruckId
        delete state.loading[action.meta.arg.foodTruckId];

        if (action.payload.action === "added") {
          if (
            !state.favorites.some(
              (fav) => fav.foodTruck._id === action.payload.foodTruck._id
            )
          ) {
            state.favorites.push({
              _id: action.payload.foodTruck._id, // Using foodTruck._id as a fallback for favorite entry ID
              foodTruck: action.payload.foodTruck,
              reviews: action.payload.foodTruck.reviews || "0",
              distance: action.payload.foodTruck.distanceInMeters || "0",
            });
          }
        } else if (action.payload.action === "removed") {
          state.favorites = state.favorites.filter(
            (fav) => fav.foodTruck._id !== action.payload.foodTruckId
          );
        }
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        // Remove loading for the specific foodTruckId and set error
        delete state.loading[action.meta.arg.foodTruckId];
        state.error = action.payload;
      });
  },
});

export const { clearFavorites } = favoritesSlice.actions; // Export clearFavorites action

export default favoritesSlice.reducer;
