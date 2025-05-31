import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
  FlatList,
  Dimensions,
} from "react-native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import { useDispatch, useSelector } from "react-redux";
import Modal from "react-native-modal";
import { onSignOut } from "../redux/slices/authSlice";
import { clearUserSlice } from "../redux/slices/userSlice";
import StatusBarManager from "../components/StatusBarManager";
import FastImage from "@d11/react-native-fast-image";
import Entypo from "react-native-vector-icons/Entypo";
import Ionicons from "react-native-vector-icons/Ionicons";
import Feather from "react-native-vector-icons/Feather";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import CustomProfileItem from "../components/CustomProfileItem";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const avatarImg = require("../assets/images/profileMenuActive.png");
const favTruck1 = require("../assets/images/FT-Demo-01.png");
const favTruck2 = require("../assets/images/FT-Demo-02.png");

const HR = () => <View style={styles.HR} />;

const LogoutModal = ({ isModalVisible, onYesLogoutPress, onNoLogoutPress }) => (
  <Modal
    isVisible={isModalVisible}
    backdropOpacity={0.5}
    animationIn="zoomIn"
    animationOut="zoomOut"
  >
    <View style={styles.modalContainer}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={{ position: "absolute", top: 10, right: 10 }}
        onPress={onNoLogoutPress}
      >
        <Ionicons
          name="close-circle-sharp"
          size={32}
          color={AppColor.primary}
        />
      </TouchableOpacity>
      <Text style={styles.modalTitle}>{"LoGoUT"}</Text>
      <Text style={styles.modalSubtitle}>
        {"Are you sure you want to logout?"}
      </Text>
      <TouchableOpacity
        style={styles.logoutModalBtnYes}
        activeOpacity={0.7}
        onPress={onYesLogoutPress}
      >
        <Text style={styles.logoutModalBtnText}>{"Yes"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.logoutModalBtnNo}
        activeOpacity={0.7}
        onPress={onNoLogoutPress}
      >
        <Text style={[styles.logoutModalBtnText, { color: AppColor.primary }]}>
          {"No"}
        </Text>
      </TouchableOpacity>
    </View>
  </Modal>
);

const ProfileMenuScreen = () => {
  const dispatch = useDispatch();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const { isSignedIn, isGuest } = useSelector((state) => state.authReducer);
  const { user } = useSelector((state) => state.userReducer);
  const insets = useSafeAreaInsets();

  const ordersCompleted = 5;
  const totalOrders = 10;
  const progress = ordersCompleted / totalOrders;

  const handleLogout = () => {
    dispatch(clearUserSlice());
    dispatch(onSignOut());
  };

  const favoriteTrucks = [
    {
      id: 1,
      name: "BURGER EXPRESS",
      image: favTruck1,
      reviews: "200+ reviews",
      distance: "0.3 miles away",
    },
    {
      id: 2,
      name: "BURGER EXPRESS",
      image: favTruck2,
      reviews: "200+ reviews",
      distance: "0.5 miles away",
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.headerWrap}>
          <Text style={styles.profileTitle}>PROFILE</Text>
          <Entypo
            name="dots-three-vertical"
            size={20}
            color={AppColor.text}
            style={{ position: "absolute", right: 0, top: 0 }}
          />
        </View>
        <View style={styles.avatarWrap}>
          <FastImage source={avatarImg} style={styles.avatarImg} />
          <View style={styles.cameraIcon}>
            <MaterialIcons name="camera-alt" size={18} color={AppColor.white} />
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 30,
            marginTop: 10,
          }}
        >
          <Text style={styles.userName}>{user?.firstName || "John Doe"}</Text>
          <View style={styles.editIcon}>
            <Feather name="edit" size={12} color={AppColor.white} />
          </View>
        </View>
        {/* Dessert Progress */}
        <LinearGradient
          colors={[AppColor.primary, AppColor.primaryLight]}
          style={styles.dessertCard}
        >
          <Text style={styles.dessertTitle}>GET FREE DESSERT!</Text>
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text style={styles.dessertSub}>
              {ordersCompleted}/{totalOrders} Orders completed
            </Text>
            <Text style={styles.dessertSub}>{`${progress * 100}%`}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
            />
          </View>
          <Text
            style={styles.dessertRemain}
          >{`${totalOrders - ordersCompleted} more orders remaining`}</Text>
        </LinearGradient>

        {/* Contact Info */}
        <View style={styles.infoCard}>
          <CustomProfileItem
            imageUri={require("../assets/images/phone.png")}
            label={user?.phone || "+1 234 567 3083"}
            rightIcon={true}
            onPress={() => {}}
          />
          <HR />
          <CustomProfileItem
            imageUri={require("../assets/images/location.png")}
            label={"My Address"}
            rightIcon={true}
            onPress={() => {}}
          />
        </View>
        {/* Favorite Food Trucks */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>FAVORITE FOOD TRUCKS</Text>
          <Entypo name="chevron-small-right" size={24} color={AppColor.black} />
        </View>
        <View style={styles.favTrucksCard}>
          <FlatList
            data={favoriteTrucks}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View key={item.id} style={styles.favTruckRow}>
                <FastImage source={item.image} style={styles.favTruckImg} />
                <View
                  style={{
                    flex: 1,
                    marginLeft: 10,
                  }}
                >
                  <Text style={styles.favTruckName}>{item.name}</Text>
                  <Text style={styles.favTruckReview}>
                    ⭐ {item.reviews} - {item.distance}
                  </Text>
                </View>
              </View>
            )}
            ItemSeparatorComponent={<HR />}
          />
        </View>
        {/* Menu Items */}
        <View style={styles.infoCard}>
          <CustomProfileItem
            imageUri={require("../assets/images/lock.png")}
            label="Privacy Policy"
            rightIcon={true}
            onPress={() => {}}
          />
          <HR />
          <CustomProfileItem
            imageUri={require("../assets/images/support.png")}
            label="Help & Support"
            rightIcon={true}
            onPress={() => {}}
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
            onPress={() => {}}
          />
        </View>

        {/* Modals */}
        <LogoutModal
          isModalVisible={logoutModalVisible}
          onYesLogoutPress={handleLogout}
          onNoLogoutPress={() => setLogoutModalVisible(false)}
        />

        {/* Keep old logic for demo */}
        <View style={{ marginTop: 30, alignItems: "center" }}>
          {isSignedIn ? (
            <Text
              style={{
                fontSize: 20,
                fontFamily: Primary400,
                color: AppColor.text,
              }}
            >{`Hello, ${user?.firstName}`}</Text>
          ) : null}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            style={styles.signInButton}
          >
            <Text style={styles.buttonLabel}>
              {isSignedIn ? "Sign Out" : "Sign In"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileMenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
    paddingHorizontal: 16,
  },
  headerWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  profileTitle: {
    fontFamily: Primary400,
    fontSize: 18,
    color: AppColor.text,
    letterSpacing: 1.5,
  },
  avatarWrap: {
    alignItems: "center",
  },
  avatarImg: {
    width: 95,
    height: 95,
    borderRadius: 47.5,
    borderWidth: 1,
    borderColor: AppColor.primary,
  },
  cameraIcon: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderColor: AppColor.primary,
    backgroundColor: AppColor.primary,
    position: "absolute",
    bottom: 0,
    right: Dimensions.get("window").width / 2 - 60,
  },
  editIcon: {
    height: 18,
    width: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    backgroundColor: AppColor.primary,
  },
  userName: {
    fontFamily: Primary400,
    fontSize: 18,
    color: AppColor.text,
    textAlign: "center",
    marginHorizontal: 8,
  },
  dessertCard: {
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  dessertTitle: {
    fontFamily: Primary400,
    fontSize: 18,
    color: AppColor.white,
    marginBottom: 6,
  },
  dessertSub: {
    fontFamily: Secondary400,
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
    fontFamily: Secondary400,
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
        elevation: 2,
      },
    }),
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
    marginTop: 20,
  },
  sectionTitle: {
    fontFamily: Primary400,
    fontSize: 15,
    color: AppColor.text,
    letterSpacing: 1,
  },
  favTrucksCard: {
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 16,
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
        elevation: 2,
      },
    }),
  },
  favTruckRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  favTruckImg: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  favTruckName: {
    fontFamily: Primary400,
    fontSize: 14,
    color: AppColor.text,
    marginBottom: 8,
  },
  favTruckReview: {
    fontFamily: Secondary400,
    fontSize: 12,
    color: AppColor.textHighlighter,
  },
  signInButton: {
    height: 48,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColor.primary,
    marginTop: 12,
    width: 180,
    ...Platform.select({
      ios: {
        shadowColor: AppColor.black,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonLabel: {
    fontFamily: Secondary400,
    fontSize: 16,
    color: AppColor.white,
  },
  HR: {
    height: 1,
    backgroundColor: "#E5E5EA",
  },

  // Logout Modal
  modalContainer: {
    backgroundColor: AppColor.white,
    marginHorizontal: "5%",
    paddingVertical: 36,
    paddingHorizontal: 33,
    borderRadius: 24,
  },
  modalTitle: {
    marginBottom: 30,
    fontSize: 22,
    fontFamily: Primary400,
    color: AppColor.text,
    textAlign: "center",
  },
  modalSubtitle: {
    marginBottom: 20,
    fontSize: 16,
    fontFamily: Secondary400,
    color: AppColor.textHighlighter,
    textAlign: "center",
  },
  logoutModalBtnYes: {
    width: "100%",
    height: 48,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColor.primary,
    marginTop: 15,
    ...Platform.select({
      ios: {
        shadowColor: AppColor.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoutModalBtnNo: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: AppColor.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  logoutModalBtnText: {
    color: AppColor.white,
    fontFamily: Secondary400,
    fontSize: 16,
  },
});
