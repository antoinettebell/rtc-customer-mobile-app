import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { AppColor, Primary400 } from "../utils/theme";
import { useNavigation } from "@react-navigation/native";
import PropTypes from "prop-types";

const AppHeader = (props) => {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();

  return (
    <View style={styles.headerWrap}>
      {canGoBack && (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={28} color={AppColor.text} />
        </TouchableOpacity>
      )}
      <Text style={styles.headerTitle}>{props.headerTitle || ""}</Text>
      {props.rightSide ? props.children : <View style={styles.headerSpacer} />}
    </View>
  );
};

AppHeader.propTypes = {
  headerTitle: PropTypes.string,
  rightSide: PropTypes.bool,
  children: PropTypes.node,
};

AppHeader.defaultProps = {
  headerTitle: "",
  rightSide: false,
};

export default AppHeader;

const styles = StyleSheet.create({
  headerWrap: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: AppColor.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColor.borderColor,
  },
  backBtn: {
    marginRight: 8,
  },
  headerTitle: {
    fontFamily: Primary400,
    fontSize: 20,
  },
  headerSpacer: {
    width: 28,
    height: 28,
  },
});
