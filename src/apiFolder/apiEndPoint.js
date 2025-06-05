export const LOGIN = "/auth";
export const VERIFY_OTP = "/auth/verify-otp";
export const FORGOT_PASSWORD = "/auth/forgot-password";
export const CHANGE_PASSWORD = "/auth/change-password";
export const REGISTER_USER = "/auth/register";
export const RESEND_OTP = "/auth/resend-otp";
export const CUISINE = "/cuisine";
export const MEDIA_UPLOAD = "/file";

// Get Location Name from Lat Long
export const REVERSE_LOCATION =
  "https://maps.googleapis.com/maps/api/geocode/json?latlng=";

// Get User Details
export const GET_USER_DETAILS = "/user";
export const UPDATE_USER_DETAILS = "/user";

// Favorite FoodTruck
export const GET_FAVORITE_FOODTRUCK = "/user/favorite/food-truck";
export const ADD_FAVORITE_FOODTRUCK = "/user/favorite/food-truck";
export const REMOVE_FAVORITE_FOODTRUCK = "/user/favorite/food-truck";

// HomeScreen
export const GET_NEARBY_FOODTRUCK = "/public/food-truck-filter";

// Address
export const GET_ADDRESS = "/user/address";
export const ADD_ADDRESS = "/user/address";
export const UPDATE_ADDRESS = "/user/address";
export const DELETE_ADDRESS = "/user/address";
