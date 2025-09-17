import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { TextInput, HelperText, ActivityIndicator } from "react-native-paper";
import Modal from "react-native-modal";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AppColor, Mulish700, Mulish400, Mulish500 } from "../utils/theme";

const UpdateNameModal = ({
  isVisible,
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  onUpdate,
  onCancel,
  firstNameError,
  lastNameError,
  loading,
}) => (
  <Modal
    isVisible={isVisible}
    backdropOpacity={0.5}
    useNativeDriver={true}
    useNativeDriverForBackdrop={true}
  >
    <View style={styles.modalContainer}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={{ position: "absolute", top: 10, right: 10 }}
        onPress={onCancel}
      >
        <Ionicons
          name="close-circle-sharp"
          size={32}
          color={AppColor.primary}
        />
      </TouchableOpacity>

      <Text style={styles.modalTitle}>{"Update Name"}</Text>
      <Text style={styles.inputLabel}>{"First Name:"}</Text>
      <TextInput
        dense
        value={firstName}
        onChangeText={onFirstNameChange}
        style={styles.input}
        contentStyle={styles.inputText}
        placeholder=""
        placeholderTextColor={AppColor.placeholderTextColor}
        mode="outlined"
        outlineColor={firstNameError ? AppColor.red : AppColor.border}
        activeOutlineColor={AppColor.primary}
        outlineStyle={{ borderRadius: 8 }}
        returnKeyLabel="next"
        returnKeyType="next"
        theme={{ colors: { onSurfaceVariant: "#777" } }}
      />
      {firstNameError ? (
        <HelperText
          type="error"
          visible={!!firstNameError}
          style={styles.helper}
        >
          {firstNameError}
        </HelperText>
      ) : null}

      <Text style={[styles.inputLabel, { marginTop: 10 }]}>{"Last Name:"}</Text>
      <TextInput
        dense
        value={lastName}
        onChangeText={onLastNameChange}
        style={styles.input}
        contentStyle={styles.inputText}
        placeholder=""
        placeholderTextColor={AppColor.placeholderTextColor}
        mode="outlined"
        outlineColor={lastNameError ? AppColor.red : AppColor.border}
        activeOutlineColor={AppColor.primary}
        outlineStyle={{ borderRadius: 8 }}
        returnKeyLabel="done"
        returnKeyType="done"
        theme={{ colors: { onSurfaceVariant: "#777" } }}
      />
      {lastNameError ? (
        <HelperText
          type="error"
          visible={!!lastNameError}
          style={styles.helper}
        >
          {lastNameError}
        </HelperText>
      ) : null}
      <TouchableOpacity
        style={styles.updateBtn}
        activeOpacity={0.7}
        onPress={onUpdate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={AppColor.white} />
        ) : (
          <Text style={styles.updateBtnText}>Update</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.cancelBtn}
        activeOpacity={0.7}
        onPress={onCancel}
      >
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: AppColor.white,
    marginHorizontal: "5%",
    paddingVertical: 36,
    paddingHorizontal: 33,
    borderRadius: 24,
  },
  modalTitle: {
    marginBottom: 20,
    fontSize: 22,
    fontFamily: Mulish700,
    color: AppColor.text,
    textAlign: "center",
  },
  input: {
    backgroundColor: AppColor.white,
    marginTop: 5,
  },
  inputLabel: {
    fontSize: 15,
    fontFamily: Mulish400,
    marginBottom: 4,
  },
  inputText: {
    fontSize: 14,
    fontFamily: Mulish400,
  },
  updateBtn: {
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
  updateBtnText: {
    color: AppColor.white,
    fontFamily: Mulish700,
    fontSize: 16,
  },
  cancelBtn: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: AppColor.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  cancelBtnText: {
    color: AppColor.primary,
    fontFamily: Mulish700,
    fontSize: 16,
  },
  helper: {
    marginBottom: 8,
    paddingLeft: 0,
    paddingTop: 0,
    fontFamily: Mulish400,
  },
});

export default UpdateNameModal;
