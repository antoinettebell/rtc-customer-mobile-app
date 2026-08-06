import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isSignedIn: false,
  isGuest: false,
  authReturnRoute: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    onSignin: (state, { payload }) => {
      state.isSignedIn = payload;
    },
    onGuest: (state, { payload }) => {
      state.isGuest = payload;
      if (payload) {
        state.authReturnRoute = "signin";
      }
    },
    onSignOut: () => initialState,
  },
});

export const { onSignin, onGuest, onSignOut } = authSlice.actions;
export default authSlice.reducer;
