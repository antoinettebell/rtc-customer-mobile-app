import React, { useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CountryPicker } from "react-native-country-codes-picker";
import AntDesign from "react-native-vector-icons/AntDesign";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import { emailRegex, passwordRegex } from "../utils/constants";
import { register_API } from "../apiFolder/authAPI";
import StatusBarManager from "../components/StatusBarManager";

const SignupScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [countryCode, setCountryCode] = useState("+1");
  const [mobileNumber, setMobileNumber] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
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
    const payload = {
      firstName: fname,
      lastName: lname,
      email: email,
      password: password,
      countryCode: countryCode,
      mobileNumber: mobileNumber,
    };
    console.log("Payload:", payload);
    setLoading(true);
    try {
      const response = await register_API(payload);
      console.log("Response => ", response);
      if (response.success && response.data) {
        navigation.navigate("otpVerification", {
          verificationFor: "sign-up",
          data: response.data,
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
    // resetStates();
    navigation.navigate("signin");
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
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{"First Name*"}</Text>
                  <TextInput
                    dense
                    value={fname}
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

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{"Last Name*"}</Text>
                  <TextInput
                    dense
                    value={lname}
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

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>
                {"Email*"}
              </Text>
              <TextInput
                dense
                value={email}
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

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>
                {"Password*"}
              </Text>
              <TextInput
                dense
                value={password}
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
                  />
                }
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
                  onChangeText={setMobileNumber}
                  style={[styles.input, { flex: 1 }]}
                  contentStyle={styles.inputText}
                  placeholder=""
                  mode="outlined"
                  maxLength={10}
                  outlineColor={
                    errors.mobileNumber ? AppColor.error : AppColor.border
                  }
                  activeOutlineColor={AppColor.primary}
                  outlineStyle={{ borderRadius: 8 }}
                  keyboardType="phone-pad"
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

              <View style={styles.termsContainer}>
                <TouchableOpacity
                  onPress={() => setAgreed(!agreed)}
                  style={styles.iconBox}
                >
                  <Ionicons
                    name={agreed ? "checkbox" : "square-outline"}
                    size={22}
                    color={errors.agreed ? AppColor.error : AppColor.primary}
                  />
                </TouchableOpacity>

                <Text
                  style={styles.termsText}
                  onPress={() => setAgreed(!agreed)}
                >
                  {"I agree to the"}
                  <Text style={styles.linkText}>{" Terms of Service"}</Text>
                  {" and "}
                  <Text style={styles.linkText}>{"Privacy Policy."}</Text>
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

              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>
                  {"Already have an account? "}{" "}
                </Text>
                <TouchableOpacity
                  onPress={handleSigninPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.signUpLink}>{"Sign In"}</Text>
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
    fontFamily: Primary400,
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
    fontFamily: Primary400,
    fontSize: 24,
    color: AppColor.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Secondary400,
    fontSize: 14,
    color: AppColor.textHighlighter,
    marginBottom: 50,
  },
  formContainer: {
    flex: 1,
  },
  inputLabel: {
    fontFamily: Secondary400,
    fontSize: 15,
    color: AppColor.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: AppColor.white,
  },
  inputText: {
    fontFamily: Secondary400,
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
    fontFamily: Secondary400,
  },
  helper: {
    marginBottom: 8,
    paddingLeft: 0,
    paddingTop: 0,
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
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  signUpText: {
    color: AppColor.textHighlighter,
    fontSize: 14,
    fontFamily: Secondary400,
  },
  signUpLink: {
    color: AppColor.text,
    fontSize: 14,
    fontFamily: Secondary400,
  },
  buttonLabel: {
    fontFamily: Secondary400,
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
    fontFamily: Secondary400,
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
