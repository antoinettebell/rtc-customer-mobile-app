import React, { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppColor } from "../utils/theme";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import BootSplash from "react-native-bootsplash";
import StatusBarManager from "../components/StatusBarManager";

import SplashTop1Svg from "../assets/images/splashTop1.svg";
import SplashTop2Svg from "../assets/images/splashTop2.svg";
import SplashTop3Svg from "../assets/images/splashTop3.svg";

const SplashScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isSignedIn, isGuest } = useSelector((state) => state.authReducer);
  const { allLocations } = useSelector((state) => state.locationReducer);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const paramsPayload = {};
      if ((isSignedIn || isGuest) && !(allLocations?.length > 0)) {
        paramsPayload.mode = "add";
        paramsPayload.hideBackBtn = true;
      }

      // Navigation function
      navigation.replace(
        isSignedIn
          ? allLocations?.length > 0
            ? "bottomRoot" // home screen
            : "authMapScreen" // map screen
          : isGuest
            ? allLocations?.length > 0
              ? "bottomRoot" // home screen with guest mode
              : "authMapScreen" // map screen
            : "authIntro",
        paramsPayload
      ); // navigate to AuthIntroScreen after splash
    }, 1500); // 3000ms = 3 seconds

    return () => clearTimeout(timeout);
  }, [navigation]);

  useEffect(() => {
    const hideSplash = async () => {
      BootSplash.hide({ fade: true }); // fade is optional
    };

    hideSplash();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top / 2 }]}>
      <StatusBarManager />

      {/* Top 3 SVGs */}
      <View style={styles.topSvgsContainer}>
        <SplashTop3Svg style={styles.topSvg} />
        <SplashTop2Svg style={styles.topSvg} />
        <SplashTop1Svg style={styles.topSvg} />
      </View>

      {/* Middle Image and Text */}
      <View style={styles.middleContainer}>
        <Image
          source={require("../assets/images/AppLogo.png")}
          style={styles.middleImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>Round the Corner</Text>
        <Text style={styles.subtitle}>
          Find & Savor the Best Food Trucks{"\n"}Near You!
        </Text>
      </View>

    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  topSvgsContainer: {
    flexDirection: "row", // Horizontal layout
    alignItems: "center",
    justifyContent: "center",
    // marginTop: 20,
    // gap: 10,
  },
  topSvg: {
    // marginHorizontal: 5,
  },
  middleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  middleImage: {
    width: 220,
    height: 220,
    marginBottom: 12,
  },
  title: {
    fontSize: 19.73,
    fontWeight: "bold",
    color: AppColor.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 11.28,
    color: AppColor.gray,
    textAlign: "center",
    marginTop: 5,
  },
});
