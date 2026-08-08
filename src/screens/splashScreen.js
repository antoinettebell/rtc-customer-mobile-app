import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IntroLandingArtwork from "../components/IntroLandingArtwork";
import { AppColor, Mulish700, Mulish400 } from "../utils/theme";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import BootSplash from "react-native-bootsplash";
import StatusBarManager from "../components/StatusBarManager";

const SplashScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isSignedIn, isGuest } = useSelector((state) => state.authReducer);

  useEffect(() => {
    const timeout = setTimeout(() => {
      // Navigation function
      navigation.replace(
        isSignedIn
          ? "bottomRoot" // location is selected only when a location-dependent action needs it
          : isGuest
            ? "bottomRoot" // guests can browse without granting location
            : "authIntro"
      ); // navigate to AuthIntroScreen after splash
    }, 1500); // 3000ms = 3 seconds

    return () => clearTimeout(timeout);
  }, [isGuest, isSignedIn, navigation]);

  useEffect(() => {
    const hideSplash = async () => {
      BootSplash.hide({ fade: true }); // fade is optional
    };

    hideSplash();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />

      <View style={styles.content}>
        <IntroLandingArtwork width={360} height={420} />
        <Text style={styles.title}>Round the Corner</Text>
        <Text style={styles.subtitle}>Find & Savor the Best Food Trucks Near You!</Text>
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
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: Mulish700,
    fontSize: 30,
    color: AppColor.text,
    textAlign: "center",
    marginTop: 12,
  },
  subtitle: {
    fontFamily: Mulish400,
    fontSize: 17,
    color: AppColor.subText,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 24,
  },
});
