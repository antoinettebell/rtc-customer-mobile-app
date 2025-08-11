import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  TextInput,
  IconButton,
  HelperText,
  Portal,
  Snackbar,
  ActivityIndicator,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CountryPicker } from "react-native-country-codes-picker";
import AntDesign from "react-native-vector-icons/AntDesign";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import ImagePicker from "react-native-image-crop-picker";
import { AppColor, Mulish700, Mulish400 } from "../utils/theme";
import { emailRegex, passwordRegex } from "../utils/constants";
import { register_API } from "../apiFolder/authAPI";
import StatusBarManager from "../components/StatusBarManager";
import { useSelector } from "react-redux";
import MediaPickerDialog from "../components/MediaPickerDialog";
import usePermission from "../hooks/usePermission";
import { permission } from "../helpers/permission.helper";
import { RESULTS } from "react-native-permissions";
import AppImage from "../components/AppImage";

const SignupScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const { allSigninUsers } = useSelector((state) => state.userInfoReducer);
  const { checkAndRequestPermission: photosPermissionStatus } = usePermission(
    permission.photos
  );
  const { checkAndRequestPermission: cameraPermissionStatus } = usePermission(
    permission.camera
  );

  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fnameRef = useRef(null);
  const lnameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const mobileNumberRef = useRef(null);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [countryCode, setCountryCode] = useState("+1");
  const [mobileNumber, setMobileNumber] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "info",
  });
  const [errors, setErrors] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
    mobileNumber: "",
  });

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const resetStates = () => {
    setFname("");
    setLname("");
    setEmail("");
    setPassword("");
    setPasswordVisible(false);
    setCountryPickerVisible(false);
    setCountryCode("+1");
    setMobileNumber("");
    setAgreed(false);
    setErrors({
      fname: "",
      lname: "",
      email: "",
      password: "",
      mobileNumber: "",
    });
    const [loading, setLoading] = useState(false);
  };

  // Validation functions
  const validateName = (value) => {
    if (!value.trim()) return "Name is required";
    return "";
  };

  const validateEmail = (value) => {
    if (!value.trim()) return "Email is required";
    if (!emailRegex.test(value)) return "Enter a valid email!";
    return "";
  };

  const validatePassword = (value) => {
    if (!value.trim()) return "Password is required";
    if (!passwordRegex.test(value)) {
      return "Password must be 8–15 chars with 1 uppercase, 1 lowercase, 1 number, and 1 special char.";
    }
    return "";
  };

  const validateMobileNumber = (value) => {
    if (!value.trim()) return "Mobile number is required";
    if (value.length < 10) return "Enter a valid 10-digit number";
    return "";
  };

  const validateForm = () => {
    const newErrors = {
      fname: validateName(fname),
      lname: validateName(lname),
      email: validateEmail(email),
      password: validatePassword(password),
      mobileNumber: validateMobileNumber(mobileNumber),
    };

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    if (!agreed) {
      setErrors((prev) => ({ ...prev, agreed: "You must agree to the terms" }));
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("firstName", fname);
      formData.append("lastName", lname);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("countryCode", countryCode);
      formData.append("mobileNumber", mobileNumber);

      if (selectedPhoto) {
        formData.append("file", {
          uri: selectedPhoto.uri,
          name: selectedPhoto.name,
          type: selectedPhoto.type,
        });
      }

      const response = await register_API({ payload: formData });
      console.log("Response => ", response);
      if (response.success && response.data) {
        navigation.navigate("otpVerification", {
          verificationFor: "sign-up",
          data: { ...response.data, localPassword: password },
          nextScreen: "",
        });
      }
    } catch (error) {
      console.log("Error => ", error);
      setSnackbar({
        visible: true,
        message: error.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSigninPress = () => {
    if (allSigninUsers?.length > 0) {
      navigation.navigate("oneTapSignin");
    } else {
      navigation.navigate("signin");
    }
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
              const imagedata = {
                uri: image?.path,
                name: `${image?.path?.split("/").pop()}`, // did this because not able to get filename in ios
                type: image.mime,
              };
              setSelectedPhoto(imagedata);
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
            mediaType: "photo",
          })
            .then((images) => {
              const payload =
                Platform.OS == "ios"
                  ? {
                      uri: images?.sourceURL,
                      name: images?.filename,
                      type: images.mime,
                    }
                  : {
                      uri: images?.path,
                      name: `${images?.path?.split("/").pop()}`, // did this because in android > choose from gallary; not have filename
                      type: images.mime,
                    };
              setSelectedPhoto(payload);
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

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBarManager barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <IconButton
          icon="arrow-left"
          iconColor={AppColor.white}
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>Sign Up</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        enabled={Platform.OS === "ios"}
        behavior="padding"
        style={{
          flex: 1,
          marginBottom: -insets.bottom,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: insets.bottom + 20,
          }}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          pointerEvents={loading ? "none" : "auto"}
        >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/images/AppLogo.png")}
                style={{ height: 104, width: 104 }}
              />
            </View>

            {/* Sign In Form */}
            <Text style={styles.title}>{"Sign Up"}</Text>
            <Text style={styles.subtitle}>
              {"Create new customer account!"}
            </Text>

            <View style={styles.formContainer}>
              {/* profile-photo */}
              <View style={{ alignSelf: "center" }}>
                {selectedPhoto?.uri ? (
                  <View
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: 70,
                      overflow: "hidden",
                    }}
                  >
                    <AppImage
                      uri={selectedPhoto?.uri}
                      containerStyle={{ width: "100%", height: "100%" }}
                    />
                  </View>
                ) : (
                  <View
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: 70,
                      marginTop: 10,
                      backgroundColor: AppColor.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FontAwesome6
                      name="user"
                      color={AppColor.white}
                      size={50}
                    />
                  </View>
                )}
                <IconButton
                  icon="camera"
                  iconColor={AppColor.white}
                  size={18}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    backgroundColor: AppColor.primaryLight,
                  }}
                  onPress={() => setModalVisible(true)}
                />
              </View>

              {/* full-name */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  gap: 12,
                  marginTop: 16,
                }}
              >
                {/* fname */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{"First Name*"}</Text>
                  <TextInput
                    dense
                    value={fname}
                    ref={fnameRef}
                    onChangeText={setFname}
                    style={styles.input}
                    contentStyle={styles.inputText}
                    placeholder=""
                    mode="outlined"
                    outlineColor={
                      errors.fname ? AppColor.error : AppColor.border
                    }
                    activeOutlineColor={AppColor.primary}
                    outlineStyle={{ borderRadius: 8 }}
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => lnameRef.current?.focus()}
                    theme={{ colors: { onSurfaceVariant: "#777" } }}
                    onBlur={() =>
                      setErrors((prev) => ({
                        ...prev,
                        fname: validateName(fname),
                      }))
                    }
                  />
                  {errors.fname ? (
                    <HelperText
                      type="error"
                      visible={!!errors.fname}
                      style={styles.helper}
                    >
                      {errors.fname}
                    </HelperText>
                  ) : null}
                </View>
                {/* lname */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{"Last Name*"}</Text>
                  <TextInput
                    dense
                    value={lname}
                    ref={lnameRef}
                    onChangeText={setLname}
                    style={styles.input}
                    contentStyle={styles.inputText}
                    placeholder=""
                    mode="outlined"
                    outlineColor={
                      errors.lname ? AppColor.error : AppColor.border
                    }
                    activeOutlineColor={AppColor.primary}
                    outlineStyle={{ borderRadius: 8 }}
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    theme={{ colors: { onSurfaceVariant: "#777" } }}
                    onBlur={() =>
                      setErrors((prev) => ({
                        ...prev,
                        lname: validateName(lname),
                      }))
                    }
                  />
                  {errors.lname ? (
                    <HelperText
                      type="error"
                      visible={!!errors.lname}
                      style={styles.helper}
                    >
                      {errors.lname}
                    </HelperText>
                  ) : null}
                </View>
              </View>

              {/* email */}
              <Text style={[styles.inputLabel, { marginTop: 16 }]}>
                {"Email*"}
              </Text>
              <TextInput
                dense
                value={email}
                ref={emailRef}
                onChangeText={setEmail}
                style={styles.input}
                contentStyle={styles.inputText}
                placeholder=""
                mode="outlined"
                outlineColor={errors.email ? AppColor.error : AppColor.border}
                activeOutlineColor={AppColor.primary}
                outlineStyle={{ borderRadius: 8 }}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                theme={{ colors: { onSurfaceVariant: "#777" } }}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    email: validateEmail(email),
                  }))
                }
              />
              {errors.email ? (
                <HelperText
                  type="error"
                  visible={!!errors.email}
                  style={styles.helper}
                >
                  {errors.email}
                </HelperText>
              ) : null}

              {/* password */}
              <Text style={[styles.inputLabel, { marginTop: 16 }]}>
                {"Password*"}
              </Text>
              <TextInput
                dense
                value={password}
                ref={passwordRef}
                onChangeText={setPassword}
                style={styles.input}
                contentStyle={styles.inputText}
                placeholder=""
                mode="outlined"
                secureTextEntry={!passwordVisible}
                outlineColor={
                  errors.password ? AppColor.error : AppColor.border
                }
                activeOutlineColor={AppColor.primary}
                outlineStyle={{ borderRadius: 8 }}
                right={
                  <TextInput.Icon
                    icon={passwordVisible ? "eye-off" : "eye"}
                    onPress={togglePasswordVisibility}
                    color={AppColor.textHighlighter}
                    forceTextInputFocus={false}
                  />
                }
                returnKeyType="next"
                onSubmitEditing={() => mobileNumberRef.current?.focus()}
                theme={{ colors: { onSurfaceVariant: "#777" } }}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    password: validatePassword(password),
                  }))
                }
              />
              {errors.password ? (
                <HelperText
                  type="error"
                  visible={!!errors.password}
                  style={styles.helper}
                >
                  {errors.password}
                </HelperText>
              ) : null}

              {/* mobile */}
              <Text style={[styles.inputLabel, { marginTop: 16 }]}>
                {"Enter mobile no.*"}
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCountryPickerVisible(true)}
                  style={styles.countryPickerButton}
                >
                  <Text style={styles.countryCodeText}>{countryCode}</Text>
                  <AntDesign
                    name="caretdown"
                    color={AppColor.textHighlighter}
                    size={14}
                  />
                </TouchableOpacity>

                <TextInput
                  dense
                  value={mobileNumber}
                  ref={mobileNumberRef}
                  onChangeText={setMobileNumber}
                  style={[styles.input, { flex: 1 }]}
                  returnKeyType="done"
                  onSubmitEditing={handleSignUp}
                  contentStyle={styles.inputText}
                  placeholder=""
                  mode="outlined"
                  maxLength={10}
                  outlineColor={
                    errors.mobileNumber ? AppColor.error : AppColor.border
                  }
                  activeOutlineColor={AppColor.primary}
                  outlineStyle={{ borderRadius: 8 }}
                  keyboardType="number-pad"
                  theme={{ colors: { onSurfaceVariant: "#777" } }}
                  onBlur={() =>
                    setErrors((prev) => ({
                      ...prev,
                      mobileNumber: validateMobileNumber(mobileNumber),
                    }))
                  }
                />
              </View>
              {errors.mobileNumber ? (
                <HelperText
                  type="error"
                  visible={!!errors.mobileNumber}
                  style={styles.helper}
                >
                  {errors.mobileNumber}
                </HelperText>
              ) : null}

              {/* Country picker modal */}
              <CountryPicker
                show={countryPickerVisible}
                style={{
                  modal: {
                    height: "70%",
                  },
                  backdrop: {
                    backgroundColor: "rgba(0,0,0,0.1)",
                  },
                  line: {},
                  itemsList: {},
                  textInput: {},
                  countryButtonStyles: { paddingVertical: 0 },
                  searchMessageText: {},
                  countryMessageContainer: {},
                  flag: {},
                  dialCode: {},
                  countryName: {},
                }}
                pickerButtonOnPress={(item) => {
                  setCountryCode(item.dial_code);
                  setCountryPickerVisible(false);
                }}
                onBackdropPress={() => setCountryPickerVisible(false)}
              />

              {/* T&C */}
              <View style={styles.termsContainer}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setAgreed(!agreed)}
                  style={styles.iconBox}
                >
                  <Ionicons
                    name={agreed ? "checkbox" : "square-outline"}
                    size={22}
                    color={AppColor.primary}
                  />
                </TouchableOpacity>

                <Text style={styles.termsText}>
                  {"I agree to the"}
                  <Text
                    style={styles.linkText}
                    onPress={() => navigation.navigate("termsOfService")}
                  >
                    {" Terms of Service"}
                  </Text>
                  {" and "}
                  <Text
                    style={styles.linkText}
                    onPress={() => navigation.navigate("privacyPolicy")}
                  >
                    {"Privacy Policy."}
                  </Text>
                </Text>
              </View>
              {errors.agreed ? (
                <HelperText
                  type="error"
                  visible={!!errors.agreed}
                  style={styles.helper}
                >
                  {errors.agreed}
                </HelperText>
              ) : null}

              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>
                  {"Already have an account? "}{" "}
                </Text>
                <TouchableOpacity
                  onPress={handleSigninPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.signInLink}>{"Sign In"}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleSignUp}
                activeOpacity={0.7}
                disabled={!agreed || loading}
                style={[styles.signInButton, { opacity: agreed ? 1 : 0.7 }]}
              >
                {loading ? (
                  <ActivityIndicator color={AppColor.white} />
                ) : (
                  <Text style={styles.buttonLabel}>{"Signup"}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

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

          {/* Media Picker Modal */}
          <MediaPickerDialog
            isVisible={modalVisible}
            onCameraPress={() => handleCameraPress()}
            onGalleryPress={() => handleGalleryPress()}
            onClosePress={() => setModalVisible(false)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: AppColor.primary,
    paddingHorizontal: 8,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    color: AppColor.white,
    fontSize: 20,
    fontFamily: Mulish700,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: "flex-start",
    marginTop: 30,
    marginBottom: 20,
  },
  title: {
    fontFamily: Mulish700,
    fontSize: 24,
    color: AppColor.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.textHighlighter,
    marginBottom: 30,
  },
  formContainer: {
    flex: 1,
  },
  inputLabel: {
    fontFamily: Mulish400,
    fontSize: 15,
    color: AppColor.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: AppColor.white,
  },
  inputText: {
    fontFamily: Mulish400,
  },
  countryPickerButton: {
    height: "100%",
    width: "25%",
    backgroundColor: AppColor.white,
    borderWidth: 1,
    borderColor: AppColor.border,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    gap: 5,
  },
  countryCodeText: {
    color: AppColor.text,
    fontSize: 15,
    fontFamily: Mulish400,
  },
  helper: {
    marginBottom: 8,
    paddingLeft: 0,
    paddingTop: 0,
    fontFamily: Mulish400,
  },
  signInButton: {
    height: 48,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColor.primary,
    marginBottom: 20,
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
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  signInText: {
    color: AppColor.textHighlighter,
    fontSize: 14,
    fontFamily: Mulish400,
  },
  signInLink: {
    color: AppColor.text,
    fontSize: 14,
    fontFamily: Mulish700,
  },
  buttonLabel: {
    fontFamily: Mulish700,
    fontSize: 16,
    color: AppColor.white,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: AppColor.text,
    fontFamily: Mulish400,
  },
  linkText: {
    color: AppColor.primary,
  },
  iconBox: {
    padding: 4,
    marginRight: 6,
  },
});

export default SignupScreen;
