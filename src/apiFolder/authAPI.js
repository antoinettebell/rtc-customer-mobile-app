import apiClient from "./apiClient";
import {
  AGREEMENT,
  CHANGE_PASSWORD,
  FORGOT_PASSWORD,
  LOGIN,
  PRIVACY_POLICY,
  REGISTER_USER,
  RESEND_OTP,
  TNC,
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

// TnC API
export const tnc_API = async () => {
  try {
    const URL = `${TNC}`;
    const response = await apiClient.get(URL, { skipToken: true });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// privacy pollicy API
export const privacyPolicy_API = async () => {
  try {
    const URL = `${PRIVACY_POLICY}`;
    const response = await apiClient.get(URL, { skipToken: true });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};

// Agreement API
export const agreement_API = async () => {
  try {
    const URL = `${AGREEMENT}`;
    const response = await apiClient.get(URL, { skipToken: true });
    return response?.data;
  } catch (error) {
    throw error?.response?.data;
  }
};
