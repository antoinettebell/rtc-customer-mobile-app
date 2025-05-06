import apiClient from "./apiClient";
import {
  CHANGE_PASSWORD,
  FORGOT_PASSWORD,
  LOGIN,
  REGISTER_USER,
  RESEND_OTP,
  VERIFY_OTP,
} from "./apiEndPoint";

// Login API
export const login_API = async (payload) => {
  try {
    const URL = `${LOGIN}`;
    const response = await apiClient.post(URL, payload, { skipToken: true });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Verify OTP API
export const verifyOTP_API = async (payload) => {
  try {
    const URL = `${VERIFY_OTP}`;
    const response = await apiClient.post(URL, payload, { skipToken: true });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Resend OTP API
export const resendOTP_API = async (payload) => {
  try {
    const URL = `${RESEND_OTP}`;
    const response = await apiClient.post(URL, payload, { skipToken: true });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Forgot Password API
export const forgotPassword_API = async (payload) => {
  try {
    const URL = `${FORGOT_PASSWORD}`;
    const response = await apiClient.post(URL, payload, { skipToken: true });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Change Password API
export const changePassword_API = async (payload) => {
  try {
    const URL = `${CHANGE_PASSWORD}`;
    const response = await apiClient.post(URL, payload, { skipToken: true });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Register API
export const register_API = async (payload) => {
  try {
    const URL = `${REGISTER_USER}`;
    const response = await apiClient.post(URL, payload, { skipToken: true });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};
