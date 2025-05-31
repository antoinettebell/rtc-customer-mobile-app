import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  Platform,
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
import { useSelector } from "react-redux";
import ForgetPasswordScreen from "./src/screens/forgetPasswordScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import NearMeScreen from "./src/screens/nearMeScreen";
import OrdersScreen from "./src/screens/ordersScreen";
import ProfileMenuScreen from "./src/screens/profileMenuScreen";
import FavoriteFoodTrucksScreen from "./src/screens/favoriteFoodTrucksScreen";
import AddressScreen from "./src/screens/addressScreen";
import { AppColor, Secondary400 } from "./src/utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AuthMapScreen from "./src/screens/authMapScreen";

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

const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={{ headerShown: false }}
    initialRouteName="splash"
  >
    <Stack.Screen name="splash" component={SplashScreen} />
    <Stack.Screen name="authIntro" component={AuthIntroScreen} />
    <Stack.Screen name="signin" component={SigninScreen} />
    <Stack.Screen name="signup" component={SignupScreen} />
    <Stack.Screen name="otpVerification" component={OtpVerificationScreen} />
    <Stack.Screen name="resetPassword" component={ResetPasswordScreen} />
    <Stack.Screen name="forgetPassword" component={ForgetPasswordScreen} />
  </Stack.Navigator>
);

const BottomNavigator = ({ insets }) => (
  <BottomTab.Navigator
    screenOptions={{
      tabBarHideOnKeyboard: true,
      headerShown: false,
      tabBarStyle: {
        height: Platform.OS === "ios" ? insets.bottom + 60 : 60,
      },
      tabBarLabelStyle: {
        // fontFamily: Secondary400,
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
      }}
    />
    <BottomTab.Screen
      name="ordersScreen"
      component={OrdersScreen}
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
      component={ProfileMenuScreen}
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

const AppNavigator = ({ insets }) => (
  <Stack.Navigator
    screenOptions={{ headerShown: false }}
    initialRouteName="splash"
  >
    <Stack.Screen name="splash" component={SplashScreen} />
    <Stack.Screen name="authMapScreen" component={AuthMapScreen} />
    <Stack.Screen
      name="bottomRoot"
      component={() => <BottomNavigator insets={insets} />}
    />
    <Stack.Screen
      name="foodTruckDetailScreen"
      component={FoodTruckDetailScreen}
    />
    <Stack.Screen
      name="favoriteFoodTrucksScreen"
      component={FavoriteFoodTrucksScreen}
    />
    <Stack.Screen name="addressScreen" component={AddressScreen} />
  </Stack.Navigator>
);

const App = () => {
  const insets = useSafeAreaInsets();
  const { isSignedIn, isGuest } = useSelector((state) => state.authReducer);

  return (
    <NavigationContainer theme={DefaultTheme}>
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
  container: { flex: 1 },
});
