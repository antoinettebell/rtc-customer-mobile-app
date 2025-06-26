import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { TextInput, HelperText } from "react-native-paper";
import Modal from "react-native-modal";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";

const UpdateNameModal = ({
  isVisible,
  value,
  onChangeText,
  onUpdate,
  onCancel,
  error,
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

      <Text style={styles.modalTitle}>{"UPDATE NAME"}</Text>
      <Text style={styles.inputText}>{"Enter your name:"}</Text>
      <TextInput
        dense
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        contentStyle={styles.inputText}
        placeholder=""
        placeholderTextColor={AppColor.placeholderTextColor}
        mode="outlined"
        outlineColor={error ? AppColor.red : AppColor.border}
        activeOutlineColor={AppColor.primary}
        outlineStyle={{ borderRadius: 8 }}
        theme={{ colors: { onSurfaceVariant: "#777" } }}
      />
      {error ? (
        <HelperText type="error" visible={!!error} style={styles.helper}>
          {error}
        </HelperText>
      ) : null}
      <TouchableOpacity
        style={styles.updateBtn}
        activeOpacity={0.7}
        onPress={onUpdate}
      >
        <Text style={styles.updateBtnText}>Update</Text>
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
    fontFamily: Primary400,
    color: AppColor.text,
    textAlign: "center",
    letterSpacing: 1.5,
  },
  label: {
    fontSize: 14,
    fontFamily: Secondary400,
    color: AppColor.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: AppColor.white,
    marginTop: 5,
  },
  inputText: {
    fontSize: 15,
    fontFamily: Secondary400,
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
    fontFamily: Secondary400,
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
    fontFamily: Secondary400,
    fontSize: 16,
  },
  helper: {
    marginBottom: 8,
    paddingLeft: 0,
    paddingTop: 0,
  },
});

export default UpdateNameModal;
