export const LOGIN = "/auth";
export const VERIFY_OTP = "/auth/verify-otp";
export const FORGOT_PASSWORD = "/auth/forgot-password";
export const CHANGE_PASSWORD = "/auth/change-password";
export const REGISTER_USER = "/auth/register";
export const RESEND_OTP = "/auth/resend-otp";
export const CUISINE = "/cuisine";
export const MEDIA_UPLOAD = "/file";
export const REMOVE_ACCOUNT = "/user";

// Get Location Name from Lat Long
export const REVERSE_LOCATION =
  "https://maps.googleapis.com/maps/api/geocode/json?latlng=";

// User Details
export const GET_USER_DETAILS = "/user";
export const UPDATE_USER_DETAILS = "/user";
export const UPDATE_PASSWORD = (user_id) => `/user/${user_id}/change-password`;

// Free Desert
export const GET_FREE_DESERT_DETAIL = "/user/free-dessert/progress";

// Favorite FoodTruck
export const GET_FAVORITE_FOODTRUCK = "/user/favorite/food-truck";
export const ADD_FAVORITE_FOODTRUCK = "/user/favorite/food-truck";
export const REMOVE_FAVORITE_FOODTRUCK = "/user/favorite/food-truck";

// HomeScreen
export const GET_NEARBY_FOODTRUCK = "/public/food-truck-filter";
export const GET_NEARBY_FOODTRUCK_NEW = "/public/food-truck-filter-new";
export const GET_NEAR_ME = "/public/near-me";
export const GET_RECENT_FOODTRUCK = "/public/food-truck";
export const GLOBAL_SEARCH = "/public/global-search";

// Diet
export const GET_DIET_LIST = "/public/diet";
export const GET_DIET_RESTRICT_LIST = "/diet/user-restrict-diet-list";
export const UPDATE_DIET_RESTRICT_LIST = "/diet/user-restrict-diet";

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
export const CHECK_FREE_DESERT_ELIGIBILITY = "/order/free-dessert/eligibility";
export const VALIDATE_ORDER = "/order/validate-order";
export const PAYMENT_CHECKOUT = "/order/payment-checkout";

// Menu
export const CHECK_ITEMS = "public/menu-check-items";

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
export const GET_ALL_COUPON_CODES = "/public/coupon";
export const VALIDATE_COUPON_CODE = "/public/coupon-validate";

// Tax
export const GET_TAX_OF_LOCATION = (params = {}) => {
  const query = Object.entries(params)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");

  return `/public/avalaratax-rates-check?${query}`;
};

// Notification
export const SET_FCM_TOKEN = "/user/set-fcm-token";
export const UPDATE_FCM_TOKEN = (device_id) =>
  `/user/update-fcm-token/${device_id}`;
export const REMOVE_FCM_TOKEN = (device_id) =>
  `/user/remove-fcm-token/${device_id}`;

// Ratings and Review
export const ADD_REVIEW = "/review";
export const UPDATE_REVIEW_BY_ID = (review_id) => `/review/${review_id}`;
export const GET_A_REVIEW_BY_ID = (review_id) => `/review/${review_id}`;
export const REMOVE_A_REVIEW_BY_ID = (review_id) => `/review/${review_id}`;
// below can be access by public route
export const GET_REVIEW_BY_FOODTRUCK_ID = "/public/review";
export const GET_REVIEW_STATS_BY_FOODTRUCK_ID = (foodTruck_id) =>
  `/public/review/stats?foodTruckId=${foodTruck_id}`;
export const PUBLIC_REVIEW_TOKEN = (token) => `/public/review-token/${token}`;

// Banner (advertisement)
export const GET_ALL_BANNER = "/public/banner";
export const TRACK_BANNER_EVENT = (banner_id, event_type) =>
  `/public/banner/${banner_id}/${event_type}`;

// Marketplace
export const MARKETPLACE_EVENTS = "/marketplace/events";
export const MARKETPLACE_MY_EVENTS = "/marketplace/events/my";
export const MARKETPLACE_EVENT_BY_ID = (event_id) =>
  `/marketplace/events/${event_id}`;
export const MARKETPLACE_EVENT_REOPEN = (event_id) =>
  `/marketplace/events/${event_id}/reopen`;
export const MARKETPLACE_EVENT_CLOSE = (event_id) =>
  `/marketplace/events/${event_id}/close`;
export const PUBLIC_MARKETPLACE_EVENT_BY_ID = (event_id) =>
  `/public/marketplace/events/${event_id}`;
export const PUBLIC_MARKETPLACE_EVENT_TICKET_CLICK = (event_id) =>
  `/public/marketplace/events/${event_id}/ticket-click`;
export const MARKETPLACE_EVENT_IMAGES = (event_id) =>
  `/marketplace/events/${event_id}/images`;
export const MARKETPLACE_EVENT_BIDS = (event_id) =>
  `/marketplace/events/${event_id}/bids`;
export const MARKETPLACE_EVENT_QUESTIONS = (event_id) =>
  `/marketplace/events/${event_id}/questions`;
export const MARKETPLACE_EVENT_QUESTION_ANSWER = (event_id, question_id) =>
  `/marketplace/events/${event_id}/questions/${question_id}/answer`;
export const MARKETPLACE_AWARD_BIDS = (event_id) =>
  `/marketplace/events/${event_id}/award`;
export const MARKETPLACE_EVENT_FINAL_PAYMENT = (event_id) =>
  `/marketplace/events/${event_id}/final-payment`;
export const MARKETPLACE_PAYMENT_BY_ID = (payment_id) =>
  `/marketplace/payments/${payment_id}`;
export const MARKETPLACE_PAYMENT_CHECKOUT = (payment_id) =>
  `/marketplace/payments/${payment_id}/checkout`;
export const MARKETPLACE_PAYMENT_CALL = (payment_id) =>
  `/marketplace/payments/${payment_id}/call`;
