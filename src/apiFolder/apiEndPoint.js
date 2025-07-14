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
export const GET_NEARBY_FOODTRUCK_NEW = "/public/food-truck-filter-new";
export const GET_RECENT_FOODTRUCK = "/public/food-truck";

// FoodTruck Detail Screen
export const GET_FOOD_TRUCK_DETAIL_BY_ID = "/public/food-truck";
export const GET_FOOD_TRUCK_MENU_BY_ID = (foodTruck_id) =>
  `/food-truck/${foodTruck_id}/menu`;
export const GET_FOOD_TRUCK_MENU_BY_ID_FOR_PUBLIC = (foodTruck_id) =>
  `/public/food-truck/${foodTruck_id}/menu`;

// Food Order
export const PLACE_FOOD_ORDER = "/order";
export const GET_ALL_ORDERS = "/order";
export const GET_ORDER_BY_ORDERID = "/order";
export const CANCEL_FOOD_ORDER = "/order";

// Address
export const GET_ADDRESS = "/user/address";
export const ADD_ADDRESS = "/user/address";
export const UPDATE_ADDRESS = "/user/address";
export const DELETE_ADDRESS = "/user/address";

// TnC & Privacy-Policy & agreement
export const TNC = "/public/terms-conditions";
export const PRIVACY_POLICY = "/public/privacy-policy";
export const AGREEMENT = "/public/agreement";

// Coupon
export const GET_ALL_COUPON_CODES = "/coupon";
export const VALIDATE_COUPON_CODE = "/coupon/validate";

// Notification
export const SET_FCM_TOKEN = "/user/set-fcm-token";
export const UPDATE_FCM_TOKEN = (device_id) =>
  `/user/update-fcm-token/${device_id}`;
export const REMOVE_FCM_TOKEN = (device_id) =>
  `/user/remove-fcm-token/${device_id}`;

// Ratings and Review
export const ADD_REVIEW = "/review";
export const UPDATE_REVIEW_BY_ID = (review_id) => `/review/${review_id}`;
export const GET_REVIEW_BY_FOODTRUCK_ID = "/review";
export const GET_REVIEW_STATS_BY_FOODTRUCK_ID = (foodTruck_id) =>
  `/review/stats?foodTruckId=${foodTruck_id}`;
export const GET_A_REVIEW_BY_ID = (review_id) => `/review/${review_id}`;
export const REMOVE_A_REVIEW_BY_ID = (review_id) => `/review/${review_id}`;

// Banner (advertisement)
export const GET_ALL_BANNER = "/public/banner";
