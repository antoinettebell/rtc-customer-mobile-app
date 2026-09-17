import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../apiFolder/apiClient";
import {
  ADD_FAVORITE_FOODTRUCK,
  GET_FAVORITE_FOODTRUCK,
  REMOVE_FAVORITE_FOODTRUCK,
} from "../../apiFolder/apiEndPoint";

const favoriteRequest = async ({ method, url, data }) => {
  const response = await apiClient({
    method,
    url,
    data,
    skipToken: false,
  });

  return response?.data;
};

// Async thunk to fetch favorite food trucks
export const fetchFavorites = createAsyncThunk(
  "favorites/fetchFavorites",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { defaultLocation } = state.locationReducer ?? {}; // Get defaultLocation from the Redux store
      let params = {};
      if (defaultLocation && defaultLocation.lat && defaultLocation.long) {
        params = {
          lat: defaultLocation.lat,
          long: defaultLocation.long,
        };
      }

      const queryParams = [];
      if (params.lat) queryParams.push(`lat=${params.lat}`);
      if (params.long) queryParams.push(`long=${params.long}`);

      const url =
        queryParams.length > 0
          ? `${GET_FAVORITE_FOODTRUCK}?${queryParams.join("&")}`
          : GET_FAVORITE_FOODTRUCK;

      const response = await favoriteRequest({
        method: "get",
        url,
      });
      console.log("Response => ", response);
      if (response?.success) {
        const favoriteList = response?.data?.favoriteList ?? [];
        const normalizedFavorites = favoriteList.map((fav) => ({
          _id: fav._id, // The favorite entry ID
          foodTruck: fav.foodTruck || fav, // Ensure foodTruck object is present
          reviews: fav.foodTruck?.totalReview || "0",
          distance: fav.distance || "0",
          // Add other necessary fields from the favorite object if they exist directly on `fav`
        }));
        return normalizedFavorites;
      } else {
        return rejectWithValue(
          response?.message || "Failed to fetch favorite trucks"
        );
      }
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch favorite trucks"
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState();
      return Boolean(
        state.authReducer?.isSignedIn && state.userReducer?.authToken
      );
    },
  }
);

// Async thunk to toggle favorite status
export const toggleFavorite = createAsyncThunk(
  "favorites/toggleFavorite",
  async (
    { foodTruckId, isCurrentlyLiked, foodTruckData = {} },
    { getState, rejectWithValue }
  ) => {
    try {
      if (isCurrentlyLiked) {
        // Remove from favorites
        const response = await favoriteRequest({
          method: "delete",
          url: `${REMOVE_FAVORITE_FOODTRUCK}/${foodTruckId}`,
        });
        if (response?.success) {
          return { foodTruckId, action: "removed" };
        } else {
          return rejectWithValue(
            response?.message || "Failed to remove from favorites"
          );
        }
      } else {
        // Add to favorites
        const response = await favoriteRequest({
          method: "post",
          url: `${ADD_FAVORITE_FOODTRUCK}/${foodTruckId}`,
          data: {},
        });
        console.log("added to fav foodtruck response => ", response);
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
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to toggle favorite"
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState();
      return Boolean(
        state.authReducer?.isSignedIn && state.userReducer?.authToken
      );
    },
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
        state.favorites = action.payload ?? [];
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
              (fav) => fav.foodTruck?._id === action.payload.foodTruck._id
            )
          ) {
            console.log(action.payload.action, action.payload.foodTruck);
            state.favorites.push({
              _id: action.payload.foodTruck._id, // Using foodTruck._id as a fallback for favorite entry ID
              foodTruck: action.payload.foodTruck,
              reviews: action.payload.foodTruck.totalReviews || "0",
              distance: action.payload.foodTruck.distanceInMeters || "0",
            });
          }
        } else if (action.payload.action === "removed") {
          state.favorites = state.favorites.filter(
            (fav) => fav.foodTruck?._id !== action.payload.foodTruckId
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
