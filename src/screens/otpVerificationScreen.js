import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput as NativeInput,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Snackbar,
  ActivityIndicator,
  Portal,
  IconButton,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Modal from "react-native-modal";
import Octicons from "react-native-vector-icons/Octicons";
import { AppColor, Mulish700, Mulish400 } from "../utils/theme";
import { resendOTP_API, verifyOTP_API } from "../apiFolder/authAPI";
import { useDispatch } from "react-redux";
import {
  clearUserSlice,
  setAuthToken,
  setUser,
} from "../redux/slices/userSlice";
import { onSignin, onSignOut } from "../redux/slices/authSlice";
import StatusBarManager from "../components/StatusBarManager";
import {
  checkFcmToken,
  checkInstallationId,
} from "../helpers/notification.helper";
import { setFcmToken_API } from "../apiFolder/appAPI";
import {
  clearLocationSlice,
  setAllLocations,
} from "../redux/slices/locationSlice";
import { GET_ADDRESS } from "../apiFolder/apiEndPoint";
import Config from "react-native-config";
import { clearFavorites } from "../redux/slices/favoritesSlice";
import { clearOrderSlice } from "../redux/slices/orderSlice";
import { clearFoodTruckProfileSlice } from "../redux/slices/foodTruckProfileSlice";
import { addOrUpdateUser } from "../redux/slices/userInfoSlice";

const API_URL = Config.API_URL;
const API_PREFIX = Config.API_PREFIX;

const RESEND_CODE_TIME = 120; // in second

const OtpVerificationScreen = ({ route }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const timerRef = useRef(null);

  const [resendTimer, setResendTimer] = useState(RESEND_CODE_TIME);
  const [params, setParams] = useState(route.params);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "info",
  });
  const [isModalVisible, setModalVisible] = useState(false);

  const inputRefs = useRef([]);

  // Combine digits
  const otp = otpDigits.join("");

  const validateOtp = () => /^\d{6}$/.test(otp);

  const handleChange = (text, index) => {
    if (/^\d?$/.test(text)) {
      const newDigits = [...otpDigits];
      newDigits[index] = text;
      setOtpDigits(newDigits);

      if (text && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateOtp()) {
      setSnackbar({
        visible: true,
        message: "Invalid Code. Must be 6 digits.",
        type: "error",
      });
      return;
    }

    const payload = {
      otpVerificationToken: params?.data?.otpVerificationToken,
      otp: otp,
    };
    console.log("payload => ", payload);
    setLoading(true);
    try {
      const response = await verifyOTP_API(payload);
      if (response?.success && response?.data) {
        if (params?.verificationFor === "sign-up") {
          // Get Address and set into redux
          const myHeaders = new Headers();
          const raw = "";
          const URL = `${API_URL}${API_PREFIX}${GET_ADDRESS}?page=1&limit=1000`;
          myHeaders.append("authorization", response.data.authToken);
          const requestOptions = {
            method: "GET",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
          };
          await fetch(URL, requestOptions)
            .then((response) => response.json())
            .then((result) => {
              if (result?.success && result?.data) {
                dispatch(setAllLocations(result?.data?.addressList || []));
              }
            })
            .catch((error) => console.error(error));

          setModalVisible(true); // Success -> show modal

          dispatch(setUser(response.data.user));
          dispatch(setAuthToken(response.data.authToken));

          dispatch(
            addOrUpdateUser({
              emailid: response.data.user.email,
              userData: {
                emailid: response.data.user.email,
                password: params?.data?.localPassword,
                username: response?.data?.user?.firstName || "",
                imageUrl: response?.data?.user?.profilePic || null,
              },
            })
          );
        } else if (params?.verificationFor === "forget-password") {
          console.log("response.data => ", response.data);
          navigation.navigate("resetPassword", {
            data: { ...response.data },
          });
        } else if (params?.verificationFor === "delete-account") {
          console.log("response.data => ", response.data);
          dispatch(clearUserSlice());
          dispatch(clearFavorites());
          dispatch(clearOrderSlice());
          dispatch(clearFoodTruckProfileSlice());
          dispatch(clearLocationSlice());
          dispatch(onSignOut());
        }
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

  const handleResendOtp = async () => {
    const payload = {
      otpVerificationToken: params?.data?.otpVerificationToken,
      email: params?.data?.user?.email,
    };
    setResendLoading(true);
    try {
      const resendResponse = await resendOTP_API(payload);
      console.log("resendResponse => ", resendResponse);
      if (resendResponse.success && resendResponse.data) {
        setOtpDigits(["", "", "", "", "", ""]);
        setResendTimer(60); // Reset timer
        inputRefs.current[0]?.focus();

        setParams({
          ...params,
          otpVerificationToken: resendResponse?.data?.otpVerificationToken,
        });

        setSnackbar({
          visible: true,
          message: resendResponse.message,
          type: "info",
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
      setResendLoading(false);
    }
  };

  // Countdown logic for resend button with cleanup
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(
        () => setResendTimer(resendTimer - 1),
        1000
      );
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resendTimer]);

  useEffect(() => {
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

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
        <Text style={styles.headerTitle}>{"Verification"}</Text>
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
        >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/images/AppLogo.png")}
                style={{ height: 104, width: 104 }}
              />
            </View>

            {/* OTP Form */}
            <Text style={styles.title}>{"Please check your email"}</Text>
            <Text style={styles.subtitle}>
              {"Enter the code from the mail we sent to"}
              <Text style={{ color: AppColor.text, fontFamily: Mulish400 }}>
                {`\n${params?.data?.user?.email}`}
              </Text>
            </Text>

            <View style={styles.otpRow}>
              {otpDigits.map((digit, index) => (
                <NativeInput
                  key={index}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  keyboardType="numeric"
                  maxLength={1}
                  style={[
                    styles.otpInput,
                    // {
                    //   borderColor:
                    //     !digit && index === otp.indexOf("")
                    //       ? AppColor.primary
                    //       : "#ccc",
                    // },
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleVerifyOtp}
              activeOpacity={0.7}
              style={styles.signInButton}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={AppColor.white} />
              ) : (
                <Text style={styles.buttonLabel}>{"Verify Code"}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              {resendTimer > 0 ? (
                <Text
                  style={styles.timerText}
                >{`Resend Code in ${resendTimer}s`}</Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResendOtp}
                  activeOpacity={0.7}
                  style={styles.skipButton}
                  disabled={resendLoading}
                >
                  <Text style={[styles.buttonLabel, { color: AppColor.black }]}>
                    {resendLoading ? "Resending..." : "RESEND CODE"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        isVisible={isModalVisible}
        backdropOpacity={0.5}
        animationIn="zoomIn"
        animationOut="zoomOut"
      >
        <View style={styles.modalContainer}>
          <Octicons
            name="check-circle-fill"
            size={77.5}
            color={AppColor.primary}
          />

          <Text
            style={styles.modalTitle}
          >{`Hello, ${params?.data?.user?.firstName}`}</Text>
          <Text style={styles.modalSubtitle}>
            {"Your account has been created successfully!"}
          </Text>

          <TouchableOpacity
            style={styles.backToLoginButton}
            activeOpacity={0.7}
            onPress={() => {
              setModalVisible(false);
              dispatch(onSignin(true));
              // set FCM Token & DeviceId after 1.5 sec
              setTimeout(async () => {
                try {
                  const deviceId = await checkInstallationId();
                  const fcmToken = await checkFcmToken();
                  if (deviceId && fcmToken) {
                    const response1 = await setFcmToken_API({
                      token: fcmToken,
                      deviceId: deviceId,
                    });
                    console.log("response => ", response1);
                  }
                } catch (error) {
                  console.log("error => ", error);
                }
              }, 1500);
            }}
          >
            <Text style={styles.backToLoginText}>{"Next"}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Snacbar */}
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

export default OtpVerificationScreen;

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
    marginBottom: 50,
    marginTop: 5,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  otpInput: {
    width: 48,
    height: 56,
    fontSize: 26,
    borderRadius: 4,
    textAlign: "center",
    fontFamily: Mulish400,
    backgroundColor: AppColor.white,
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
  button: {
    marginTop: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  timerText: {
    color: AppColor.text,
    fontFamily: Mulish400,
    fontSize: 16,
  },
  signInButton: {
    height: 48,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColor.primary,
    marginVertical: 20,
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
    fontFamily: Mulish700,
    fontSize: 16,
    color: AppColor.white,
  },

  //   Modal
  modalContainer: {
    backgroundColor: AppColor.white,
    marginHorizontal: "10%",
    paddingVertical: 36,
    paddingHorizontal: 33,
    borderRadius: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontFamily: Mulish700,
    fontSize: 22,
    color: AppColor.text,
    marginVertical: 10,
    textAlign: "center",
  },
  modalSubtitle: {
    fontFamily: Mulish400,
    fontSize: 16,
    color: AppColor.textHighlighter,
    textAlign: "center",
    marginBottom: 20,
  },
  backToLoginButton: {
    width: "100%",
    height: 48,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColor.primary,
    marginTop: 10,
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
  backToLoginText: {
    color: AppColor.white,
    fontFamily: Mulish700,
    fontSize: 16,
  },
});
