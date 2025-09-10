import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";
import {
  ActivityIndicator,
  HelperText,
  Snackbar,
  TextInput,
} from "react-native-paper";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AppColor, Mulish400, Mulish700 } from "../utils/theme";
import { passwordRegex } from "../utils/constants";

const ChangePasswordModal = ({
  isModalVisible,
  onUpdatePress,
  onCancelPress,
  snackbarPWD,
  setSnackbarPWD,
}) => {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [cnfrmPassword, setCnfrmPassword] = useState("");
  const [cnfrmPasswordError, setCnfrmPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetStates = () => {
    setPassword("");
    setPasswordError("");
    setPasswordVisible(false);
    setNewPassword("");
    setNewPasswordError("");
    setNewPasswordVisible(false);
    setCnfrmPassword("");
    setCnfrmPasswordError("");
  };

  const togglePasswordVisibility = (type) => {
    switch (type) {
      case "current":
        setPasswordVisible(!passwordVisible);
        break;
      case "new":
        setNewPasswordVisible(!newPasswordVisible);
        break;
      default:
        break;
    }
  };

  const validatePassword = (password) => {
    return passwordRegex?.test(password);
  };

  const onValidateBtnPress = async () => {
    const validatePasswordOnSubmit = (value, cnfrm = false) => {
      if (!passwordRegex.test(value)) {
        return "Password must be 8–15 chars with 1 uppercase, 1 lowercase, 1 number, and 1 special char.";
      }
      if (cnfrm) {
        if (newPassword !== cnfrmPassword) {
          return "Passwords do not match.";
        }
      }
      return "";
    };

    const pwdErr = validatePasswordOnSubmit(password);
    const newPwdErr = validatePasswordOnSubmit(newPassword);
    const cnfrmPwdErr = validatePasswordOnSubmit(cnfrmPassword, true);

    setPasswordError(pwdErr);
    setNewPasswordError(newPwdErr);
    setCnfrmPasswordError(cnfrmPwdErr);

    if (!!pwdErr || !!newPwdErr || !!cnfrmPwdErr) return;

    onUpdatePress({
      payload: {
        currentPassword: password,
        newPassword: cnfrmPassword,
      },
      setLoading,
    });
  };

  useEffect(() => {
    setTimeout(() => {
      resetStates();
    }, 500);
  }, [isModalVisible]);

  return (
    <Modal
      isVisible={isModalVisible}
      backdropOpacity={0.5}
      animationIn="zoomIn"
      animationOut="zoomOut"
      backdropTransitionOutTiming={0.5}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ position: "absolute", top: 10, right: 10 }}
          onPress={onCancelPress}
          disabled={loading}
        >
          <Ionicons
            name="close-circle-sharp"
            size={32}
            color={AppColor.primary}
          />
        </TouchableOpacity>

        <Text style={styles.modalTitle}>{"Change Password"}</Text>

        <View>
          {/* Current Password */}
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>
            {"Current Password"}
          </Text>
          <TextInput
            dense
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (validatePassword(text)) {
                setPasswordError("");
              }
            }}
            style={styles.input}
            contentStyle={styles.inputText}
            placeholder=""
            placeholderTextColor={AppColor.placeholderTextColor}
            mode="outlined"
            autoCapitalize="none"
            error={!!passwordError}
            secureTextEntry={!passwordVisible}
            outlineColor={AppColor.border}
            activeOutlineColor={AppColor.primary}
            outlineStyle={{ borderRadius: 8 }}
            right={
              <TextInput.Icon
                icon={passwordVisible ? "eye-off" : "eye"}
                onPress={() => togglePasswordVisibility("current")}
                color={AppColor.textHighlighter}
                forceTextInputFocus={false}
              />
            }
            theme={{ colors: { onSurfaceVariant: "#777" } }}
          />

          {/* New Password */}
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>
            {"New Password"}
          </Text>
          <TextInput
            dense
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              if (validatePassword(text)) {
                setNewPasswordError("");
              }
            }}
            style={styles.input}
            contentStyle={styles.inputText}
            placeholder=""
            placeholderTextColor={AppColor.placeholderTextColor}
            mode="outlined"
            autoCapitalize="sentences"
            error={!!newPasswordError}
            secureTextEntry={!newPasswordVisible}
            outlineColor={AppColor.border}
            activeOutlineColor={AppColor.primary}
            outlineStyle={{ borderRadius: 8 }}
            right={
              <TextInput.Icon
                icon={newPasswordVisible ? "eye-off" : "eye"}
                onPress={() => togglePasswordVisibility("new")}
                color={AppColor.textHighlighter}
                forceTextInputFocus={false}
              />
            }
            theme={{ colors: { onSurfaceVariant: "#777" } }}
          />

          {/* Confirm Password */}
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>
            {"Confirm Password"}
          </Text>
          <TextInput
            dense
            value={cnfrmPassword}
            onChangeText={(text) => {
              setCnfrmPassword(text);
              if (validatePassword(text) && newPassword === text) {
                setCnfrmPasswordError("");
              }
            }}
            style={styles.input}
            contentStyle={styles.inputText}
            placeholder=""
            placeholderTextColor={AppColor.placeholderTextColor}
            mode="outlined"
            autoCapitalize="sentences"
            error={!!cnfrmPasswordError}
            secureTextEntry={!newPasswordVisible}
            outlineColor={AppColor.border}
            activeOutlineColor={AppColor.primary}
            outlineStyle={{ borderRadius: 8 }}
            right={
              <TextInput.Icon
                icon={newPasswordVisible ? "eye-off" : "eye"}
                onPress={() => togglePasswordVisibility("new")}
                color={AppColor.textHighlighter}
                forceTextInputFocus={false}
              />
            }
            theme={{ colors: { onSurfaceVariant: "#777" } }}
          />

          {!!passwordError || !!newPasswordError || !!cnfrmPasswordError ? (
            <HelperText
              type="error"
              visible={
                !!passwordError || !!newPasswordError || !!cnfrmPasswordError
              }
              style={styles.helper}
            >
              {passwordError || newPasswordError || cnfrmPasswordError}
            </HelperText>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.signoutModalBtnYes, { marginTop: 30 }]}
          activeOpacity={0.7}
          onPress={onValidateBtnPress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={AppColor.white} />
          ) : (
            <Text style={styles.signoutModalBtnText}>{"Update"}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signoutModalBtnNo}
          activeOpacity={0.7}
          onPress={onCancelPress}
          disabled={loading}
        >
          <Text
            style={[styles.signoutModalBtnText, { color: AppColor.primary }]}
          >
            {"Cancel"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* SnackBar */}
      <Snackbar
        visible={snackbarPWD.visible}
        onDismiss={() => setSnackbarPWD({ ...snackbarPWD, visible: false })}
        duration={4000}
        style={{
          backgroundColor:
            snackbarPWD.type === "success"
              ? AppColor.snackbarSuccess
              : snackbarPWD.type === "error"
                ? AppColor.snackbarError
                : AppColor.snackbarDefault,
        }}
      >
        {snackbarPWD.message}
      </Snackbar>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    fontFamily: Mulish700,
    color: AppColor.text,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 15,
    fontFamily: Mulish400,
    color: AppColor.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: AppColor.white,
  },
  inputText: {
    fontSize: 15,
    fontFamily: Mulish400,
  },
  helper: {
    paddingLeft: 0,
    fontFamily: Mulish400,
  },
  signoutModalBtnYes: {
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
  signoutModalBtnNo: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: AppColor.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  signoutModalBtnText: {
    color: AppColor.white,
    fontFamily: Mulish700,
    fontSize: 16,
  },
});

export default ChangePasswordModal;
