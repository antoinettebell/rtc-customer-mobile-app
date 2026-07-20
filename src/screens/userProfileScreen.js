import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";
import { IconButton, Snackbar } from "react-native-paper";
import { RESULTS } from "react-native-permissions";
import ImagePicker from "react-native-image-crop-picker";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

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
import Config from "../config/env";
import StatePickerModal from "../components/StatePickerModal";
import { parseUsAddressFromGooglePlace } from "../helpers/address.helper";

const GOOGLE_MAP_API_KEY = Config.GOOGLE_MAP_API_KEY;
const COORDINATOR_PAYMENT_OPTIONS = [
  { label: "None", value: "" },
  { label: "Cash App", value: "CASHAPP" },
  { label: "Zelle", value: "ZELLE" },
  { label: "PayPal", value: "PAYPAL" },
  { label: "Venmo", value: "VENMO" },
  { label: "Direct Deposit", value: "DIRECT_DEPOSIT" },
];

const trimAddressValue = (value) => String(value || "").trim();

const normalizeTaxIdType = (value) =>
  String(value || "").toUpperCase() === "SSN" ? "SSN" : "EIN";

const getTaxIdDisplayParts = (maskedValue, fallbackType = "EIN") => {
  const raw = trimAddressValue(maskedValue);
  const match = raw.match(/^(EIN|SSN)\s*:\s*(.+)$/i);
  return {
    type: normalizeTaxIdType(match?.[1] || fallbackType),
    masked: match?.[2]?.trim() || raw,
  };
};

const getLegacyCoordinatorAddress = (user = {}) => {
  const formattedAddress =
    user.eventCoordinatorFormattedAddress || user.eventCoordinatorCompanyAddress || "";
  const parts = String(formattedAddress)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const cityStateZip = parts.length >= 3 ? parts[parts.length - 2] : "";
  const cityStateZipMatch = cityStateZip.match(/^(.+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  const stateZip = parts.length >= 2 ? parts[parts.length - 1] : "";
  const stateZipMatch = stateZip.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);

  return {
    line1:
      user.eventCoordinatorAddressLine1 ||
      (parts.length > 1 ? parts[0] : formattedAddress) ||
      "",
    line2: user.eventCoordinatorAddressLine2 || "",
    city:
      user.eventCoordinatorAddressCity ||
      (cityStateZipMatch ? cityStateZipMatch[1] : parts.length >= 4 ? parts[1] : "") ||
      "",
    state:
      user.eventCoordinatorAddressState ||
      (cityStateZipMatch ? cityStateZipMatch[2] : stateZipMatch ? stateZipMatch[1] : "") ||
      "",
    zip:
      user.eventCoordinatorAddressZip ||
      (cityStateZipMatch ? cityStateZipMatch[3] : stateZipMatch ? stateZipMatch[2] : "") ||
      "",
    formattedAddress,
    placeId: user.eventCoordinatorPlaceId || "",
  };
};

const formatTaxIdInput = (value, type) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 9);
  if (normalizeTaxIdType(type) === "SSN") {
    return digits
      .replace(/^(\d{3})(\d)/, "$1-$2")
      .replace(/^(\d{3})-(\d{2})(\d)/, "$1-$2-$3");
  }
  return digits.replace(/^(\d{2})(\d)/, "$1-$2");
};

const maskAccountNumber = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
};

const isMaskedAccountNumber = (value) => /^\*+\d{4}$/.test(String(value || ""));

const UserProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state) => state.userReducer);
  const coordinatorAddressRef = useRef(null);

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
  const [isEventCoordinator, setIsEventCoordinator] = useState(
    !!user?.isEventCoordinator
  );
  const [eventCoordinatorCompanyName, setEventCoordinatorCompanyName] =
    useState(user?.eventCoordinatorCompanyName || "");
  const initialCoordinatorTax = getTaxIdDisplayParts(
    user?.eventCoordinatorTaxIdMasked,
    user?.eventCoordinatorTaxIdType
  );
  const initialCoordinatorAddress = getLegacyCoordinatorAddress(user);
  const [eventCoordinatorTaxIdType, setEventCoordinatorTaxIdType] = useState(
    initialCoordinatorTax.type
  );
  const [eventCoordinatorTaxId, setEventCoordinatorTaxId] = useState("");
  const [eventCoordinatorTaxIdMasked, setEventCoordinatorTaxIdMasked] = useState(
    initialCoordinatorTax.masked
  );
  const [eventCoordinatorAddressLine1, setEventCoordinatorAddressLine1] =
    useState(initialCoordinatorAddress.line1);
  const [eventCoordinatorAddressLine2, setEventCoordinatorAddressLine2] =
    useState(initialCoordinatorAddress.line2);
  const [eventCoordinatorAddressCity, setEventCoordinatorAddressCity] =
    useState(initialCoordinatorAddress.city);
  const [eventCoordinatorAddressState, setEventCoordinatorAddressState] =
    useState(initialCoordinatorAddress.state);
  const [eventCoordinatorAddressZip, setEventCoordinatorAddressZip] =
    useState(initialCoordinatorAddress.zip);
  const [eventCoordinatorFormattedAddress, setEventCoordinatorFormattedAddress] =
    useState(initialCoordinatorAddress.formattedAddress);
  const [eventCoordinatorPlaceId, setEventCoordinatorPlaceId] = useState(
    initialCoordinatorAddress.placeId
  );
  const [eventCoordinatorPaymentPreference, setEventCoordinatorPaymentPreference] =
    useState(user?.eventCoordinatorPaymentPreference || "");
  const [eventCoordinatorPaymentHandle, setEventCoordinatorPaymentHandle] =
    useState(user?.eventCoordinatorPaymentHandle || "");
  const [eventCoordinatorPaymentQrCodeUrl, setEventCoordinatorPaymentQrCodeUrl] =
    useState(user?.eventCoordinatorPaymentQrCodeUrl || "");
  const [
    eventCoordinatorDirectDepositRoutingNumber,
    setEventCoordinatorDirectDepositRoutingNumber,
  ] = useState(user?.eventCoordinatorDirectDepositRoutingNumber || "");
  const [
    eventCoordinatorDirectDepositAccountNumber,
    setEventCoordinatorDirectDepositAccountNumber,
  ] = useState(user?.eventCoordinatorDirectDepositAccountNumberMasked || "");
  const [uploadingCoordinatorQr, setUploadingCoordinatorQr] = useState(false);
  const [coordinatorLoading, setCoordinatorLoading] = useState(false);
  const [coordinatorError, setCoordinatorError] = useState("");
  const [isCoordinatorPayoutEditing, setIsCoordinatorPayoutEditing] = useState(
    !user?.eventCoordinatorPaymentPreference
  );

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
      setIsEventCoordinator(!!user.isEventCoordinator);
      setEventCoordinatorCompanyName(user.eventCoordinatorCompanyName || "");
      const coordinatorTax = getTaxIdDisplayParts(
        user.eventCoordinatorTaxIdMasked,
        user.eventCoordinatorTaxIdType
      );
      const coordinatorAddress = getLegacyCoordinatorAddress(user);
      setEventCoordinatorTaxIdType(coordinatorTax.type);
      setEventCoordinatorTaxId("");
      setEventCoordinatorTaxIdMasked(coordinatorTax.masked);
      setEventCoordinatorAddressLine1(coordinatorAddress.line1);
      setEventCoordinatorAddressLine2(coordinatorAddress.line2);
      setEventCoordinatorAddressCity(coordinatorAddress.city);
      setEventCoordinatorAddressState(coordinatorAddress.state);
      setEventCoordinatorAddressZip(coordinatorAddress.zip);
      setEventCoordinatorFormattedAddress(coordinatorAddress.formattedAddress);
      setEventCoordinatorPlaceId(coordinatorAddress.placeId);
      setEventCoordinatorPaymentPreference(
        user.eventCoordinatorPaymentPreference || ""
      );
      setEventCoordinatorPaymentHandle(user.eventCoordinatorPaymentHandle || "");
      setEventCoordinatorPaymentQrCodeUrl(
        user.eventCoordinatorPaymentQrCodeUrl || ""
      );
      setEventCoordinatorDirectDepositRoutingNumber(
        user.eventCoordinatorDirectDepositRoutingNumber || ""
      );
      setEventCoordinatorDirectDepositAccountNumber(
        user.eventCoordinatorDirectDepositAccountNumberMasked || ""
      );
      setIsCoordinatorPayoutEditing(!user.eventCoordinatorPaymentPreference);
      coordinatorAddressRef.current?.setAddressText(coordinatorAddress.line1);
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

  const promptEnableEventCoordinator = () => {
    Alert.alert(
      "Add Event Coordination?",
      "Would you like to add event coordination? If Yes, please have your company name and EIN/SSN ready for input.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => setIsEventCoordinator(true) },
      ]
    );
  };

  const resetCoordinatorPayoutFromUser = () => {
    setEventCoordinatorPaymentPreference(
      user?.eventCoordinatorPaymentPreference || ""
    );
    setEventCoordinatorPaymentHandle(user?.eventCoordinatorPaymentHandle || "");
    setEventCoordinatorPaymentQrCodeUrl(
      user?.eventCoordinatorPaymentQrCodeUrl || ""
    );
    setEventCoordinatorDirectDepositRoutingNumber(
      user?.eventCoordinatorDirectDepositRoutingNumber || ""
    );
    setEventCoordinatorDirectDepositAccountNumber(
      user?.eventCoordinatorDirectDepositAccountNumberMasked || ""
    );
  };

  const saveCoordinatorProfile = async () => {
    if (isEventCoordinator) {
      if (!eventCoordinatorCompanyName.trim()) {
        setCoordinatorError("Company name is required");
        return;
      }
      if (!eventCoordinatorTaxId.trim() && !eventCoordinatorTaxIdMasked) {
        setCoordinatorError(`${eventCoordinatorTaxIdType} is required`);
        return;
      }
      if (
        eventCoordinatorTaxId.trim() &&
        eventCoordinatorTaxId.replace(/\D/g, "").length !== 9
      ) {
        setCoordinatorError(`${eventCoordinatorTaxIdType} must be 9 digits`);
        return;
      }
      if (!eventCoordinatorAddressLine1.trim()) {
        setCoordinatorError("Street address is required");
        return;
      }
      if (!eventCoordinatorAddressCity.trim()) {
        setCoordinatorError("City is required");
        return;
      }
      if (!eventCoordinatorAddressState.trim()) {
        setCoordinatorError("State is required");
        return;
      }
      if (!eventCoordinatorAddressZip.trim()) {
        setCoordinatorError("Zip is required");
        return;
      }
      if (eventCoordinatorPaymentPreference === "DIRECT_DEPOSIT") {
        if (!eventCoordinatorDirectDepositRoutingNumber.trim()) {
          setCoordinatorError("Routing number is required for direct deposit");
          return;
        }
        if (!eventCoordinatorDirectDepositAccountNumber.trim()) {
          setCoordinatorError("Account number is required for direct deposit");
          return;
        }
      } else if (
        eventCoordinatorPaymentPreference &&
        !eventCoordinatorPaymentQrCodeUrl
      ) {
        setCoordinatorError("Upload the QR code for your selected payment method");
        return;
      }
    }

    setCoordinatorError("");
    setCoordinatorLoading(true);
    try {
      const response = await updateUserDetail_API({
        user_id: user._id,
        payload: {
          isEventCoordinator,
          eventCoordinatorCompanyName: eventCoordinatorCompanyName.trim(),
          eventCoordinatorCompanyAddress:
            trimAddressValue(eventCoordinatorFormattedAddress) ||
            [
              eventCoordinatorAddressLine1,
              eventCoordinatorAddressLine2,
              eventCoordinatorAddressCity,
              eventCoordinatorAddressState,
              eventCoordinatorAddressZip,
            ]
              .filter(Boolean)
              .join(", "),
          eventCoordinatorTaxIdType,
          ...(eventCoordinatorTaxId.trim()
            ? { eventCoordinatorTaxId: eventCoordinatorTaxId.replace(/\D/g, "") }
            : {}),
          eventCoordinatorAddressLine1: trimAddressValue(eventCoordinatorAddressLine1),
          eventCoordinatorAddressLine2: trimAddressValue(eventCoordinatorAddressLine2),
          eventCoordinatorAddressCity: trimAddressValue(eventCoordinatorAddressCity),
          eventCoordinatorAddressState: trimAddressValue(eventCoordinatorAddressState).toUpperCase(),
          eventCoordinatorAddressZip: trimAddressValue(eventCoordinatorAddressZip),
          eventCoordinatorFormattedAddress: trimAddressValue(eventCoordinatorFormattedAddress),
          eventCoordinatorPlaceId,
          eventCoordinatorPaymentPreference:
            eventCoordinatorPaymentPreference || null,
          eventCoordinatorPaymentHandle:
            eventCoordinatorPaymentPreference &&
            eventCoordinatorPaymentPreference !== "DIRECT_DEPOSIT"
              ? eventCoordinatorPaymentHandle.trim() || null
              : null,
          eventCoordinatorPaymentQrCodeUrl:
            eventCoordinatorPaymentPreference &&
            eventCoordinatorPaymentPreference !== "DIRECT_DEPOSIT"
              ? eventCoordinatorPaymentQrCodeUrl || null
              : null,
          eventCoordinatorDirectDepositRoutingNumber:
            eventCoordinatorPaymentPreference === "DIRECT_DEPOSIT"
              ? eventCoordinatorDirectDepositRoutingNumber.trim()
              : null,
          ...(eventCoordinatorPaymentPreference === "DIRECT_DEPOSIT" &&
          !isMaskedAccountNumber(eventCoordinatorDirectDepositAccountNumber)
            ? {
                eventCoordinatorDirectDepositAccountNumber:
                  eventCoordinatorDirectDepositAccountNumber.replace(/\D/g, ""),
              }
            : {}),
        },
      });

      if (response?.success) {
        setSnackbar({
          visible: true,
          message: isEventCoordinator
            ? "Event coordination profile updated"
            : "Event coordination removed from your profile",
          type: "success",
        });
        setIsCoordinatorPayoutEditing(!isEventCoordinator);
        await fetchUserDataFromAPI();
      }
    } catch (error) {
      setSnackbar({
        visible: true,
        message: error?.message || "Failed to update event coordination",
        type: "error",
      });
    } finally {
      setCoordinatorLoading(false);
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

  const handlePickCoordinatorPaymentQr = async () => {
    try {
      if (Platform.OS === "ios") {
        const photosStatus = await photosPermissionStatus();
        if (
          photosStatus !== RESULTS.GRANTED &&
          photosStatus !== RESULTS.LIMITED
        ) {
          return;
        }
      }

      const image = await ImagePicker.openPicker({
        multiple: false,
        mediaType: "photo",
      });
      const payload =
        Platform.OS === "ios"
          ? {
              uri: image?.sourceURL || image?.path,
              name: image?.filename || `coordinator-payment-${Date.now()}.jpg`,
              type: image.mime,
            }
          : {
              uri: image?.path,
              name: `${image?.path?.split("/").pop()}`,
              type: image.mime,
            };

      setUploadingCoordinatorQr(true);
      const formData = new FormData();
      formData.append("file", {
        uri: payload.uri,
        name: payload.name,
        type: payload.type,
      });
      const uploadResponse = await uploadImage_API(formData);
      if (uploadResponse?.success && uploadResponse?.data?.file) {
        setEventCoordinatorPaymentQrCodeUrl(uploadResponse.data.file);
        setSnackbar({
          visible: true,
          message: "Coordinator payment QR selected. Save profile to keep it.",
          type: "success",
        });
      } else {
        throw new Error(uploadResponse?.message || "Failed to upload QR code");
      }
    } catch (error) {
      if (error?.code !== "E_PICKER_CANCELLED") {
        setSnackbar({
          visible: true,
          message: error?.message || "Failed to upload QR code",
          type: "error",
        });
      }
    } finally {
      setUploadingCoordinatorQr(false);
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

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Ionicons
                name="briefcase-outline"
                size={20}
                color={AppColor.primary}
              />
              <Text style={styles.infoLabel}>Event Coordinator</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.coordinatorToggle}
              onPress={() =>
                isEventCoordinator
                  ? setIsEventCoordinator(false)
                  : promptEnableEventCoordinator()
              }
            >
              <Ionicons
                name={isEventCoordinator ? "checkbox" : "square-outline"}
                size={24}
                color={AppColor.primary}
              />
              <Text style={styles.coordinatorToggleText}>
                {isEventCoordinator ? "Enabled" : "Disabled"}
              </Text>
            </TouchableOpacity>
          </View>

          {isEventCoordinator ? (
            <View style={styles.coordinatorBox}>
              <Text style={styles.coordinatorHelpText}>
                Company name, protected federal tax ID, and address are required for event coordination access.
              </Text>
              <TextInput
                value={eventCoordinatorCompanyName}
                onChangeText={setEventCoordinatorCompanyName}
                placeholder="Company Name *"
                placeholderTextColor={AppColor.placeholderTextColor}
                style={styles.coordinatorInput}
              />
              <View style={styles.taxTypeRow}>
                {["EIN", "SSN"].map((type) => {
                  const active = eventCoordinatorTaxIdType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      activeOpacity={0.7}
                      style={[styles.taxTypeButton, active && styles.taxTypeButtonActive]}
                      onPress={() => {
                        setEventCoordinatorTaxIdType(type);
                        setEventCoordinatorTaxId("");
                      }}
                    >
                      <Text style={[styles.taxTypeText, active && styles.taxTypeTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {eventCoordinatorTaxIdMasked ? (
                <Text style={styles.coordinatorHelpText}>
                  Current federal tax ID: {eventCoordinatorTaxIdType} ending in{" "}
                  {eventCoordinatorTaxIdMasked.slice(-4)}
                </Text>
              ) : null}
              <TextInput
                value={eventCoordinatorTaxId}
                onChangeText={(value) =>
                  setEventCoordinatorTaxId(formatTaxIdInput(value, eventCoordinatorTaxIdType))
                }
                placeholder={
                  eventCoordinatorTaxIdMasked
                    ? `Enter new ${eventCoordinatorTaxIdType} to replace`
                    : `${eventCoordinatorTaxIdType} number *`
                }
                placeholderTextColor={AppColor.placeholderTextColor}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={eventCoordinatorTaxIdType === "SSN" ? 11 : 10}
                style={styles.coordinatorInput}
              />
              <View style={styles.placesWrapper}>
                <GooglePlacesAutocomplete
                  ref={coordinatorAddressRef}
                  placeholder="Street Address *"
                  fetchDetails
                  debounce={250}
                  enablePoweredByContainer={false}
                  predefinedPlaces={[]}
                  keyboardShouldPersistTaps="always"
                  minLength={2}
                  timeout={20000}
                  onPress={(data, details) => {
                    if (!details) return;
                    const address = parseUsAddressFromGooglePlace({ data, details });
                    setEventCoordinatorAddressLine1(address.line1);
                    setEventCoordinatorAddressCity(address.city);
                    setEventCoordinatorAddressState(address.state);
                    setEventCoordinatorAddressZip(address.zip);
                    setEventCoordinatorFormattedAddress(address.formattedAddress);
                    setEventCoordinatorPlaceId(address.placeId);
                    coordinatorAddressRef.current?.setAddressText(address.line1);
                  }}
                  onFail={(error) => {
                    console.log("Google Places coordinator profile address error", error);
                  }}
                  query={{
                    key: GOOGLE_MAP_API_KEY,
                    language: "en",
                    types: "geocode|establishment",
                    components: "country:us",
                  }}
                  textInputProps={{
                    value: eventCoordinatorAddressLine1,
                    placeholderTextColor: AppColor.placeholderTextColor,
                    returnKeyType: "search",
                    onChangeText: (value) => {
                      setEventCoordinatorAddressLine1(value);
                      setEventCoordinatorFormattedAddress("");
                      setEventCoordinatorPlaceId("");
                    },
                  }}
                  styles={{
                    container: styles.placesContainer,
                    textInputContainer: styles.placesTextInputContainer,
                    textInput: styles.placesTextInput,
                    listView: styles.placesListView,
                    row: styles.placesRow,
                    description: styles.placesDescription,
                    separator: styles.placesSeparator,
                  }}
                />
              </View>
              <TextInput
                value={eventCoordinatorAddressLine2}
                onChangeText={setEventCoordinatorAddressLine2}
                placeholder="Address Line 2"
                placeholderTextColor={AppColor.placeholderTextColor}
                style={styles.coordinatorInput}
              />
              <TextInput
                value={eventCoordinatorAddressCity}
                onChangeText={setEventCoordinatorAddressCity}
                placeholder="City *"
                placeholderTextColor={AppColor.placeholderTextColor}
                style={styles.coordinatorInput}
              />
              <StatePickerModal
                value={eventCoordinatorAddressState}
                onChange={setEventCoordinatorAddressState}
              />
              <TextInput
                value={eventCoordinatorAddressZip}
                onChangeText={setEventCoordinatorAddressZip}
                placeholder="Zip *"
                placeholderTextColor={AppColor.placeholderTextColor}
                keyboardType="number-pad"
                style={styles.coordinatorInput}
              />
              <Text style={styles.coordinatorSectionTitle}>
                Coordinator Payout
              </Text>
              {user?.eventCoordinatorPaymentPreference ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.payoutEditButton}
                  onPress={() =>
                    setIsCoordinatorPayoutEditing((current) => {
                      if (current) {
                        resetCoordinatorPayoutFromUser();
                      }
                      return !current;
                    })
                  }
                >
                  <Feather
                    name={isCoordinatorPayoutEditing ? "x" : "edit"}
                    size={16}
                    color={AppColor.primary}
                  />
                  <Text style={styles.payoutEditText}>
                    {isCoordinatorPayoutEditing ? "Cancel Edit" : "Edit Payout"}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <Text style={styles.coordinatorHelpText}>
                This is private profile information for RTC payout processing only.
              </Text>
              <View style={styles.paymentOptionWrap}>
                {COORDINATOR_PAYMENT_OPTIONS.map((option) => {
                  const active = eventCoordinatorPaymentPreference === option.value;
                  const disabled =
                    !isCoordinatorPayoutEditing &&
                    !!user?.eventCoordinatorPaymentPreference;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      activeOpacity={0.7}
                      style={[
                        styles.paymentOptionChip,
                        active && styles.paymentOptionChipActive,
                        disabled && !active && styles.paymentOptionChipDisabled,
                      ]}
                      disabled={disabled}
                      onPress={() => {
                        setEventCoordinatorPaymentPreference(option.value);
                        if (!option.value) {
                          setEventCoordinatorPaymentHandle("");
                          setEventCoordinatorPaymentQrCodeUrl("");
                          setEventCoordinatorDirectDepositRoutingNumber("");
                          setEventCoordinatorDirectDepositAccountNumber("");
                        } else if (option.value === "DIRECT_DEPOSIT") {
                          setEventCoordinatorPaymentHandle("");
                          setEventCoordinatorPaymentQrCodeUrl("");
                        } else {
                          setEventCoordinatorDirectDepositRoutingNumber("");
                          setEventCoordinatorDirectDepositAccountNumber("");
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.paymentOptionText,
                          active && styles.paymentOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {eventCoordinatorPaymentPreference === "DIRECT_DEPOSIT" ? (
                <>
                  <TextInput
                    value={eventCoordinatorDirectDepositRoutingNumber}
                    editable={isCoordinatorPayoutEditing}
                    onChangeText={(value) =>
                      setEventCoordinatorDirectDepositRoutingNumber(
                        value.replace(/\D/g, "").slice(0, 9)
                      )
                    }
                    placeholder="Routing Number *"
                    placeholderTextColor={AppColor.placeholderTextColor}
                    keyboardType="number-pad"
                    style={styles.coordinatorInput}
                  />
                  <TextInput
                    value={eventCoordinatorDirectDepositAccountNumber}
                    editable={isCoordinatorPayoutEditing}
                    onChangeText={(value) =>
                      setEventCoordinatorDirectDepositAccountNumber(
                        value.replace(/\D/g, "").slice(0, 17)
                      )
                    }
                    placeholder={
                      isMaskedAccountNumber(
                        eventCoordinatorDirectDepositAccountNumber
                      )
                        ? "Enter new account number to replace"
                        : "Account Number *"
                    }
                    placeholderTextColor={AppColor.placeholderTextColor}
                    keyboardType="number-pad"
                    secureTextEntry={
                      !isMaskedAccountNumber(
                        eventCoordinatorDirectDepositAccountNumber
                      )
                    }
                    style={styles.coordinatorInput}
                  />
                  {isMaskedAccountNumber(
                    eventCoordinatorDirectDepositAccountNumber
                  ) ? (
                    <Text style={styles.coordinatorHelpText}>
                      Current account ending in{" "}
                      {eventCoordinatorDirectDepositAccountNumber.slice(-4)}
                    </Text>
                  ) : null}
                </>
              ) : eventCoordinatorPaymentPreference ? (
                <>
                  <TextInput
                    value={eventCoordinatorPaymentHandle}
                    editable={isCoordinatorPayoutEditing}
                    onChangeText={setEventCoordinatorPaymentHandle}
                    placeholder="Payment Handle"
                    placeholderTextColor={AppColor.placeholderTextColor}
                    style={styles.coordinatorInput}
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.qrUploadButton}
                    disabled={uploadingCoordinatorQr || !isCoordinatorPayoutEditing}
                    onPress={handlePickCoordinatorPaymentQr}
                  >
                    {uploadingCoordinatorQr ? (
                      <ActivityIndicator size="small" color={AppColor.primary} />
                    ) : (
                      <Ionicons
                        name={
                          eventCoordinatorPaymentQrCodeUrl
                            ? "checkmark-circle-outline"
                            : "qr-code-outline"
                        }
                        size={20}
                        color={AppColor.primary}
                      />
                    )}
                    <Text style={styles.qrUploadText}>
                      {eventCoordinatorPaymentQrCodeUrl
                        ? "Payment QR Selected"
                        : "Upload Payment QR Code *"}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          ) : null}

          {coordinatorError ? (
            <Text style={styles.errorText}>{coordinatorError}</Text>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.coordinatorSaveButton}
            disabled={coordinatorLoading}
            onPress={saveCoordinatorProfile}
          >
            {coordinatorLoading ? (
              <ActivityIndicator size="small" color={AppColor.white} />
            ) : (
              <Text style={styles.coordinatorSaveText}>Save Event Coordination</Text>
            )}
          </TouchableOpacity>

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
  coordinatorToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coordinatorToggleText: {
    fontSize: 14,
    fontFamily: Mulish600,
    color: AppColor.primary,
  },
  coordinatorBox: {
    gap: 10,
    paddingVertical: 10,
  },
  coordinatorHelpText: {
    fontSize: 13,
    fontFamily: Mulish400,
    color: AppColor.subText,
  },
  coordinatorSectionTitle: {
    fontSize: 15,
    fontFamily: Mulish700,
    color: AppColor.text,
    marginTop: 6,
  },
  coordinatorInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.text,
    textAlignVertical: "center",
  },
  taxTypeRow: {
    flexDirection: "row",
    gap: 8,
  },
  taxTypeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 8,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColor.white,
  },
  taxTypeButtonActive: {
    borderColor: AppColor.primary,
    backgroundColor: "#FFF1E6",
  },
  taxTypeText: {
    fontFamily: Mulish600,
    color: AppColor.textHighlighter,
  },
  taxTypeTextActive: {
    color: AppColor.primary,
  },
  paymentOptionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paymentOptionChip: {
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: AppColor.white,
  },
  paymentOptionChipActive: {
    borderColor: AppColor.primary,
    backgroundColor: "#FFF1E6",
  },
  paymentOptionChipDisabled: {
    opacity: 0.45,
  },
  paymentOptionText: {
    fontSize: 13,
    fontFamily: Mulish600,
    color: AppColor.text,
  },
  paymentOptionTextActive: {
    color: AppColor.primary,
  },
  qrUploadButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: AppColor.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: AppColor.white,
  },
  qrUploadText: {
    fontSize: 14,
    fontFamily: Mulish700,
    color: AppColor.primary,
  },
  payoutEditButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    paddingVertical: 6,
  },
  payoutEditText: {
    color: AppColor.primary,
    fontFamily: Mulish700,
    fontSize: 14,
  },
  placesWrapper: {
    zIndex: 10,
  },
  placesContainer: {
    flex: 0,
  },
  placesTextInputContainer: {
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 8,
    backgroundColor: AppColor.white,
  },
  placesTextInput: {
    minHeight: 48,
    height: 48,
    margin: 0,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.text,
    backgroundColor: AppColor.white,
    borderRadius: 8,
    textAlignVertical: "center",
  },
  placesListView: {
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: AppColor.white,
    zIndex: 20,
    elevation: 4,
  },
  placesRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  placesDescription: {
    fontFamily: Mulish400,
    fontSize: 13,
    color: AppColor.text,
  },
  placesSeparator: {
    height: 1,
    backgroundColor: AppColor.borderColor,
  },
  coordinatorSaveButton: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    marginVertical: 12,
  },
  coordinatorSaveText: {
    color: AppColor.white,
    fontFamily: Mulish700,
    fontSize: 14,
  },
  errorText: {
    color: AppColor.snackbarError,
    fontFamily: Mulish400,
    fontSize: 13,
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
