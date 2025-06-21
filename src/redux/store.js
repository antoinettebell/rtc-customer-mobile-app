import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import foodTruckProfileReducer from "./slices/foodTruckProfileSlice";
import orderReducer from "./slices/orderSlice";
import favoritesReducer from "./slices/favoritesSlice";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: [
    "authReducer",
    "userReducer",
    "foodTruckProfileReducer",
    "orderReducer",
    "favoritesReducer",
  ],
};

const rootReducer = combineReducers({
  authReducer,
  userReducer,
  foodTruckProfileReducer,
  orderReducer,
  favoritesReducer,
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
