import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from "react-native";
import Modal from "react-native-modal";
import { AppColor, Mulish700, Mulish400 } from "../utils/theme";
import { useDispatch, useSelector } from "react-redux";
import { onSignOut } from "../redux/slices/authSlice";
import { clearUserSlice, setUser } from "../redux/slices/userSlice";
import StatusBarManager from "../components/StatusBarManager";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import CustomProfileItem from "../components/CustomProfileItem";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LogoutModal from "../components/LogoutModal";
import {
  deleteAccount_API,
  removeFcmToken_API,
  getUserDetail_API,
  getFreeDessertDetail_API,
  updatePassword_API,
} from "../apiFolder/appAPI";
import { Snackbar, Portal } from "react-native-paper";
import { getBuildNumber, getVersion } from "react-native-device-info";
import { clearFavorites } from "../redux/slices/favoritesSlice";
import { clearOrderSlice } from "../redux/slices/orderSlice";
import { clearFoodTruckProfileSlice } from "../redux/slices/foodTruckProfileSlice";
import { clearLocationSlice } from "../redux/slices/locationSlice";
import { checkInstallationId } from "../helpers/notification.helper";
import { PROFILE_AVATAR } from "../utils/constants";
import { addOrUpdateUser, updateUserKey } from "../redux/slices/userInfoSlice";
import AppImage from "../components/AppImage";
import ChangePasswordModal from "../components/ChangePasswordModal";

const HR = () => <View style={styles.HR} />;

const ProfileMenuScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const { user } = useSelector((state) => state.userReducer);

  const [getDataLoading, setGetDataLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [changePWDModalVisible, setChangePWDModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [freeDessertDetail, setFreeDessertDetail] = useState(null);

  const [snackbarPWD, setSnackbarPWD] = useState({
    visible: false,
    message: "",
    type: "info",
  });

  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "info",
  });

  const handleLogout = async () => {
    try {
      const deviceId = await checkInstallationId();
      if (!deviceId) return;
      const response = await removeFcmToken_API(deviceId);
      console.log("response => ", response);
    } catch (error) {
      console.log("error => ", error);
    }
    dispatch(clearUserSlice());
    dispatch(clearFavorites());
    dispatch(clearOrderSlice());
    dispatch(clearFoodTruckProfileSlice());
    dispatch(clearLocationSlice());
    dispatch(onSignOut());
  };

  const handleChangePassword = async ({ payload, setLoading }) => {
    try {
      setLoading(true);
      const user_id = user._id;
      const response = await updatePassword_API(payload, user_id);
      if (response?.success) {
        setChangePWDModalVisible(false);
        setSnackbar({
          visible: true,
          message: response.message,
          type: "success",
        });

        dispatch(
          updateUserKey({
            emailid: user.email,
            keyName: "password",
            keyValue: payload.newPassword,
          })
        );
      }
    } catch (error) {
      console.log("Error => ", error);
      setSnackbarPWD({
        visible: true,
        message: error.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccountPress = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action is permanent and cannot be reversed.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleteAccountLoading(true);
            try {
              const response = await deleteAccount_API();
              console.log("response => ", response);
              if (response?.success && response?.data) {
                navigation.navigate("deleteOtpVerification", {
                  verificationFor: "delete-account",
                  data: { ...response.data, user: { email: user?.email } },
                  nextScreen: "",
                });
              }
            } catch (error) {
              console.log("error => ", error);
            } finally {
              setDeleteAccountLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleHelpSupportPress = async () => {
    const supportEmail = "support@roundthecorner.com";
    const subject = "RTC - Customer";
    const body = `Hello,\n\nCan you please help me?\n\n\n\n\n\nBest regards,\n${user?.firstName} ${user?.lastName}\n${user?.email}`;

    const url = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Could not open email app");
      }
    } catch (error) {
      console.log("Error opening email app:", error);
      Alert.alert("Error", "Failed to open email app");
    }
  };

  const getUserDetailFromAPI = async () => {
    console.log("getUserDetailFromAPI => called");
    setGetDataLoading(true);
    try {
      const user_id = user._id;
      const response = await getUserDetail_API(user_id);
      if (response?.success && response.data) {
        const USER_DATA = response.data.user;
        console.log("USER_DATA => ", USER_DATA);

        dispatch(setUser(USER_DATA));
        dispatch(
          addOrUpdateUser({
            emailid: USER_DATA.email,
            userData: {
              emailid: USER_DATA.email,
              username: USER_DATA.firstName || "",
              imageUrl: USER_DATA.profilePic || null,
            },
          })
        );
      }
    } catch (error) {
      console.log("error => ", error);
    } finally {
      setGetDataLoading(false);
    }
  };

  const getFreeDessertDetail = async () => {
    try {
      const response = await getFreeDessertDetail_API();
      console.log("response => ", response);
      if (response?.success && response.data) {
        setFreeDessertDetail(response.data.progress);
      }
    } catch (error) {
      console.log("error => ", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      getUserDetailFromAPI();
      getFreeDessertDetail();
    } catch (error) {
      console.error("Error during refresh:", error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    getUserDetailFromAPI();
    getFreeDessertDetail();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{"Profile"}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={AppColor.primary}
          />
        }
      >
        <View style={styles.profileInfoContainer}>
          <View style={styles.avatarWrap}>
            <AppImage
              uri={user.profilePic || PROFILE_AVATAR}
              containerStyle={styles.avatarImg}
            />
          </View>
          <View style={styles.userInfoContainer}>
            <View style={styles.userNameContainer}>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
            </View>
            <View style={styles.userContactRow}>
              <MaterialIcons
                name="email"
                size={14}
                color="#888"
                style={styles.contactIcon}
              />
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
            <View style={styles.userContactRow}>
              <MaterialIcons
                name="phone"
                size={14}
                color="#888"
                style={styles.contactIcon}
              />
              <Text style={styles.userMobile}>
                {user?.countryCode} {user?.mobileNumber}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content Goes Here */}
        <View style={styles.mainContentContainer}>
          {/* Dessert Progress */}
          <LinearGradient
            colors={[AppColor.primary, AppColor.primaryLight]}
            style={styles.gradientContainer}
          >
            <View style={styles.dessertCard}>
              <Text style={styles.dessertTitle}>{"Get Free Dessert!"}</Text>
              <View style={styles.progressInfoRow}>
                <Text style={styles.dessertSub}>
                  {freeDessertDetail?.ordersDoneInCurrentCycle || 0}/
                  {freeDessertDetail?.freeDessertOrderCount || 0} Orders
                  completed
                </Text>
                <Text
                  style={styles.dessertSub}
                >{`${((freeDessertDetail?.ordersDoneInCurrentCycle || 0) / (freeDessertDetail?.freeDessertOrderCount || 0)) * 100}%`}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${((freeDessertDetail?.ordersDoneInCurrentCycle || 0) / (freeDessertDetail?.freeDessertOrderCount || 0)) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text
                style={styles.dessertRemain}
              >{`${freeDessertDetail?.ordersRemainingInCurrentCycle || 0} more orders remaining`}</Text>
            </View>
          </LinearGradient>

          {/* Menu Items */}
          <View style={styles.infoCard}>
            <CustomProfileItem
              imageUri={require("../assets/images/yourProfileIcon.png")}
              label={"My Profile"}
              rightIcon={true}
              onPress={() => navigation.navigate("userProfileScreen")}
            />
            <HR />
            <CustomProfileItem
              imageUri={require("../assets/images/location.png")}
              label={"My Address"}
              rightIcon={true}
              onPress={() => navigation.navigate("addressScreen")}
            />
            <HR />
            <CustomProfileItem
              imageUri={require("../assets/images/favourite.png")}
              label="Favorite Trucks"
              rightIcon={true}
              onPress={() => navigation.navigate("favoriteFoodTrucksScreen")}
            />
            <HR />
            <CustomProfileItem
              imageUri={require("../assets/images/diet.png")}
              label="Diet Restriction"
              rightIcon={true}
              onPress={() => navigation.navigate("dietRestrictionScreen")}
            />
            <HR />
            <CustomProfileItem
              imageUri={require("../assets/images/lock.png")}
              label="Change Password"
              rightIcon={true}
              onPress={() => setChangePWDModalVisible(true)}
            />
            <HR />
            <CustomProfileItem
              imageUri={require("../assets/images/support.png")}
              label="Privacy Policy"
              rightIcon={true}
              onPress={() => navigation.navigate("appPrivacyPolicy")}
            />
            <HR />
            <CustomProfileItem
              imageUri={require("../assets/images/support.png")}
              label="Help & Support"
              rightIcon={true}
              onPress={handleHelpSupportPress}
            />
            <HR />
            <CustomProfileItem
              imageUri={require("../assets/images/logout.png")}
              label="Logout"
              rightIcon={false}
              onPress={() => setLogoutModalVisible(true)}
            />
            <HR />
            <CustomProfileItem
              imageUri={require("../assets/images/bin.png")}
              label="Delete Account"
              rightIcon={false}
              isRed={true}
              onPress={handleDeleteAccountPress}
            />
          </View>
        </View>

        <View style={styles.versionContainer}>
          <Text
            style={styles.versionText}
          >{`v${getVersion()} (${getBuildNumber()})`}</Text>
        </View>

        {/* Change Password Modal */}
        <ChangePasswordModal
          isModalVisible={changePWDModalVisible}
          snackbarPWD={snackbarPWD}
          setSnackbarPWD={setSnackbarPWD}
          onUpdatePress={handleChangePassword}
          onCancelPress={() => setChangePWDModalVisible(false)}
        />

        {/* Logout Modal */}
        <LogoutModal
          isModalVisible={logoutModalVisible}
          onYesLogoutPress={handleLogout}
          onNoLogoutPress={() => setLogoutModalVisible(false)}
        />

        {/* Delete account loader */}
        <Modal
          isVisible={deleteAccountLoading}
          backdropOpacity={0.5}
          animationIn="fadeIn"
          animationOut="fadeOut"
        >
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={AppColor.white} />
          </View>
        </Modal>
      </ScrollView>

      <Portal>
        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
          duration={4000}
          style={{
            backgroundColor:
              snackbar.type === "success"
                ? AppColor.snackbarSuccess
                : snackbar.type === "error"
                  ? AppColor.snackbarError
                  : AppColor.snackbarDefault,
          }}
        >
          {snackbar.message}
        </Snackbar>
      </Portal>
    </View>
  );
};

export default ProfileMenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColor.border,
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: Mulish700,
    fontSize: 20,
    color: AppColor.black,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  profileInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 30,
    paddingHorizontal: 16,
  },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColor.grey_3,
    alignSelf: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  userInfoContainer: {
    marginLeft: 15,
    flex: 1,
    gap: 5,
  },
  userNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userContactRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactIcon: {
    marginRight: 5,
  },
  userName: {
    fontFamily: Mulish700,
    fontSize: 20,
    color: AppColor.black,
    marginRight: 5,
  },
  userEmail: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.grey_1,
  },
  userMobile: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.grey_1,
  },
  mainContentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F0F1F2",
  },
  gradientContainer: {
    borderRadius: 10,
  },
  dessertCard: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  progressInfoRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dessertTitle: {
    fontFamily: Mulish700,
    fontSize: 18,
    color: AppColor.white,
    marginBottom: 6,
  },
  dessertSub: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.white,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: AppColor.white,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 16,
    marginBottom: 12,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: AppColor.orderProgressbar,
    borderRadius: 4,
  },
  dessertRemain: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.white,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 16,
    marginTop: 20,
    backgroundColor: AppColor.white,
    ...Platform.select({
      ios: {
        shadowColor: AppColor.black,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },

  versionContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  versionText: {
    fontSize: 14,
    fontFamily: Mulish400,
    color: AppColor.text,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  HR: {
    height: 1,
    backgroundColor: "#E5E5EA",
  },
});
