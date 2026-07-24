import { Platform } from "react-native";

export const BrandColor = {
  navyBlue: "#0D1B2A",
  carolinaBlue: "#4DA3E6",
  hunterGreen: "#1B5E3B",
  forestGreen: "#2E7D32",
  softGreen: "#A8D5B2",
  lightGray: "#F4F6F8",
  white: "#FFFFFF",
  accentOrange: "#FF8A00",
  errorRed: "#D32F2F",
};

export const customerTheme = {
  background: {
    primary: BrandColor.white,
    secondary: BrandColor.lightGray,
    soft: "#EAF4FB",
  },
  text: {
    primary: BrandColor.navyBlue,
    secondary: "#5F6B7A",
    inverse: BrandColor.white,
  },
  action: {
    primary: BrandColor.carolinaBlue,
    primaryPressed: "#2F86C9",
    secondary: BrandColor.forestGreen,
    secondaryPressed: BrandColor.hunterGreen,
  },
  navigation: {
    active: BrandColor.carolinaBlue,
    inactive: "#8A9099",
  },
  status: {
    success: BrandColor.forestGreen,
    successSoft: BrandColor.softGreen,
    warning: BrandColor.accentOrange,
    error: BrandColor.errorRed,
    errorSoft: "#FDECEC",
  },
  border: "#D9E0E7",
};

export const vendorTheme = {
  background: {
    primary: BrandColor.navyBlue,
    secondary: "#14283D",
    card: BrandColor.white,
    cardAlt: BrandColor.lightGray,
  },
  text: {
    primary: BrandColor.navyBlue,
    secondary: "#5F6B7A",
    inverse: BrandColor.white,
    mutedOnDark: "#C9D3DF",
  },
  action: {
    primary: BrandColor.hunterGreen,
    primaryPressed: "#13452B",
    secondary: BrandColor.forestGreen,
    secondaryPressed: BrandColor.hunterGreen,
  },
  navigation: {
    background: BrandColor.navyBlue,
    active: BrandColor.carolinaBlue,
    inactive: "#AAB4C0",
  },
  chart: {
    primary: BrandColor.carolinaBlue,
    positive: BrandColor.forestGreen,
    secondary: BrandColor.softGreen,
  },
  status: {
    success: BrandColor.forestGreen,
    pending: BrandColor.accentOrange,
    error: BrandColor.errorRed,
  },
};

export const AppColor = {
  primary: customerTheme.action.primary,
  primaryLight: customerTheme.background.soft,
  orderProgressbar: customerTheme.action.primaryPressed,
  text: customerTheme.text.primary,
  subText: customerTheme.text.secondary,
  textHighlighter: customerTheme.text.secondary,
  textPlaceholder: customerTheme.navigation.inactive,
  border: customerTheme.border,
  likePlaceholder: customerTheme.navigation.inactive,
  ratingStar: BrandColor.accentOrange,
  placeholderTextColor: customerTheme.navigation.inactive,
  borderColor: customerTheme.background.secondary,

  white: BrandColor.white,
  black: BrandColor.navyBlue,
  gray: customerTheme.navigation.inactive,
  red: customerTheme.status.error,
  yellow: BrandColor.accentOrange,

  snackbarInfo: customerTheme.action.primary,
  snackbarSuccess: customerTheme.status.success,
  snackbarError: customerTheme.status.error,
  snackbarWarning: customerTheme.status.warning,
  snackbarDefault: BrandColor.navyBlue,

  grayText: customerTheme.text.secondary,
  darkText: customerTheme.text.primary,

  screenBg: customerTheme.background.secondary,
  lightGreenBG: customerTheme.status.successSoft,
  lightRedBG: customerTheme.status.errorSoft,
};

// Fonts
export const Primary400 =
  Platform.OS === "ios" ? "P22 ArtsAndCrafts" : "P22 Arts And Crafts Regular";
export const Secondary400 =
  Platform.OS === "ios" ? "IM Fell English" : "IMFellEnglish-Regular";

export const Inter100 =
  Platform.OS === "ios" ? "Inter-ThinBETA" : "Inter-Thin-BETA";
export const Inter200 =
  Platform.OS === "ios" ? "Inter-ExtraLightBETA" : "Inter-ExtraLight-BETA";
export const Inter300 =
  Platform.OS === "ios" ? "Inter-LightBETA" : "Inter-Light-BETA";
export const Inter400 = "Inter-Regular";
export const Inter500 = "Inter-Medium";
export const Inter600 = "Inter-SemiBold";
export const Inter700 = "Inter-Bold";
export const Inter800 = "Inter-ExtraBold";
export const Inter900 = "Inter-Black";

export const Mulish200 = "Mulish-ExtraLight";
export const Mulish300 = "Mulish-Light";
export const Mulish400 = "Mulish-Regular";
export const Mulish500 = "Mulish-Medium";
export const Mulish600 = "Mulish-SemiBold";
export const Mulish700 = "Mulish-Bold";
export const Mulish800 = "Mulish-ExtraBold";
export const Mulish900 = "Mulish-Black";
