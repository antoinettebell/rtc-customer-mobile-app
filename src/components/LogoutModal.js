import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import Modal from "react-native-modal";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";

const LogoutModal = ({ isModalVisible, onYesLogoutPress, onNoLogoutPress }) => (
  <Modal
    isVisible={isModalVisible}
    backdropOpacity={0.5}
    animationIn="zoomIn"
    animationOut="zoomOut"
  >
    <View style={styles.modalContainer}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={{ position: "absolute", top: 10, right: 10 }}
        onPress={onNoLogoutPress}
      >
        <Ionicons
          name="close-circle-sharp"
          size={32}
          color={AppColor.primary}
        />
      </TouchableOpacity>
      <Text style={styles.modalTitle}>{"LoGoUT"}</Text>
      <Text style={styles.modalSubtitle}>
        {"Are you sure you want to logout?"}
      </Text>
      <TouchableOpacity
        style={styles.logoutModalBtnYes}
        activeOpacity={0.7}
        onPress={onYesLogoutPress}
      >
        <Text style={styles.logoutModalBtnText}>{"Yes"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.logoutModalBtnNo}
        activeOpacity={0.7}
        onPress={onNoLogoutPress}
      >
        <Text style={[styles.logoutModalBtnText, { color: AppColor.primary }]}>
          {"No"}
        </Text>
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
    marginBottom: 30,
    fontSize: 22,
    fontFamily: Primary400,
    color: AppColor.text,
    textAlign: "center",
  },
  modalSubtitle: {
    marginBottom: 20,
    fontSize: 16,
    fontFamily: Secondary400,
    color: AppColor.textHighlighter,
    textAlign: "center",
  },
  logoutModalBtnYes: {
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
  logoutModalBtnNo: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: AppColor.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  logoutModalBtnText: {
    color: AppColor.white,
    fontFamily: Secondary400,
    fontSize: 16,
  },
});

export default LogoutModal;
