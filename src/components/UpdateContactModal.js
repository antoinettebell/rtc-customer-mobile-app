import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { ActivityIndicator, TextInput } from "react-native-paper";
import Modal from "react-native-modal";
import Ionicons from "react-native-vector-icons/Ionicons";
import { CountryPicker } from "react-native-country-codes-picker";
import { AppColor, Mulish700, Mulish400 } from "../utils/theme";

const UpdateContactModal = ({
  isVisible,
  countryCode,
  onCountryCodePress,
  countryPickerVisible,
  setCountryPickerVisible,
  onCountrySelect,
  mobileNumber,
  onMobileNumberChange,
  onUpdate,
  onCancel,
  error,
  loading,
}) => (
  <Modal
    isVisible={isVisible}
    backdropOpacity={0.5}
    animationIn="zoomIn"
    animationOut="zoomOut"
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
      <Text style={styles.modalTitle}>{"Update Contact"}</Text>
      <Text style={styles.inputLabel}>{"Mobile No."}</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          justifyContent: "center",
        }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onCountryCodePress}
          style={styles.countryPickerButton}
        >
          <Text style={styles.countryCodeText}>{countryCode}</Text>
          <Ionicons
            name="chevron-down"
            color={AppColor.textHighlighter}
            size={18}
          />
        </TouchableOpacity>
        <TextInput
          dense
          value={mobileNumber}
          onChangeText={onMobileNumberChange}
          style={[styles.input, { flex: 1 }]}
          contentStyle={styles.inputText}
          placeholder=""
          mode="outlined"
          maxLength={10}
          outlineColor={error ? AppColor.red : AppColor.border}
          activeOutlineColor={AppColor.primary}
          outlineStyle={{ borderRadius: 8 }}
          keyboardType="phone-pad"
          returnKeyLabel="done"
          returnKeyType="done"
          theme={{ colors: { onSurfaceVariant: "#777" } }}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
      <CountryPicker
        show={countryPickerVisible}
        pickerButtonOnPress={onCountrySelect}
        onBackdropPress={() => setCountryPickerVisible(false)}
        style={{
          modal: { height: "70%" },
          backdrop: { backgroundColor: "rgba(0,0,0,0.1)" },
        }}
      />
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
  inputText: {
    fontSize: 14,
    fontFamily: Mulish400,
    marginBottom: 6,
  },
  input: {
    backgroundColor: AppColor.white,
  },
  inputLabel: {
    fontSize: 15,
    fontFamily: Mulish400,
    marginBottom: 4,
  },
  countryPickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 10,
    justifyContent: "center",
    borderColor: AppColor.border,
    backgroundColor: AppColor.white,
  },
  countryCodeText: {
    fontSize: 14,
    fontFamily: Mulish400,
    color: AppColor.text,
    marginRight: 4,
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
  errorText: {
    color: AppColor.red,
    fontFamily: Mulish400,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 2,
  },
});

export default UpdateContactModal;
