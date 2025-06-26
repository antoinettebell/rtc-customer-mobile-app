import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  allLocations: [],
  defaultLocation: null,
};

const locationSlice = createSlice({
  name: "location",
  initialState: initialState,
  reducers: {
    setAllLocations: (state, { payload }) => {
      state.allLocations = payload;
      const defaultLocationFromPayload = state.defaultLocation?._id
        ? payload.find((loc) => loc._id === state.defaultLocation._id)
        : undefined;

      state.defaultLocation =
        defaultLocationFromPayload || payload?.[0] || null;
    },
    setDefaultLocation: (state, { payload }) => {
      state.defaultLocation = payload;
    },
    clearLocationSlice: () => initialState,
  },
});

export const { setDefaultLocation, setAllLocations, clearLocationSlice } =
  locationSlice.actions;
export default locationSlice.reducer;
