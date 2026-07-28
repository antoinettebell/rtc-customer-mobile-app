import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import StatusBarManager from "../components/StatusBarManager";
import IntroLandingArtwork from "../components/IntroLandingArtwork";
import { AppColor, BrandColor, Mulish400, Mulish700 } from "../utils/theme";
import { onGuest } from "../redux/slices/authSlice";

const featureItems = [
  {
    icon: "location-on",
    title: "Find Nearby",
    subtitle: "Food Trucks",
    color: AppColor.primary,
  },
  {
    icon: "assignment",
    title: "Order & Prepay",
    subtitle: "With Ease",
    color: BrandColor.forestGreen,
  },
  {
    icon: "local-shipping",
    title: "Track Your Order",
    subtitle: "In Real-Time",
    color: AppColor.primary,
  },
  {
    icon: "favorite",
    title: "Support Local",
    subtitle: "& Small Business",
    color: BrandColor.forestGreen,
  },
];

const AuthIntroScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const { allSigninUsers } = useSelector((state) => state.userInfoReducer);
  const heroHeight = Math.min(width * 0.82, height * 0.36);

  const handleSigninPress = () => {
    if (allSigninUsers?.length > 0) {
      navigation.navigate("oneTapSignin");
    } else {
      navigation.navigate("signin");
    }
  };

  const handleSigninLater = () => {
    dispatch(onGuest(true));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 18) },
        ]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <IntroLandingArtwork
          width={width}
          height={heroHeight}
          resizeMode="contain"
        />

        <View style={styles.copyBlock}>
          <Text style={styles.title}>
            <Text style={styles.titlePrimary}>Round the Corner</Text>
            {" –\n"}
            <Text>Your Street Food Buddy!</Text>
          </Text>
          <Text style={styles.description}>
            Discover the best food trucks around you and order your favorite
            bites in just a few taps.
          </Text>
        </View>

        <View style={styles.featureRow}>
          {featureItems.map((item) => (
            <View key={item.title} style={styles.featureItem}>
              <View style={styles.featureIconCircle}>
                <MaterialIcons name={item.icon} size={30} color={item.color} />
              </View>
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureSubtitle}>{item.subtitle}</Text>
            </View>
          ))}
        </View>

        <View style={styles.buttonBlock}>
          <TouchableOpacity
            onPress={handleSigninPress}
            activeOpacity={0.7}
            style={styles.signInButton}
          >
            <Text style={[styles.buttonLabel, styles.signInLabel]}>
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("signup")}
            activeOpacity={0.7}
            style={styles.signUpPrompt}
          >
            <Text style={styles.signUpPromptText}>
              Don&apos;t have an account?{" "}
              <Text style={styles.signUpLabel}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSigninLater}
            activeOpacity={0.7}
            style={styles.skipButton}
          >
            <Text style={styles.skipLabel}>SIGN IN LATER</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default AuthIntroScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  content: {
    alignItems: "center",
  },
  copyBlock: {
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  title: {
    color: AppColor.text,
    fontFamily: Mulish700,
    fontSize: 26,
    lineHeight: 32,
    textAlign: "center",
  },
  titlePrimary: {
    color: AppColor.primary,
  },
  description: {
    color: AppColor.subText,
    fontFamily: Mulish400,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    paddingHorizontal: 16,
    textAlign: "center",
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    paddingHorizontal: 18,
    width: "100%",
  },
  featureItem: {
    alignItems: "center",
    flex: 1,
  },
  featureIconCircle: {
    alignItems: "center",
    backgroundColor: AppColor.primaryLight,
    borderRadius: 26,
    height: 52,
    justifyContent: "center",
    marginBottom: 7,
    width: 52,
  },
  featureTitle: {
    color: AppColor.text,
    fontFamily: Mulish700,
    fontSize: 11,
    textAlign: "center",
  },
  featureSubtitle: {
    color: AppColor.subText,
    fontFamily: Mulish400,
    fontSize: 10,
    lineHeight: 13,
    marginTop: 3,
    textAlign: "center",
  },
  buttonBlock: {
    marginTop: 18,
    paddingHorizontal: 28,
    width: "100%",
  },
  signInButton: {
    alignItems: "center",
    backgroundColor: AppColor.primary,
    borderRadius: 6,
    height: 50,
    justifyContent: "center",
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: AppColor.black,
        shadowOffset: {
          width: 0,
          height: 3,
        },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  signUpPrompt: {
    alignItems: "center",
    minHeight: 36,
    justifyContent: "center",
    marginTop: 6,
    width: "100%",
  },
  skipButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    marginTop: 6,
  },
  buttonLabel: {
    fontFamily: Mulish700,
    fontSize: 15,
    paddingHorizontal: 10,
    textAlign: "center",
  },
  signInLabel: {
    color: AppColor.white,
  },
  signUpPromptText: {
    color: AppColor.subText,
    fontFamily: Mulish400,
    fontSize: 14,
    textAlign: "center",
  },
  signUpLabel: {
    color: AppColor.primary,
    fontFamily: Mulish700,
  },
  skipLabel: {
    color: AppColor.text,
    fontFamily: Mulish700,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
