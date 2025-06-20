import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import { useDispatch, useSelector } from "react-redux";
import { onSignOut } from "../redux/slices/authSlice";
import usePermission from "../hooks/usePermission";
import ImagePicker from "react-native-image-crop-picker";
import { RESULTS } from "react-native-permissions";
import { permission } from "../utils/permissions";
import { clearUserSlice, setUser } from "../redux/slices/userSlice";
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
import {
  getUserDetail_API,
  updateUserDetail_API,
  uploadImage_API,
} from "../apiFolder/appAPI";
import { useFocusEffect } from "@react-navigation/native";
import { Snackbar, Portal } from "react-native-paper";
import { fetchFavorites } from "../redux/slices/favoritesSlice"; // Import fetchFavorites

const avatarImg = require("../assets/images/profileMenuActive.png");
const favTruck1 = require("../assets/images/FT-Demo-01.png");

const HR = () => <View style={styles.HR} />;

const ProfileMenuScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const { checkAndRequestPermission: photosPermissionStatus } = usePermission(
    permission.photos
  );
  const { checkAndRequestPermission: cameraPermissionStatus } = usePermission(
    permission.camera
  );

  const [getDataLoading, setGetDataLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [updateNameModalVisible, setUpdateNameModalVisible] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [updateContactModalVisible, setUpdateContactModalVisible] =
    useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "info",
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const { user } = useSelector((state) => state.userReducer);
  // Get favorites and loading/error states from Redux
  const {
    favorites,
    loading: loadingFavorites,
    error: favoritesError,
  } = useSelector((state) => state.favoritesReducer);
  const insets = useSafeAreaInsets();

  // Local state for name editing
  const [editedName, setEditedName] = useState(user?.firstName || "");
  const [displayName, setDisplayName] = useState(user?.firstName || "");
  const [nameError, setNameError] = useState("");

  // Local state for contact editing
  const [countryCode, setCountryCode] = useState(user?.countryCode || "+1");
  const [mobileNumber, setMobileNumber] = useState(
    user?.mobileNumber?.replace(/^\+\d+\s*/, "") || ""
  );
  const [displayContact, setDisplayContact] = useState(
    user?.countryCode + " " + user?.mobileNumber || "+1 000 000 0000"
  );
  const [contactError, setContactError] = useState("");

  const ordersCompleted = 5; // Static value, consider making this dynamic
  const totalOrders = 10; // Static value, consider making this dynamic
  const progress = ordersCompleted / totalOrders;

  const onMediaModalClose = () => {
    setModalVisible(false);
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
            cropping: true,
            mediaType: "photo",
            width: 500,
            height: 500,
          })
            .then(async (image) => {
              try {
                await uploadAndUpdateProfilePic(image);
              } catch (error) {
                console.log("error => ", error);
                setSnackbar({
                  visible: true,
                  message: error?.message || "Failed to upload image",
                  type: "error",
                });
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
    }
  };

  const handleGalleryPress = async () => {
    setModalVisible(false);
    try {
      const photosStatus = await photosPermissionStatus();
      if (photosStatus !== RESULTS.GRANTED && photosStatus !== RESULTS.LIMITED)
        return;

      setTimeout(
        async () => {
          await ImagePicker.openPicker({
            cropping: true,
            mediaType: "photo",
            width: 500,
            height: 500,
          })
            .then(async (image) => {
              try {
                await uploadAndUpdateProfilePic(image);
              } catch (error) {
                console.log("error => ", error);
                setSnackbar({
                  visible: true,
                  message: error?.message || "Failed to upload image",
                  type: "error",
                });
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
    }
  };

  const uploadAndUpdateProfilePic = async (image) => {
    setUploadingImage(true);
    try {
      // Create form data for image upload
      const formData = new FormData();
      formData.append("file", {
        uri: Platform.OS === "ios" ? image.sourceURL : image.path,
        type: image.mime,
        name: image.filename || `profile_${Date.now()}.jpg`,
      });

      // Upload image
      const uploadResponse = await uploadImage_API(formData);

      if (uploadResponse?.success && uploadResponse?.data?.file) {
        // Update user profile with the new image URL
        const updateResponse = await updateUserDetail_API({
          user_id: user._id,
          payload: { profilePic: uploadResponse.data.file },
        });

        if (updateResponse?.success) {
          setSnackbar({
            visible: true,
            message: "Profile picture updated successfully",
            type: "success",
          });
          // Refresh user data
          getUserDetailFromAPI();
        } else {
          throw new Error(
            updateResponse?.message || "Failed to update profile picture"
          );
        }
      } else {
        throw new Error(uploadResponse?.message || "Failed to upload image");
      }
    } catch (error) {
      console.log("Error uploading image:", error);
      setSnackbar({
        visible: true,
        message: error?.message || "Failed to update profile picture",
        type: "error",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const validateName = (name) => {
    if (!name || !name.trim()) {
      return "Name cannot be empty";
    }
    return "";
  };

  const handleUpdateName = async () => {
    const error = validateName(editedName);
    setNameError(error);
    if (error) {
      return;
    }

    try {
      const response = await updateUserDetail_API({
        user_id: user._id,
        payload: { firstName: editedName },
      });

      if (response?.success) {
        setDisplayName(editedName);
        setUpdateNameModalVisible(false);
        setSnackbar({
          visible: true,
          message: "Name updated successfully",
          type: "success",
        });
        // Refresh user data
        getUserDetailFromAPI();
      } else {
        setSnackbar({
          visible: true,
          message: response?.message || "Failed to update name",
          type: "error",
        });
      }
    } catch (error) {
      console.log("Error updating name:", error);
      setSnackbar({
        visible: true,
        message: error?.message || "Failed to update name",
        type: "error",
      });
    }
  };

  const validateMobileNumber = (value) => {
    if (!value) return "Mobile number is required";
    if (!/^\d{10}$/.test(value)) return "Enter a valid 10-digit mobile number";
    return "";
  };

  const handleUpdateContact = async () => {
    const error = validateMobileNumber(mobileNumber);
    if (error) {
      setContactError(error);
      setSnackbar({
        visible: true,
        message: error,
        type: "error",
      });
      return;
    }

    try {
      const response = await updateUserDetail_API({
        user_id: user._id,
        payload: {
          countryCode: countryCode,
          mobileNumber: mobileNumber,
        },
      });

      if (response?.success) {
        setDisplayContact(`${countryCode} ${mobileNumber}`);
        setUpdateContactModalVisible(false);
        setSnackbar({
          visible: true,
          message: "Contact updated successfully",
          type: "success",
        });
        // Refresh user data
        getUserDetailFromAPI();
      } else {
        setSnackbar({
          visible: true,
          message: response?.message || "Failed to update contact",
          type: "error",
        });
      }
    } catch (error) {
      console.log("Error updating contact:", error);
      setSnackbar({
        visible: true,
        message: error?.message || "Failed to update contact",
        type: "error",
      });
    }
  };

  const handleLogout = () => {
    dispatch(clearUserSlice());
    dispatch(onSignOut());
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
      }
    } catch (error) {
      console.log("error => ", error);
    } finally {
      setGetDataLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getUserDetailFromAPI();
      dispatch(fetchFavorites()); // Fetch favorites whenever the screen is focused
    }, [dispatch]) // Depend on dispatch
  );

  // Replace the static favoriteTrucks array with the dynamic data from Redux
  const renderFavoriteTrucks = () => {
    if (loadingFavorites) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={AppColor.primary} />
        </View>
      );
    }

    if (favoritesError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{favoritesError}</Text>
        </View>
      );
    }

    if (favorites.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No favorite trucks yet</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={favorites.slice(0, 2)} // Displaying only the first 2 favorites as per original code
        keyExtractor={(item) => item._id.toString()} // Use the favorite entry _id or foodTruck._id
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.favTruckRow}>
            <FastImage
              source={
                item.foodTruck?.logo ? { uri: item.foodTruck?.logo } : favTruck1
              }
              style={styles.favTruckImg}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.favTruckName}>{item.foodTruck?.name}</Text>
              <Text style={styles.favTruckReview}>
                ⭐ {item.foodTruck?.reviews || "0"} reviews -{" "}
                {(item.foodTruck?.distanceInMeters * 0.000621371).toFixed(2) +
                  " miles away" || "0 miles away"}
              </Text>
            </View>
          </View>
        )}
        ItemSeparatorComponent={<HR />}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.headerWrap}>
          <View style={{ width: 20 }} />
          <Text
            style={styles.profileTitle}
            onPress={() => getUserDetailFromAPI()}
          >
            PRoFILE
          </Text>
          <Entypo name="dots-three-vertical" size={20} color={AppColor.text} />
        </View>
        <View style={styles.avatarWrap}>
          <FastImage
            source={user?.profilePic ? { uri: user.profilePic } : avatarImg}
            style={styles.avatarImg}
          />
          <TouchableOpacity
            style={styles.cameraIcon}
            onPress={() => setModalVisible(true)}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator size="small" color={AppColor.white} />
            ) : (
              <MaterialIcons
                name="camera-alt"
                size={18}
                color={AppColor.white}
              />
            )}
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
            style={{ borderRadius: 10 }}
          >
            <View style={styles.dessertCard}>
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
            </View>
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
          <View style={styles.favTrucksCard}>{renderFavoriteTrucks()}</View>
          {/* Menu Items */}
          <View style={styles.infoCard}>
            <CustomProfileItem
              imageUri={require("../assets/images/lock.png")}
              label="Privacy Policy"
              rightIcon={true}
              onPress={() => navigation.navigate("privacyPolicy")}
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
          onChangeText={(text) => {
            setEditedName(text);
            setNameError(""); // Clear error when user types
          }}
          onUpdate={handleUpdateName}
          onCancel={() => {
            setUpdateNameModalVisible(false);
            setNameError(""); // Clear error when modal is closed
          }}
          error={nameError}
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
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: AppColor.snackbarError,
    fontFamily: Secondary400,
    fontSize: 14,
  },
  noDataContainer: {
    padding: 20,
    alignItems: "center",
  },
  noDataText: {
    color: AppColor.textHighlighter,
    fontFamily: Secondary400,
    fontSize: 14,
  },
});
