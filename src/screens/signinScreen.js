import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  TextInput,
  IconButton,
  Button,
  HelperText,
  ActivityIndicator,
  Portal,
  Snackbar,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import { login_API } from "../apiFolder/authAPI";
import { setAuthToken, setUser } from "../redux/slices/userSlice";
import { onGuest, onSignin } from "../redux/slices/authSlice";
import { emailRegex, passwordRegex } from "../utils/constants";
import StatusBarManager from "../components/StatusBarManager";

const SignInScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "info",
  });

  const resetStates = () => {
    setEmail("");
    setEmailError("");
    setPassword("");
    setPasswordError("");
    setPasswordVisible(false);
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const validateEmail = (email) => {
    return emailRegex?.test(email);
  };

  const validatePassword = (password) => {
    return passwordRegex?.test(password);
  };

  const handleForgetPWD = () => {
    navigation.navigate("forgetPassword");
  };

  const handleSignIn = async () => {
    let isValid = true;

    if (!validateEmail(email)) {
      setEmailError("Enter a valid email!");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!validatePassword(password)) {
      setPasswordError(
        "Password must be 8–15 chars with 1 uppercase, 1 lowercase, 1 number, and 1 special char."
      );
      isValid = false;
    } else {
      setPasswordError("");
    }

    if (isValid) {
      console.log("✨ Logging in with:", email);
      // Trigger login logic here
      setLoading(true);
      try {
        const response = await login_API({ email, password });
        console.log("login API response ====> ", response);
        if (response.success && response.data) {
          dispatch(setUser(response.data.user));
          dispatch(setAuthToken(response.data.authToken));
          dispatch(onSignin(true));
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
    }
  };

  const handleSigninLater = () => {
    dispatch(onGuest(true));
  };

  const handleSignUpPress = () => {
    navigation.navigate("signup");
    // setTimeout(() => {
    //   resetStates();
    // }, 1000);
  };

  return (
    <View style={styles.container}>
      <StatusBarManager barStyle="light-content" />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
          },
        ]}
      >
        <IconButton
          icon="arrow-left"
          iconColor={AppColor.white}
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>{"Sign In"}</Text>
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
            <Text style={styles.title}>{"Sign In"}</Text>
            <Text style={styles.subtitle}>{"Sign in your account"}</Text>

            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>{"Email"}</Text>
              <TextInput
                dense
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError(
                    validateEmail(text) ? "" : "Enter a valid email!"
                  );
                }}
                style={styles.input}
                contentStyle={styles.inputText}
                placeholder=""
                mode="outlined"
                error={!!emailError}
                outlineColor={AppColor.border}
                activeOutlineColor={AppColor.primary}
                outlineStyle={{ borderRadius: 8 }}
                autoCapitalize="none"
                keyboardType="email-address"
                theme={{ colors: { onSurfaceVariant: "#777" } }}
              />
              {!!emailError && (
                <HelperText
                  type="error"
                  visible={!!emailError}
                  style={styles.helper}
                >
                  {emailError}
                </HelperText>
              )}

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>
                {"Password"}
              </Text>
              <TextInput
                dense
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError(
                    validatePassword(text)
                      ? ""
                      : "Password must be 8–15 chars with 1 uppercase, 1 lowercase, 1 number, and 1 special char."
                  );
                }}
                style={styles.input}
                contentStyle={styles.inputText}
                placeholder=""
                mode="outlined"
                error={!!passwordError}
                secureTextEntry={!passwordVisible}
                outlineColor={AppColor.border}
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
              />
              {!!passwordError && (
                <HelperText
                  type="error"
                  visible={!!passwordError}
                  style={styles.helper}
                >
                  {passwordError}
                </HelperText>
              )}

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={handleForgetPWD}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>
                  {"Forgot Password?"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSignIn}
                activeOpacity={0.7}
                style={styles.signInButton}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={AppColor.white} />
                ) : (
                  <Text style={styles.buttonLabel}>{"Sign In"}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>{"Don't have account?"} </Text>
                <TouchableOpacity
                  onPress={handleSignUpPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.signUpLink}>{"Sign Up"}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.orText}>{"Or"}</Text>

              <TouchableOpacity
                onPress={handleSigninLater}
                activeOpacity={0.7}
                style={styles.skipButton}
              >
                <Text style={[styles.buttonLabel, { color: AppColor.black }]}>
                  {"SIGN IN LATER"}
                </Text>
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
  helper: {
    marginBottom: 8,
    paddingLeft: 0,
    paddingTop: 0,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 8,
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontFamily: Secondary400,
    fontSize: 14,
    color: AppColor.textHighlighter,
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
    marginBottom: 24,
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
  orText: {
    textAlign: "center",
    color: AppColor.textHighlighter,
    fontSize: 14,
    fontFamily: Secondary400,
    marginBottom: 10,
  },
  skipButton: {
    height: 48,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonLabel: {
    fontFamily: Secondary400,
    fontSize: 16,
    color: AppColor.white,
  },
});

export default SignInScreen;
