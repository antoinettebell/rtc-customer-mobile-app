import { NativeModules } from "react-native";

const nativeConfig = NativeModules.RNCConfigModule?.getConfig?.()?.config ?? {};

const platformOS =
  NativeModules.PlatformConstants?.os ??
  NativeModules.PlatformConstants?.OS ??
  "android";

const devApiUrl =
  platformOS === "android" ? "http://10.0.2.2:3001" : "http://localhost:3001";

const fallbackConfig = {
  API_URL: __DEV__ ? devApiUrl : "http://157.245.6.61:3000",
  API_PREFIX: "/api/v1",
  GOOGLE_MAP_API_KEY: "AIzaSyCdjHeKOYBUcpocHw5-NsdfMy2-dHkBoFY",
  APPLE_PAY_MERCHANT_ID: "merchant.roundthecorner.vendor",
  PAYMENT_CURRENCY_CODE: "USD",
  PAYMENT_COUNTRY_CODE: "US",
  ANDROID_PAYMENT_GATEWAY: "authorizenet",
  ANDROID_PAYMENT_GATEWAY_MERCHANT_ID: "2794197",
};

const Config = {
  ...fallbackConfig,
  ...nativeConfig,
};

export default Config;
