import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Platform,
  TouchableOpacity,
} from "react-native";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SigninScreen from "./src/screens/signinScreen";
import SignupScreen from "./src/screens/signupScreen";
import OtpVerificationScreen from "./src/screens/otpVerificationScreen";
import AuthIntroScreen from "./src/screens/authIntroScreen";
import ResetPasswordScreen from "./src/screens/resetPasswordScreen";
import SplashScreen from "./src/screens/splashScreen";
import ExploreScreen from "./src/screens/exploreScreen";
import FoodTruckDetailScreen from "./src/screens/foodTruckDetailScreen";
import { useSelector, useDispatch } from "react-redux";
import ForgetPasswordScreen from "./src/screens/forgetPasswordScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import NearMeScreen from "./src/screens/nearMeScreen";
import OrdersScreen from "./src/screens/ordersScreen";
import ProfileMenuScreen from "./src/screens/profileMenuScreen";
import FavoriteFoodTrucksScreen from "./src/screens/favoriteFoodTrucksScreen";
import AddressScreen from "./src/screens/addressScreen";
import { AppColor, Mulish400 } from "./src/utils/theme";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AuthMapScreen from "./src/screens/authMapScreen";
import OrderDetailsScreen from "./src/screens/orderDetailsScreen";
import OrderTrackingScreen from "./src/screens/orderTrackingScreen";
import CancelOrderScreen from "./src/screens/cancelOrderScreen";
import RateTruckScreen from "./src/screens/rateTruckScreen";
import PrivacyPolicyScreen from "./src/screens/privacyPolicyScreen";
import { onGuest, onSignOut } from "./src/redux/slices/authSlice";
import CheckoutScreen from "./src/screens/checkoutScreen";
import CouponCodeScreen from "./src/screens/couponCodeScreen";
import OrderPlacedScreen from "./src/screens/orderPlacedScreen";
import RateReviewScreen from "./src/screens/rateReviewScreen";
import { clearUserSlice } from "./src/redux/slices/userSlice";
import { clearFavorites } from "./src/redux/slices/favoritesSlice";
import { clearOrderSlice } from "./src/redux/slices/orderSlice";
import { clearFoodTruckProfileSlice } from "./src/redux/slices/foodTruckProfileSlice";
import { clearLocationSlice } from "./src/redux/slices/locationSlice";
import { navigationRef } from "./src/helpers/navigation.helper";
import {
  createAndroidChannel,
  requestNotificationPermission,
} from "./src/helpers/notification.helper";
import TermsOfServiceScreen from "./src/screens/termsOfServiceScreen";
import SeeAllTrucksScreen from "./src/screens/seeAllTrucksScreen";
import GlobalSearchScreen from "./src/screens/globalSearchScreen";
import OneTapSignInScreen from "./src/screens/oneTapSigninScreen";
import SearchResultScreen from "./src/screens/searchResultScreen";

const Stack = createNativeStackNavigator();
const BottomTab = createBottomTabNavigator();

const exploreActive = require("./src/assets/images/homeMenuActive.png");
const exploreInactive = require("./src/assets/images/homeMenuInactive.png");
const nearmeActive = require("./src/assets/images/nearmeMenuActive.png");
const nearmeInactive = require("./src/assets/images/nearmeMenuInactive.png");
const ordersActive = require("./src/assets/images/ordersMenuActive.png");
const ordersInactive = require("./src/assets/images/ordersMenuInactive.png");
const profileActive = require("./src/assets/images/profileMenuActive.png");
const profileInactive = require("./src/assets/images/profileMenuInactive.png");

// Auth Required Screen Component
const AuthRequiredScreen = ({ title }) => {
  const dispatch = useDispatch();

  const handleSignIn = () => {
    dispatch(onGuest(false));
    dispatch(clearUserSlice());
    dispatch(clearFavorites());
    dispatch(clearOrderSlice());
    dispatch(clearFoodTruckProfileSlice());
    dispatch(clearLocationSlice());
    dispatch(onSignOut());
  };

  return (
    <SafeAreaView style={styles.authRequiredContainer}>
      <View style={styles.authRequiredContent}>
        <Text style={styles.authRequiredTitle}>Sign In Required</Text>
        <Text style={styles.authRequiredMessage}>
          Please sign in to access {title}
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.signInButton}
          onPress={handleSignIn}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={{ headerShown: false }}
    initialRouteName="splash"
  >
    <Stack.Screen name="splash" component={SplashScreen} />
    <Stack.Screen name="authIntro" component={AuthIntroScreen} />
    <Stack.Screen name="signin" component={SigninScreen} />
    <Stack.Screen name="signup" component={SignupScreen} />
    <Stack.Screen name="oneTapSignin" component={OneTapSignInScreen} />
    <Stack.Screen name="otpVerification" component={OtpVerificationScreen} />
    <Stack.Screen name="resetPassword" component={ResetPasswordScreen} />
    <Stack.Screen name="forgetPassword" component={ForgetPasswordScreen} />
    <Stack.Screen name="termsOfService" component={TermsOfServiceScreen} />
    <Stack.Screen name="privacyPolicy" component={PrivacyPolicyScreen} />
  </Stack.Navigator>
);

const BottomNavigator = ({ insets }) => {
  const { isSignedIn } = useSelector((state) => state.authReducer);

  return (
    <BottomTab.Navigator
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarStyle: {
          height: insets.bottom + 60,
        },
        tabBarLabelStyle: {
          // fontFamily: Mulish400,
          fontSize: 12,
          fontWeight: "500",
          bottom: 5,
        },
        tabBarActiveTintColor: AppColor.primary,
        tabBarInactiveTintColor: AppColor.gray,
      }}
    >
      <BottomTab.Screen
        name="exploreScreen"
        component={ExploreScreen}
        options={{
          tabBarLabel: "Explore",
          tabBarIcon: ({ focused, color, size }) => (
            <Image
              source={focused ? exploreActive : exploreInactive}
              style={{ height: 24, width: 24 }}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="nearMeScreen"
        component={NearMeScreen}
        options={{
          tabBarLabel: "Near Me",
          tabBarIcon: ({ focused, color, size }) => (
            <Image
              source={focused ? nearmeActive : nearmeInactive}
              style={{ height: 24, width: 24 }}
            />
          ),
          tabBarHideOnKeyboard: false,
          unmountOnBlur: true,
        }}
      />
      <BottomTab.Screen
        name="ordersScreen"
        component={
          isSignedIn
            ? OrdersScreen
            : () => <AuthRequiredScreen title="Orders" />
        }
        options={{
          tabBarLabel: "Orders",
          tabBarIcon: ({ focused, color, size }) => (
            <Image
              source={focused ? ordersActive : ordersInactive}
              style={{ height: 24, width: 24 }}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="profileMenuScreen"
        component={
          isSignedIn
            ? ProfileMenuScreen
            : () => <AuthRequiredScreen title="Profile" />
        }
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused, color, size }) => (
            <Image
              source={focused ? profileActive : profileInactive}
              style={{ height: 24, width: 24 }}
            />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
};

const AppNavigator = ({ insets }) => (
  <Stack.Navigator
    screenOptions={{ headerShown: false }}
    initialRouteName="splash"
  >
    <Stack.Screen name="splash" component={SplashScreen} />
    <Stack.Screen name="authMapScreen" component={AuthMapScreen} />
    <Stack.Screen name="bottomRoot">
      {() => <BottomNavigator insets={insets} />}
    </Stack.Screen>
    <Stack.Screen
      name="foodTruckDetailScreen"
      component={FoodTruckDetailScreen}
    />
    <Stack.Screen
      name="favoriteFoodTrucksScreen"
      component={FavoriteFoodTrucksScreen}
    />
    <Stack.Screen name="addressScreen" component={AddressScreen} />
    <Stack.Screen name="orderDetailsScreen" component={OrderDetailsScreen} />
    <Stack.Screen name="orderTrackingScreen" component={OrderTrackingScreen} />
    <Stack.Screen name="checkoutScreen" component={CheckoutScreen} />
    <Stack.Screen name="couponCodeScreen" component={CouponCodeScreen} />
    <Stack.Screen name="orderPlacedScreen" component={OrderPlacedScreen} />
    <Stack.Screen name="rateReviewScreen" component={RateReviewScreen} />
    <Stack.Screen name="cancelOrderScreen" component={CancelOrderScreen} />
    <Stack.Screen name="appPrivacyPolicy" component={PrivacyPolicyScreen} />
    <Stack.Screen name="rateTruckScreen" component={RateTruckScreen} />
    <Stack.Screen name="seeAllTrucksScreen" component={SeeAllTrucksScreen} />
    <Stack.Screen name="globalSearchScreen" component={GlobalSearchScreen} />
    <Stack.Screen name="searchResultScreen" component={SearchResultScreen} />
    <Stack.Screen
      name="deleteOtpVerification"
      component={OtpVerificationScreen}
    />
  </Stack.Navigator>
);

const configureNotification = async () => {
  await requestNotificationPermission();
  if (Platform.OS === "android") {
    await createAndroidChannel();
  }
};

const App = () => {
  const insets = useSafeAreaInsets();
  const { isSignedIn, isGuest } = useSelector((state) => state.authReducer);

  useEffect(() => {
    configureNotification();
  }, []);

  return (
    <NavigationContainer ref={navigationRef} theme={DefaultTheme}>
      {isSignedIn ? (
        <AppNavigator insets={insets} />
      ) : isGuest ? (
        <AppNavigator insets={insets} />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authRequiredContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  authRequiredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  authRequiredTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColor.primary,
    marginBottom: 16,
    textAlign: "center",
  },
  authRequiredMessage: {
    fontSize: 16,
    color: AppColor.gray,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  signInButton: {
    backgroundColor: AppColor.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  signInButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
