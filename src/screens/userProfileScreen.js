import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";
import { IconButton, Snackbar } from "react-native-paper";
import { RESULTS } from "react-native-permissions";
import ImagePicker from "react-native-image-crop-picker";

import {
  AppColor,
  Mulish400,
  Mulish500,
  Mulish600,
  Mulish700,
} from "../utils/theme";
import StatusBarManager from "../components/StatusBarManager";
import AppImage from "../components/AppImage";
import UpdateNameModal from "../components/UpdateNameModal";
import UpdateContactModal from "../components/UpdateContactModal";
import { setUser } from "../redux/slices/userSlice";
import {
  getUserDetail_API,
  updateUserDetail_API,
  uploadImage_API,
} from "../apiFolder/appAPI";
import usePermission from "../hooks/usePermission";
import { permission } from "../helpers/permission.helper";
import MediaPickerDialog from "../components/MediaPickerDialog";
import { addOrUpdateUser } from "../redux/slices/userInfoSlice";

const UserProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state) => state.userReducer);

  const { checkAndRequestPermission: photosPermissionStatus } = usePermission(
    permission.photos
  );
  const { checkAndRequestPermission: cameraPermissionStatus } = usePermission(
    permission.camera
  );

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [nameModalLoading, setNameModalLoading] = useState(false);
  const [contactModalLoading, setContactModalLoading] = useState(false);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  const [userPic, setUserPic] = useState(user?.profilePic || null);
  const [tempFirstName, setTempFirstName] = useState("");
  const [tempLastName, setTempLastName] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [mobileNumber, setMobileNumber] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [contactError, setContactError] = useState("");

  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "info",
  });

  useEffect(() => {
    if (user) {
      setUserPic(user.profilePic || null);
      setCountryCode(user.countryCode || "+1");
      setMobileNumber(user.mobileNumber || "");
      setTempFirstName(user.firstName || "");
      setTempLastName(user.lastName || "");
    }
  }, [user]);

  const fetchUserDataFromAPI = async () => {
    try {
      const response = await getUserDetail_API(user._id);
      if (response?.success && response.data) {
        const USER_DATA = response.data.user;
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
    }
  };

  const handleCameraPress = async () => {
    setMediaModalVisible(false);
    try {
      const cameraStatus = await cameraPermissionStatus();
      if (cameraStatus !== RESULTS.GRANTED) return;

      setTimeout(
        async () => {
          await ImagePicker.openCamera({
            mediaType: "photo",
            width: 500,
            height: 500,
          })
            .then(async (image) => {
              try {
                await uploadAndUpdateProfilePic({
                  uri: image?.path,
                  name: `${image?.path?.split("/").pop()}`, // did this because not able to get filename in ios
                  type: image.mime,
                });
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
    setMediaModalVisible(false);
    try {
      if (Platform.OS === "ios") {
        const photosStatus = await photosPermissionStatus();
        if (
          photosStatus !== RESULTS.GRANTED &&
          photosStatus !== RESULTS.LIMITED
        )
          return;
      }

      setTimeout(
        async () => {
          await ImagePicker.openPicker({
            mediaType: "photo",
            width: 500,
            height: 500,
          })
            .then(async (image) => {
              try {
                const payload =
                  Platform.OS == "ios"
                    ? {
                        uri: image?.sourceURL,
                        name: image?.filename,
                        type: image.mime,
                      }
                    : {
                        uri: image?.path,
                        name: `${image?.path?.split("/").pop()}`, // did this because in android > choose from gallary; not have filename
                        type: image.mime,
                      };
                await uploadAndUpdateProfilePic(payload);
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
      const formData = new FormData();
      formData.append("file", {
        uri: image?.uri,
        name: image?.name,
        type: image?.type,
      });

      const uploadResponse = await uploadImage_API(formData);

      if (uploadResponse?.success && uploadResponse?.data?.file) {
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
          await fetchUserDataFromAPI();
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

  const handleUpdateName = async () => {
    if (!tempFirstName.trim()) {
      setFirstNameError("First name is required");
      return;
    }

    if (!tempLastName.trim()) {
      setLastNameError("Last name is required");
      return;
    }

    setFirstNameError("");
    setLastNameError("");
    setNameModalLoading(true);

    try {
      const response = await updateUserDetail_API({
        user_id: user._id,
        payload: {
          firstName: tempFirstName.trim(),
          lastName: tempLastName.trim(),
        },
      });
      console.log("response =>", response.data);
      if (response?.success && response?.data) {
        // dispatch(setUser(response.data.user));
        setNameModalVisible(false);
        setSnackbar({
          visible: true,
          message: "Name updated successfully",
          type: "success",
        });
        await fetchUserDataFromAPI();
      } else {
        setSnackbar({
          visible: true,
          message: "Failed to update name",
          type: "error",
        });
      }
    } catch (error) {
      console.log("error => ", error);
      setSnackbar({
        visible: true,
        message: "Something went wrong",
        type: "error",
      });
    } finally {
      setNameModalLoading(false);
    }
  };

  const handleUpdateContact = async () => {
    if (!mobileNumber.trim()) {
      setContactError("Mobile number is required");
      return;
    }

    if (mobileNumber.length < 10) {
      setContactError("Please enter a valid mobile number");
      return;
    }

    setContactError("");
    setContactModalLoading(true);

    try {
      const response = await updateUserDetail_API({
        user_id: user._id,
        payload: {
          countryCode,
          mobileNumber: mobileNumber.trim(),
        },
      });

      if (response?.success && response?.data) {
        // dispatch(setUser(response.data.user));
        setContactModalVisible(false);
        setSnackbar({
          visible: true,
          message: "Contact updated successfully",
          type: "success",
        });
        await fetchUserDataFromAPI();
      } else {
        setSnackbar({
          visible: true,
          message: "Failed to update contact",
          type: "error",
        });
      }
    } catch (error) {
      console.log("error => ", error);
      setSnackbar({
        visible: true,
        message: "Something went wrong",
        type: "error",
      });
    } finally {
      setContactModalLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <StatusBarManager />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={{ width: "20%" }}>
            <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          </View>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: "20%" }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <AppImage
            uri={userPic}
            containerStyle={styles.profileImage}
            imageStyle={{ borderRadius: 75 }}
          />
          <TouchableOpacity
            style={styles.cameraButton}
            activeOpacity={0.7}
            onPress={() => setMediaModalVisible(true)}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator size="small" color={AppColor.white} />
            ) : (
              <Feather name="camera" size={18} color={AppColor.white} />
            )}
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>

          {/* Name */}
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color={AppColor.primary}
              />
              <Text style={styles.infoLabel}>Name</Text>
            </View>
            <View style={styles.infoContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {`${user?.firstName || ""} ${user?.lastName || ""}`}
                </Text>
              </View>
              <TouchableOpacity
                style={{ marginLeft: 10 }}
                activeOpacity={0.7}
                onPress={() => setNameModalVisible(true)}
              >
                <Feather name="edit" size={18} color={AppColor.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Email */}
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={AppColor.primary}
              />
              <Text style={styles.infoLabel}>Email</Text>
            </View>
            <View style={styles.infoContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoValue}>{user?.email || "N/A"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Phone */}
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Ionicons
                name="call-outline"
                size={20}
                color={AppColor.primary}
              />
              <Text style={styles.infoLabel}>Phone</Text>
            </View>
            <View style={styles.infoContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoValue}>
                  {`${user?.countryCode || ""} ${user?.mobileNumber || "N/A"}`}
                </Text>
              </View>
              <TouchableOpacity
                style={{ marginLeft: 10 }}
                activeOpacity={0.7}
                onPress={() => setContactModalVisible(true)}
              >
                <Feather name="edit" size={18} color={AppColor.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Account Status */}
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={AppColor.primary}
              />
              <Text style={styles.infoLabel}>Account Status</Text>
            </View>
            <View style={styles.infoContent}>
              <View
                style={[
                  styles.statusBadge,
                  user?.verified
                    ? styles.verifiedBadge
                    : styles.unverifiedBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    user?.verified
                      ? styles.verifiedText
                      : styles.unverifiedText,
                  ]}
                >
                  {user?.verified ? "Verified" : "Unverified"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Member Since */}
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={AppColor.primary}
              />
              <Text style={styles.infoLabel}>Member Since</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoValue}>
                {user?.createdAt ? formatDate(user.createdAt) : "N/A"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Media Picker Modal */}
      <MediaPickerDialog
        isVisible={mediaModalVisible}
        onCameraPress={() => handleCameraPress()}
        onGalleryPress={() => handleGalleryPress()}
        onClosePress={() => setMediaModalVisible(false)}
      />

      {/* Update Name Modal */}
      <UpdateNameModal
        isVisible={nameModalVisible}
        firstName={tempFirstName}
        lastName={tempLastName}
        onFirstNameChange={setTempFirstName}
        onLastNameChange={setTempLastName}
        onUpdate={handleUpdateName}
        onCancel={() => {
          setNameModalVisible(false);
          setFirstNameError("");
          setLastNameError("");
          setTempFirstName(user?.firstName || "");
          setTempLastName(user?.lastName || "");
        }}
        loading={nameModalLoading}
        firstNameError={firstNameError}
        lastNameError={lastNameError}
      />

      {/* Update Contact Modal */}
      <UpdateContactModal
        isVisible={contactModalVisible}
        countryCode={countryCode}
        onCountryCodePress={() => setCountryPickerVisible(true)}
        countryPickerVisible={countryPickerVisible}
        setCountryPickerVisible={setCountryPickerVisible}
        onCountrySelect={(country) => {
          setCountryCode(country.dial_code);
          setCountryPickerVisible(false);
        }}
        mobileNumber={mobileNumber}
        onMobileNumberChange={setMobileNumber}
        onUpdate={handleUpdateContact}
        onCancel={() => {
          setContactModalVisible(false);
          setContactError("");
        }}
        loading={contactModalLoading}
        error={contactError}
      />

      {/* Snackbar */}
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        style={{
          backgroundColor:
            snackbar.type === "success"
              ? AppColor.snackbarSuccess
              : snackbar.type === "error"
                ? AppColor.snackbarError
                : AppColor.snackbarInfo,
        }}
      >
        {snackbar.message}
      </Snackbar>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={AppColor.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: AppColor.border,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Mulish700,
    textAlign: "center",
    color: AppColor.text,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  profileImageContainer: {
    marginVertical: 20,
    alignSelf: "center",
    shadowColor: AppColor.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: AppColor.white,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: AppColor.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: AppColor.white,
  },
  card: {
    backgroundColor: AppColor.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: Mulish700,
    color: AppColor.text,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: Mulish500,
    color: AppColor.text,
  },
  infoContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  infoValue: {
    fontSize: 16,
    fontFamily: Mulish400,
    color: AppColor.subText,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: AppColor.borderColor,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedBadge: {
    backgroundColor: AppColor.lightGreenBG,
  },
  unverifiedBadge: {
    backgroundColor: AppColor.lightRedBG,
  },
  statusText: {
    fontSize: 14,
    fontFamily: Mulish600,
  },
  verifiedText: {
    color: AppColor.snackbarSuccess,
  },
  unverifiedText: {
    color: AppColor.snackbarError,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
});

export default UserProfileScreen;
