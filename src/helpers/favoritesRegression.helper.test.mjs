import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const favoritesSource = await readFile(
  new URL("../redux/slices/favoritesSlice.js", import.meta.url),
  "utf8",
);
const storeSource = await readFile(
  new URL("../redux/store.js", import.meta.url),
  "utf8",
);

assert.doesNotMatch(
  favoritesSource,
  /apiFolder\/apiClient/,
  "favoritesSlice must not import apiClient because apiClient imports the Redux store",
);
assert.match(
  favoritesSource,
  /state\.authReducer\?\.isSignedIn && state\.userReducer\?\.authToken/,
  "favorite requests must be skipped until authenticated state is complete",
);
assert.match(
  storeSource,
  /favoritesReducer/,
  "the favorites reducer must remain registered in the Redux store",
);

console.log("favorites regression helper tests passed");
