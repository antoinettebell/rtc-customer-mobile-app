import Config from "react-native-config";
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
  GET_NEARBY_FOODTRUCK_NEW,
  ADD_REVIEW,
  UPDATE_REVIEW_BY_ID,
  GET_REVIEW_STATS_BY_FOODTRUCK_ID,
  GET_REVIEW_BY_FOODTRUCK_ID,
  GET_RECENT_FOODTRUCK,
  GET_ALL_BANNER,
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
    throw error?.response?.data;
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
    throw error?.response?.data;
  }
};

// Update User Details by user_id
export const updateUserDetail_API = async ({ payload, user_id }) => {
  try {
    const URL = `${UPDATE_USER_DETAILS}/${user_id}`;
    const response = await apiClient.put(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
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
    throw error?.response?.data;
  }
};

// Add Favorite FoodTruck
export const addFavoriteFoodTruck_API = async (foodTruckId) => {
  try {
    const URL = `${ADD_FAVORITE_FOODTRUCK}/${foodTruckId}`;
    const response = await apiClient.post(URL, {}, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Remove Favorite FoodTruck
export const removeFavoriteFoodTruck_API = async (foodTruckId) => {
  try {
    const URL = `${REMOVE_FAVORITE_FOODTRUCK}/${foodTruckId}`;
    const response = await apiClient.delete(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
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
    throw error?.response?.data;
  }
};

// Add Address
export const addAddress_API = async (payload) => {
  try {
    const URL = `${ADD_ADDRESS}`;
    const response = await apiClient.post(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Update Address
export const updateAddress_API = async ({ addressId, payload }) => {
  try {
    const URL = `${UPDATE_ADDRESS}/${addressId}`;
    const response = await apiClient.put(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Delete Address
export const deleteAddress_API = async (addressId) => {
  try {
    const URL = `${DELETE_ADDRESS}/${addressId}`;
    const response = await apiClient.delete(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
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
    throw error?.response?.data;
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
    throw error?.response?.data;
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
    throw error?.response?.data;
  }
};

// Get FoodTruckMenu Details By Id
export const getFoodTruckMenuDetailById_API = async (foodTruck_id) => {
  try {
    const { authToken } = store.getState().userReducer;

    const URL = authToken
      ? GET_FOOD_TRUCK_MENU_BY_ID(foodTruck_id)
      : GET_FOOD_TRUCK_MENU_BY_ID_FOR_PUBLIC(foodTruck_id);
    const response = await apiClient.get(URL, {
      skipToken: authToken ? false : true,
    });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Place Food Order
export const placeFoodOrder_API = async (payload) => {
  try {
    const URL = `${PLACE_FOOD_ORDER}`;
    const response = await apiClient.post(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
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
    throw error?.response?.data;
  }
};

// Get Food Order By OrderId
export const getOrderByOrderId_API = async (orderId) => {
  try {
    const URL = `${GET_ORDER_BY_ORDERID}/${orderId}`;
    const response = await apiClient.get(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Cancel Food Order
export const cancelFoodOrder_API = async (orderId, payload) => {
  try {
    const URL = `${CANCEL_FOOD_ORDER}/${orderId}`;
    const response = await apiClient.put(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Get All Coupon Codes
export const getAllCoupons_API = async () => {
  try {
    const URL = `${GET_ALL_COUPON_CODES}`;
    const response = await apiClient.get(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Validate Coupon Code
export const validateCoupon_API = async (couponCode) => {
  try {
    const URL = `${VALIDATE_COUPON_CODE}?code=${couponCode}`;
    const response = await apiClient.get(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Set FCM Token
export const setFcmToken_API = async (payload) => {
  try {
    const URL = `${SET_FCM_TOKEN}`;
    const response = await apiClient.post(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Update FCM Token
export const updateFcmToken_API = async ({ deviceId, payload }) => {
  try {
    const URL = UPDATE_FCM_TOKEN(deviceId);
    const response = await apiClient.put(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Remove FCM Token
export const removeFcmToken_API = async (device_id) => {
  try {
    const URL = REMOVE_FCM_TOKEN(device_id);
    const response = await apiClient.delete(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Add review & reating
export const addReviewRating_API = async (payload) => {
  try {
    const URL = `${ADD_REVIEW}`;
    const response = await apiClient.post(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Update review & reating
export const updateReviewRating_API = async ({ review_id, payload }) => {
  try {
    const URL = UPDATE_REVIEW_BY_ID(review_id);
    const response = await apiClient.put(URL, payload, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// get review & reating stats of food-truck
export const getReviewRatingStats_API = async (foodTruck_id) => {
  try {
    const URL = GET_REVIEW_STATS_BY_FOODTRUCK_ID(foodTruck_id);
    const response = await apiClient.get(URL, { skipToken: false });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
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
    throw error?.response?.data;
  }
};

// get all banner
export const getAllBanner_API = async () => {
  try {
    const URL = `${GET_ALL_BANNER}?page=1&limit=10`;
    const response = await apiClient.get(URL, { skipToken: true });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};
