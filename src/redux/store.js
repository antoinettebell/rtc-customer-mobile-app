import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import userInfoReducer from "./slices/userInfoSlice";
import foodTruckProfileReducer from "./slices/foodTruckProfileSlice";
import orderReducer from "./slices/orderSlice";
import favoritesReducer from "./slices/favoritesSlice";
import locationReducer from "./slices/locationSlice";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: [
    "authReducer",
    "userReducer",
    "userInfoReducer",
    "foodTruckProfileReducer",
    "orderReducer",
    "favoritesReducer",
    "locationReducer",
  ],
};

const rootReducer = combineReducers({
  authReducer,
  userReducer,
  userInfoReducer,
  foodTruckProfileReducer,
  orderReducer,
  favoritesReducer,
  locationReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/PAUSE",
          "persist/PURGE",
          "persist/REGISTER",
          "persist/FLUSH",
        ],
      },
    }),
});

export const persistor = persistStore(store);
