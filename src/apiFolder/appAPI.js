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
} from "./apiEndPoint";
import apiClient from "./apiClient";

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

// Cuisine List API
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

// Favorite FoodTruck
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
    console.log("URl---->>>>", URL);

    const response = await apiClient.get(URL, { skipToken: false });
    console.log("responseresponse---->>>>", response);

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
