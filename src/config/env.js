import { NativeModules } from "react-native";
import EnvConfig from "react-native-config";

const nativeConfig = EnvConfig || {};

const platformOS =
  NativeModules.PlatformConstants?.os ??
  NativeModules.PlatformConstants?.OS ??
  "android";

const devApiUrl = "https://api-dev.rounddacornerapp.com";

const fallbackConfig = {
  API_URL: __DEV__ ? devApiUrl : "https://api.rounddacornerapp.com",
  API_PREFIX: "/api/v1",
  GOOGLE_MAP_API_KEY: "AIzaSyCdjHeKOYBUcpocHw5-NsdfMy2-dHkBoFY",
  APPLE_PAY_MERCHANT_ID: "merchant.roundthecorner.vendor",
  APPLE_PAY_ENABLED: "true",
  PAYMENT_CURRENCY_CODE: "USD",
  PAYMENT_COUNTRY_CODE: "US",
  GOOGLE_PAY_GATEWAY: "",
  GOOGLE_PAY_MERCHANT_ID: "",
  CYBERSOURCE_MERCHANT_ID: "",
  GOOGLE_PAY_ENVIRONMENT: "",
};

const Config = {
  ...fallbackConfig,
  ...nativeConfig,
};

export default Config;
