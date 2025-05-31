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
import { onSignOut } from "../redux/slices/authSlice";
import usePermission from "../hooks/usePermission";
import ImagePicker from "react-native-image-crop-picker";
import { RESULTS } from "react-native-permissions";
import { permission } from "../utils/permissions";
import { clearUserSlice } from "../redux/slices/userSlice";
import StatusBarManager from "../components/StatusBarManager";
import FastImage from "@d11/react-native-fast-image";
import Entypo from "react-native-vector-icons/Entypo";
import Feather from "react-native-vector-icons/Feather";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import CustomProfileItem from "../components/CustomProfileItem";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LogoutModal from "../components/LogoutModal";
import UpdateNameModal from "../components/UpdateNameModal";
import UpdateContactModal from "../components/UpdateContactModal";
import MediaPickerDialog from "../components/MediaPickerDialog";

const avatarImg = require("../assets/images/profileMenuActive.png");
const favTruck1 = require("../assets/images/FT-Demo-01.png");
const favTruck2 = require("../assets/images/FT-Demo-02.png");

const HR = () => <View style={styles.HR} />;

const ProfileMenuScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const { checkAndRequestPermission: photosPermissionStatus } = usePermission(
    permission.photos
  );
  const { checkAndRequestPermission: cameraPermissionStatus } = usePermission(
    permission.camera
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [updateNameModalVisible, setUpdateNameModalVisible] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [updateContactModalVisible, setUpdateContactModalVisible] =
    useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const { user } = useSelector((state) => state.userReducer);
  const insets = useSafeAreaInsets();

  // Local state for name editing
  const [editedName, setEditedName] = useState(user?.firstName || "John Doe");
  const [displayName, setDisplayName] = useState(user?.firstName || "John Doe");

  // Local state for contact editing
  const [countryCode, setCountryCode] = useState(user?.countryCode || "+91");
  const [mobileNumber, setMobileNumber] = useState(
    user?.phone?.replace(/^\+\d+\s*/, "") || ""
  );
  const [displayContact, setDisplayContact] = useState(
    user?.phone || "+91 9542454455"
  );
  const [contactError, setContactError] = useState("");

  const ordersCompleted = 5;
  const totalOrders = 10;
  const progress = ordersCompleted / totalOrders;

  const onMediaModalClose = () => {
    setModalVisible(false);
    setSelectedMediaType(null);
  };

  const handleCameraPress = async () => {
    setModalVisible(false);
    try {
      const cameraStatus = await cameraPermissionStatus();
      if (cameraStatus !== RESULTS.GRANTED) return;

      setTimeout(
        async () => {
          // Permission granted, open the camera
          await ImagePicker.openCamera({
            cropping: false,
            mediaType: "photo",
          })
            .then(async (image) => {
              try {
                const imagedata = {
                  mode: "camera",
                  uri: image?.path,
                  name: `${image?.path?.split("/").pop()}`, // did this because not able to get filename in ios
                  type: image.mime,
                };

                setSelectedPhotos((prev) => [...prev, imagedata]);
              } catch (error) {
                console.log("error => ", error);
              }
            })
            .catch((error) => {
              console.log("error => ", error);
            });
        },
        Platform.OS === "ios" ? 600 : 0
      );
    } catch (error) {
      console.error("error => ", error);
    } finally {
    }
  };

  const handleGalleryPress = async (mediaType) => {
    setModalVisible(false);
    try {
      const photosStatus = await photosPermissionStatus();
      if (photosStatus !== RESULTS.GRANTED && photosStatus !== RESULTS.LIMITED)
        return;

      setTimeout(
        async () => {
          await ImagePicker.openPicker({
            multiple: true,
            mediaType: "photo",
          })
            .then((images) => {
              try {
                const tempImages = images.map((i) =>
                  Platform.OS == "ios"
                    ? {
                        mode: "media",
                        uri: i?.sourceURL,
                        name: i?.filename,
                        type: i.mime,
                      }
                    : {
                        mode: "media",
                        uri: i?.path,
                        name: i?.filename,
                        type: i.mime,
                      }
                );
                setSelectedPhotos((prev) => [...prev, ...tempImages]);
              } catch (error) {
                console.log("error => ", error);
              }
            })
            .catch((error) => {
              console.log("error => ", error);
            });
        },
        Platform.OS === "ios" ? 600 : 0
      );
    } catch (error) {
      console.error("error => ", error);
    } finally {
    }
  };

  const handleUpdateName = () => {
    setDisplayName(editedName);
    setUpdateNameModalVisible(false);
    // Here you can also dispatch an action to update the name in redux/backend if needed
  };

  const validateMobileNumber = (value) => {
    if (!value) return "Mobile number is required.";
    if (!/^\d{10}$/.test(value)) return "Enter a valid 10-digit mobile number.";
    return "";
  };

  const handleUpdateContact = () => {
    const error = validateMobileNumber(mobileNumber);
    setContactError(error);
    if (error) return;
    setDisplayContact(`${countryCode} ${mobileNumber}`);
    setUpdateContactModalVisible(false);
    // Here you can also dispatch an action to update the contact in redux/backend if needed
  };

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
          <View style={{ width: 20 }} />
          <Text style={styles.profileTitle}>PRoFILE</Text>
          <Entypo name="dots-three-vertical" size={20} color={AppColor.text} />
        </View>
        <View style={styles.avatarWrap}>
          <FastImage source={avatarImg} style={styles.avatarImg} />
          <TouchableOpacity
            style={styles.cameraIcon}
            onPress={() => setModalVisible(true)}
          >
            <MaterialIcons name="camera-alt" size={18} color={AppColor.white} />
          </TouchableOpacity>
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
          <Text style={styles.userName}>{displayName}</Text>
          <TouchableOpacity
            style={styles.editIcon}
            onPress={() => setUpdateNameModalVisible(true)}
          >
            <Feather name="edit" size={12} color={AppColor.white} />
          </TouchableOpacity>
        </View>

        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            backgroundColor: "#F0F1F2",
          }}
        >
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
                style={[
                  styles.progressBarFill,
                  { width: `${progress * 100}%` },
                ]}
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
              label={displayContact}
              rightIcon={true}
              onPress={() => setUpdateContactModalVisible(true)}
            />
            <HR />
            <CustomProfileItem
              imageUri={require("../assets/images/location.png")}
              label={"My Address"}
              rightIcon={true}
              onPress={() => navigation.navigate("addressScreen")}
            />
          </View>
          {/* Favorite Food Trucks */}
          <TouchableOpacity
            style={styles.sectionHeaderRow}
            onPress={() => navigation.navigate("favoriteFoodTrucksScreen")}
          >
            <Text style={styles.sectionTitle}>FAVoRITE FooD TRUCKS</Text>
            <Entypo
              name="chevron-small-right"
              size={24}
              color={AppColor.black}
            />
          </TouchableOpacity>
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
        </View>
        {/* Media Picker Modal */}
        <MediaPickerDialog
          isVisible={modalVisible}
          onCameraPress={() => handleCameraPress()}
          onGalleryPress={() => handleGalleryPress()}
          onClosePress={onMediaModalClose}
        />

        {/* Update Name Modal */}
        <UpdateNameModal
          isVisible={updateNameModalVisible}
          value={editedName}
          onChangeText={setEditedName}
          onUpdate={handleUpdateName}
          onCancel={() => setUpdateNameModalVisible(false)}
        />

        {/* Update PhoneNo Modal */}
        <UpdateContactModal
          isVisible={updateContactModalVisible}
          countryCode={countryCode}
          onCountryCodePress={() => setCountryPickerVisible(true)}
          countryPickerVisible={countryPickerVisible}
          setCountryPickerVisible={setCountryPickerVisible}
          onCountrySelect={(item) => {
            setCountryCode(item.dial_code);
            setCountryPickerVisible(false);
          }}
          mobileNumber={mobileNumber}
          onMobileNumberChange={setMobileNumber}
          onUpdate={handleUpdateContact}
          onCancel={() => setUpdateContactModalVisible(false)}
          error={contactError}
        />

        {/* Logout Modal */}
        <LogoutModal
          isModalVisible={logoutModalVisible}
          onYesLogoutPress={handleLogout}
          onNoLogoutPress={() => setLogoutModalVisible(false)}
        />
      </ScrollView>
    </View>
  );
};

export default ProfileMenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  headerWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 32,
    paddingHorizontal: 8,
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
    right: Dimensions.get("window").width / 2 - 45,
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
  HR: {
    height: 1,
    backgroundColor: "#E5E5EA",
  },
});
