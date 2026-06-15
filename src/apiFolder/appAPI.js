import Config from "../config/env";
import {
  ADD_FAVORITE_FOODTRUCK,
  CUISINE,
  GET_FAVORITE_FOODTRUCK,
  GET_USER_DETAILS,
  MEDIA_UPLOAD,
  REMOVE_FAVORITE_FOODTRUCK,
  REVERSE_LOCATION,
  UPDATE_USER_DETAILS,
  GET_ADDRESS,
  ADD_ADDRESS,
  UPDATE_ADDRESS,
  DELETE_ADDRESS,
  PRIVACY_POLICY,
  GET_FOOD_TRUCK_DETAIL_BY_ID,
  GET_FOOD_TRUCK_MENU_BY_ID,
  GET_FOOD_TRUCK_MENU_BY_ID_FOR_PUBLIC,
  PLACE_FOOD_ORDER,
  GET_ALL_ORDERS,
  GET_ORDER_BY_ORDERID,
  GET_ALL_COUPON_CODES,
  VALIDATE_COUPON_CODE,
  CANCEL_FOOD_ORDER,
  SET_FCM_TOKEN,
  UPDATE_FCM_TOKEN,
  REMOVE_FCM_TOKEN,
  GET_NEAR_ME,
  GET_NEARBY_FOODTRUCK_NEW,
  ADD_REVIEW,
  UPDATE_REVIEW_BY_ID,
  GET_REVIEW_STATS_BY_FOODTRUCK_ID,
  GET_REVIEW_BY_FOODTRUCK_ID,
  GET_RECENT_FOODTRUCK,
  GET_ALL_BANNER,
  TRACK_BANNER_EVENT,
  CHECK_ITEMS,
  GET_TAX_OF_LOCATION,
  REMOVE_ACCOUNT,
  GLOBAL_SEARCH,
  GET_FREE_DESERT_DETAIL,
  UPDATE_PASSWORD,
  GET_DIET_LIST,
  GET_DIET_RESTRICT_LIST,
  UPDATE_DIET_RESTRICT_LIST,
  CHECK_FREE_DESERT_ELIGIBILITY,
  VALIDATE_ORDER,
  PAYMENT_CHECKOUT,
  MARKETPLACE_EVENTS,
  MARKETPLACE_MY_EVENTS,
  MARKETPLACE_EVENT_BY_ID,
  MARKETPLACE_EVENT_REOPEN,
  PUBLIC_MARKETPLACE_EVENT_BY_ID,
  PUBLIC_MARKETPLACE_EVENT_TICKET_CLICK,
  MARKETPLACE_EVENT_IMAGES,
  MARKETPLACE_EVENT_BIDS,
  MARKETPLACE_EVENT_QUESTIONS,
  MARKETPLACE_EVENT_QUESTION_ANSWER,
  MARKETPLACE_AWARD_BIDS,
  MARKETPLACE_PAYMENT_BY_ID,
  MARKETPLACE_PAYMENT_CHECKOUT,
  MARKETPLACE_PAYMENT_CALL,
} from "./apiEndPoint";
import apiClient from "./apiClient";
import { store } from "../redux/store";

// Reverse Location
export const getLocationName = async (payload) => {
  try {
    const { lat, long } = payload;
    const API_KEY = Config.GOOGLE_MAP_API_KEY;

    let URL = `${REVERSE_LOCATION}${lat},${long}&key=${API_KEY}`;

    const response = await fetch(URL);
    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error getting Location Name:", error);
    throw new Error(error || "Error getting location Name:");
  }
};

// Upload Images
export const uploadImage_API = async (payload) => {
  try {
    const URL = `${MEDIA_UPLOAD}`;
    const response = await apiClient.post(URL, payload, { formData: true });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Get Cuisine List API
export const cuisineList_API = async (payload) => {
  try {
    const URL = `${CUISINE}?page=${payload.page}&limit=50`;
    const response = await apiClient.get(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response;
  }
};

// Get User Detail by user_id
export const getUserDetail_API = async (user_id) => {
  try {
    const URL = `${GET_USER_DETAILS}/${user_id}`;
    const response = await apiClient.get(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Update User Details by user_id
export const updateUserDetail_API = async ({ payload, user_id }) => {
  try {
    const URL = `${UPDATE_USER_DETAILS}/${user_id}`;
    const response = await apiClient.put(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Update Password API
export const updatePassword_API = async (payload, user_id) => {
  try {
    const URL = UPDATE_PASSWORD(user_id);
    const response = await apiClient.put(URL, payload);
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Get Favorite FoodTruck
export const getFavoriteFoodTruck_API = async (params = {}) => {
  try {
    const { lat, long, page, limit, search } = params;
    let URL = `${GET_FAVORITE_FOODTRUCK}`;
    // Build query string with optional parameters
    const queryParams = [];
    if (lat) queryParams.push(`lat=${lat}`);
    if (long) queryParams.push(`long=${long}`);
    if (page) queryParams.push(`page=${page}`);
    if (limit) queryParams.push(`limit=${limit}`);
    if (search) queryParams.push(`search=${search}`);

    if (queryParams.length > 0) {
      URL += `?${queryParams.join("&")}`;
    }

    const response = await apiClient.get(URL, { skipToken: false });

    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Add Favorite FoodTruck
export const addFavoriteFoodTruck_API = async (foodTruckId) => {
  try {
    const URL = `${ADD_FAVORITE_FOODTRUCK}/${foodTruckId}`;
    const response = await apiClient.post(URL, {}, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Remove Favorite FoodTruck
export const removeFavoriteFoodTruck_API = async (foodTruckId) => {
  try {
    const URL = `${REMOVE_FAVORITE_FOODTRUCK}/${foodTruckId}`;
    const response = await apiClient.delete(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Get Address List
export const getAddress_API = async (params = {}) => {
  try {
    const { page, limit, search } = params;
    let URL = `${GET_ADDRESS}`;

    // Build query string with optional parameters
    const queryParams = [];
    if (page) queryParams.push(`page=${page}`);
    if (limit) queryParams.push(`limit=${limit}`);
    if (search) queryParams.push(`search=${search}`);

    if (queryParams.length > 0) {
      URL += `?${queryParams.join("&")}`;
    }

    const response = await apiClient.get(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Add Address
export const addAddress_API = async (payload) => {
  try {
    const URL = `${ADD_ADDRESS}`;
    const response = await apiClient.post(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Update Address
export const updateAddress_API = async ({ addressId, payload }) => {
  try {
    const URL = `${UPDATE_ADDRESS}/${addressId}`;
    const response = await apiClient.put(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Delete Address
export const deleteAddress_API = async (addressId) => {
  try {
    const URL = `${DELETE_ADDRESS}/${addressId}`;
    const response = await apiClient.delete(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Get Food Trucks
export const getRecentFoodTrucks_API = async (params = {}) => {
  try {
    const { authToken } = store.getState().userReducer;
    const { page = 1, limit = 10, search } = params;
    let URL = `${GET_RECENT_FOODTRUCK}`;

    // Build query string with required and optional parameters
    const queryParams = [`page=${page}`, `limit=${limit}`];

    if (search) {
      queryParams.push(`search=${search}`);
    }

    URL += `?${queryParams.join("&")}`;

    const response = await apiClient.get(URL, {
      skipToken: authToken ? false : true,
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Get Nearby/Popular/Featured Food Trucks
export const getNearbyFoodTrucks_API = async (params = {}) => {
  try {
    const { authToken } = store.getState().userReducer;
    const {
      search = "",
      page = 1,
      limit = 10,
      distanceInMeters,
      userLat,
      userLong,
      featured = false,
    } = params;
    let URL = `${GET_NEARBY_FOODTRUCK_NEW}`;

    // Build query string with required and optional parameters
    const queryParams = [
      `userLat=${userLat}`,
      `userLong=${userLong}`,
      `page=${page}`,
      `limit=${limit}`,
    ];

    // Add optional parameters if they exist
    if (search?.trim()?.length > 0) {
      queryParams.push(`search=${search}`);
    }
    if (distanceInMeters) {
      queryParams.push(`distanceInMeters=${distanceInMeters}`);
    }
    if (featured) {
      queryParams.push(`featured=${featured}`);
    }

    URL += `?${queryParams.join("&")}`;

    const response = await apiClient.get(URL, {
      skipToken: authToken ? false : true,
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Get combined Near Me food and event results
export const getNearMeResults_API = async (params = {}) => {
  try {
    const { authToken } = store.getState().userReducer;
    const {
      search = "",
      page = 1,
      limit = 50,
      distanceInMeters,
      userLat,
      userLong,
      type,
      cuisineIds = [],
      cuisines = [],
      eventTypes = [],
      eventVisibility,
    } = params;
    let URL = `${GET_NEAR_ME}`;
    const queryParams = [
      `userLat=${encodeURIComponent(userLat)}`,
      `userLong=${encodeURIComponent(userLong)}`,
      `page=${page}`,
      `limit=${limit}`,
    ];

    if (search?.trim()?.length > 0) {
      queryParams.push(`search=${encodeURIComponent(search.trim())}`);
    }
    if (distanceInMeters) {
      queryParams.push(`distanceInMeters=${distanceInMeters}`);
    }
    if (type) {
      queryParams.push(`type=${encodeURIComponent(type)}`);
    }
    if (cuisineIds.length > 0) {
      queryParams.push(
        `cuisineIds=${encodeURIComponent(cuisineIds.join(","))}`
      );
    }
    if (cuisines.length > 0) {
      queryParams.push(`cuisines=${encodeURIComponent(cuisines.join(","))}`);
    }
    if (eventTypes.length > 0) {
      queryParams.push(
        `eventTypes=${encodeURIComponent(eventTypes.join(","))}`
      );
    }
    if (eventVisibility) {
      queryParams.push(
        `eventVisibility=${encodeURIComponent(eventVisibility)}`
      );
    }

    URL += `?${queryParams.join("&")}`;

    const response = await apiClient.get(URL, {
      skipToken: authToken ? false : true,
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Get FoodTruckDetails By Id
export const getFoodTruckDetailById_API = async (foodTruck_id) => {
  try {
    const { authToken } = store.getState().userReducer;

    const URL = `${GET_FOOD_TRUCK_DETAIL_BY_ID}/${foodTruck_id}`;
    const response = await apiClient.get(URL, {
      skipToken: authToken ? false : true,
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Get FoodTruckMenu Details By Id
export const getFoodTruckMenuDetailById_API = async (foodTruck_id) => {
  try {
    const { authToken } = store.getState().userReducer;

    const URL = GET_FOOD_TRUCK_MENU_BY_ID_FOR_PUBLIC(foodTruck_id);
    const response = await apiClient.get(URL, {
      skipToken: authToken ? false : true,
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Place Food Order
export const placeFoodOrder_API = async (payload) => {
  try {
    const URL = `${PLACE_FOOD_ORDER}`;
    const response = await apiClient.post(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Payment Checkout before Order Place
export const paymentCheckout_API = async (payload) => {
  try {
    const URL = PAYMENT_CHECKOUT;
    const response = await apiClient.post(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Get All Food Order
export const getAllOrders_API = async (params = {}) => {
  try {
    const { page = 1, limit = 10, orderStatus = null } = params;
    let URL = `${GET_ALL_ORDERS}`;

    // Build query string with required and optional parameters
    const queryParams = [`page=${page}`, `limit=${limit}`];

    // Add optional parameters if they exist
    if (orderStatus) {
      queryParams.push(`orderStatus=${orderStatus}`);
    }

    URL += `?${queryParams.join("&")}`;

    const response = await apiClient.get(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Get Food Order By OrderId
export const getOrderByOrderId_API = async (orderId) => {
  try {
    const URL = `${GET_ORDER_BY_ORDERID}/${orderId}`;
    const response = await apiClient.get(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Cancel Food Order
export const cancelFoodOrder_API = async (orderId, payload) => {
  try {
    const URL = `${CANCEL_FOOD_ORDER}/${orderId}`;
    const response = await apiClient.put(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Check Free Loyalty Bucks Eligibility
export const checkFreeDessertEligibility_API = async () => {
  try {
    const URL = CHECK_FREE_DESERT_ELIGIBILITY;
    const response = await apiClient.get(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Get All Coupon Codes
export const getAllCoupons_API = async () => {
  try {
    const URL = `${GET_ALL_COUPON_CODES}?limit=1000`;
    const response = await apiClient.get(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Validate Coupon Code
export const validateCoupon_API = async (couponCode) => {
  try {
    const URL = `${VALIDATE_COUPON_CODE}?code=${couponCode}`;
    const response = await apiClient.get(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Validate order
export const validateOrder_API = async (payload) => {
  try {
    const URL = VALIDATE_ORDER;
    const response = await apiClient.post(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Set FCM Token
export const setFcmToken_API = async (payload) => {
  try {
    const URL = `${SET_FCM_TOKEN}`;
    const response = await apiClient.post(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Update FCM Token
export const updateFcmToken_API = async ({ deviceId, payload }) => {
  try {
    const URL = UPDATE_FCM_TOKEN(deviceId);
    const response = await apiClient.put(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Remove FCM Token
export const removeFcmToken_API = async (device_id) => {
  try {
    const URL = REMOVE_FCM_TOKEN(device_id);
    const response = await apiClient.delete(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Add review & reating
export const addReviewRating_API = async (payload) => {
  try {
    const URL = `${ADD_REVIEW}`;
    const response = await apiClient.post(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Update review & reating
export const updateReviewRating_API = async ({ review_id, payload }) => {
  try {
    const URL = UPDATE_REVIEW_BY_ID(review_id);
    const response = await apiClient.put(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// get review & reating stats of food-truck
export const getReviewRatingStats_API = async (foodTruck_id) => {
  try {
    const URL = GET_REVIEW_STATS_BY_FOODTRUCK_ID(foodTruck_id);
    const response = await apiClient.get(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// get review & reating of food-truck
export const getReviewRating_API = async (params = {}) => {
  try {
    const { foodTruck_id, page = 1, limit = 10 } = params;
    let URL = `${GET_REVIEW_BY_FOODTRUCK_ID}`;

    // Build query string with required and optional parameters
    const queryParams = [
      `foodTruckId=${foodTruck_id}`,
      `page=${page}`,
      `limit=${limit}`,
    ];

    URL += `?${queryParams.join("&")}`;

    const response = await apiClient.get(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// get all banner
export const getAllBanner_API = async () => {
  try {
    const URL = `${GET_ALL_BANNER}?page=1&limit=10`;
    const response = await apiClient.get(URL, { skipToken: true });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const trackBannerEvent_API = async ({ banner_id, event_type }) => {
  try {
    const URL = TRACK_BANNER_EVENT(banner_id, event_type);
    const response = await apiClient.post(URL, {}, { skipToken: true });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Check menu items
export const checkItems_API = async (payload) => {
  try {
    const URL = `${CHECK_ITEMS}`;
    const response = await apiClient.post(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Check location tax
export const checkTax_API = async (params = {}) => {
  try {
    const query = {
      foodTruckId: params?.foodTruck_id,
      locationId: params?.location_id,
      amount: params?.amount,
    };

    if (params?.deliveryFee != null) query.deliveryFee = params.deliveryFee;
    if (params?.serviceFee != null) query.serviceFee = params.serviceFee;
    if (params?.fulfillmentType) query.fulfillmentType = params.fulfillmentType;
    if (params?.deliveryAddress) query.deliveryAddress = params.deliveryAddress;
    if (params?.deliveryLat != null) query.deliveryLat = params.deliveryLat;
    if (params?.deliveryLong != null) query.deliveryLong = params.deliveryLong;

    const URL = GET_TAX_OF_LOCATION(query);
    const response = await apiClient.get(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// delete account
export const deleteAccount_API = async () => {
  try {
    const URL = `${REMOVE_ACCOUNT}`;
    const response = await apiClient.delete(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// global search
export const getGlobalSearchResult_API = async (params = {}) => {
  try {
    const { authToken } = store.getState().userReducer;
    const { search = "", userLat, userLong } = params;
    let URL = `${GLOBAL_SEARCH}`;

    // Build query string with required and optional parameters
    const queryParams = [`userLat=${userLat}`, `userLong=${userLong}`];

    // Add optional parameters if they exist
    if (search?.trim()?.length > 0) {
      queryParams.push(`search=${search}`);
    }

    URL += `?${queryParams.join("&")}`;

    const response = await apiClient.get(URL, {
      skipToken: authToken ? false : true,
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Fetch Free Loyalty Bucks Detail
export const getFreeDessertDetail_API = async () => {
  try {
    const URL = `${GET_FREE_DESERT_DETAIL}`;
    const response = await apiClient.get(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Diet List
export const getDietList_API = async () => {
  try {
    const URL = `${GET_DIET_LIST}?limit=1000`;
    const response = await apiClient.get(URL, { skipToken: true });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Diet Restrict List
export const getDietRestrictList_API = async () => {
  try {
    const URL = `${GET_DIET_RESTRICT_LIST}`;
    const response = await apiClient.get(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Diet Restrict List Update
export const updateDietRestrictList_API = async (payload) => {
  try {
    console.log("Payload => ", payload);
    const URL = `${UPDATE_DIET_RESTRICT_LIST}`;
    const response = await apiClient.post(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

// Marketplace - Customer/Event Coordinator
const MARKETPLACE_EVENT_PAYLOAD_FIELDS = [
  "event_name",
  "event_description",
  "ticket_sales_enabled",
  "ticket_url",
  "event_type",
  "event_type_other",
  "event_visibility",
  "event_style",
  "service_type",
  "service_types",
  "service_styles",
  "primary_service_style",
  "plated_number_of_courses",
  "plated_options",
  "plated_entree_selection",
  "plated_included_items",
  "plated_single_entree",
  "plated_choice_entrees",
  "plated_tableside_choice",
  "plated_bread_salad_dessert",
  "buffet_options",
  "buffet_setup",
  "buffet_included_items",
  "food_truck_options",
  "station_setup_type",
  "station_included_items",
  "service_notes",
  "event_date",
  "event_time",
  "event_duration_hours",
  "event_duration_minutes",
  "event_address",
  "event_city",
  "event_state",
  "event_zip",
  "latitude",
  "longitude",
  "formatted_address",
  "geocoded_address",
  "place_id",
  "geocoding_provider",
  "geocoded_at",
  "number_of_guests",
  "number_of_vendors_needed",
  "power_required",
  "permits_required",
  "insurance_required",
  "alcohol_required",
  "cuisine_preferences",
  "dietary_restrictions",
  "equipment_needed",
  "vendor_fee",
  "budgeted_amount",
  "payment_responsibility",
  "event_close_date",
  "event_close_time",
  "status",
];

const normalizeMarketplaceEventPayload = (payload = {}) => {
  const nextPayload = { ...payload };
  const totalDurationMinutes = Number(
    nextPayload.event_duration_total_minutes ??
      (Number(nextPayload.event_duration_minutes) > 59
        ? nextPayload.event_duration_minutes
        : NaN)
  );

  delete nextPayload.event_duration_total_minutes;

  if (Number.isFinite(totalDurationMinutes)) {
    nextPayload.event_duration_hours = Math.floor(
      Math.max(0, totalDurationMinutes) / 60
    );
    nextPayload.event_duration_minutes = Math.max(0, totalDurationMinutes) % 60;
  }

  if (__DEV__) {
    console.log("Marketplace event duration payload", {
      event_duration_hours: nextPayload.event_duration_hours,
      event_duration_minutes: nextPayload.event_duration_minutes,
    });
  }

  return MARKETPLACE_EVENT_PAYLOAD_FIELDS.reduce((eventPayload, field) => {
    if (nextPayload[field] !== undefined) {
      eventPayload[field] = nextPayload[field];
    }
    return eventPayload;
  }, {});
};

export const createMarketplaceEvent_API = async (payload) => {
  try {
    const response = await apiClient.post(
      MARKETPLACE_EVENTS,
      normalizeMarketplaceEventPayload(payload),
      {
        skipToken: false,
      }
    );
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const updateMarketplaceEvent_API = async ({ eventId, payload }) => {
  try {
    const response = await apiClient.put(
      MARKETPLACE_EVENT_BY_ID(eventId),
      normalizeMarketplaceEventPayload(payload),
      {
        skipToken: false,
      }
    );
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const deleteMarketplaceEvent_API = async (eventId) => {
  try {
    const response = await apiClient.delete(MARKETPLACE_EVENT_BY_ID(eventId), {
      skipToken: false,
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const reopenMarketplaceEvent_API = async ({ eventId, payload }) => {
  try {
    const response = await apiClient.post(MARKETPLACE_EVENT_REOPEN(eventId), payload, {
      skipToken: false,
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const getMarketplaceMyEvents_API = async () => {
  try {
    const response = await apiClient.get(MARKETPLACE_MY_EVENTS, {
      skipToken: false,
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const getMarketplaceEventById_API = async (eventId) => {
  try {
    const response = await apiClient.get(MARKETPLACE_EVENT_BY_ID(eventId), {
      skipToken: false,
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const getPublicMarketplaceEventById_API = async (eventId) => {
  try {
    const { authToken } = store.getState().userReducer;
    const response = await apiClient.get(PUBLIC_MARKETPLACE_EVENT_BY_ID(eventId), {
      skipToken: authToken ? false : true,
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const trackPublicMarketplaceTicketClick_API = async (eventId) => {
  try {
    const { authToken } = store.getState().userReducer;
    const response = await apiClient.post(
      PUBLIC_MARKETPLACE_EVENT_TICKET_CLICK(eventId),
      {},
      { skipToken: authToken ? false : true }
    );
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const getMarketplaceEventBids_API = async (eventId) => {
  try {
    const response = await apiClient.get(MARKETPLACE_EVENT_BIDS(eventId), {
      skipToken: false,
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const getMarketplaceEventQuestions_API = async (eventId) => {
  try {
    const response = await apiClient.get(MARKETPLACE_EVENT_QUESTIONS(eventId), {
      skipToken: false,
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const answerMarketplaceEventQuestion_API = async ({
  eventId,
  questionId,
  answerText,
}) => {
  try {
    const response = await apiClient.post(
      MARKETPLACE_EVENT_QUESTION_ANSWER(eventId, questionId),
      { answer_text: answerText },
      { skipToken: false }
    );
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const uploadMarketplaceEventImage_API = async ({ eventId, payload }) => {
  try {
    const response = await apiClient.post(
      MARKETPLACE_EVENT_IMAGES(eventId),
      payload,
      { formData: true, skipToken: false }
    );
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const awardMarketplaceBids_API = async ({ eventId, bidIds }) => {
  try {
    const response = await apiClient.post(
      MARKETPLACE_AWARD_BIDS(eventId),
      { bid_ids: bidIds },
      { skipToken: false }
    );
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const getMarketplacePaymentById_API = async (paymentId) => {
  try {
    const response = await apiClient.get(MARKETPLACE_PAYMENT_BY_ID(paymentId), {
      skipToken: false,
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const checkoutMarketplacePayment_API = async ({ paymentId, payload }) => {
  try {
    const response = await apiClient.post(
      MARKETPLACE_PAYMENT_CHECKOUT(paymentId),
      payload,
      { skipToken: false }
    );
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};

export const callMarketplacePayment_API = async (paymentId) => {
  try {
    const response = await apiClient.post(
      MARKETPLACE_PAYMENT_CALL(paymentId),
      {},
      { skipToken: false }
    );
    return response?.data;
  } catch (error) {
    throw error?.response?.data || error;
  }
};
