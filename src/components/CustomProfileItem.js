import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import FastImage from "@d11/react-native-fast-image";
import Entypo from "react-native-vector-icons/Entypo";
import { AppColor, Secondary400 } from "../utils/theme";

const CustomProfileItem = ({ imageUri, label, rightIcon, isRed, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    style={styles.componentContainer}
  >
    {imageUri ? (
      <FastImage source={imageUri} style={styles.componentImage} />
    ) : null}
    <Text
      style={[
        styles.componentLabel,
        { color: isRed ? AppColor.red : AppColor.black },
      ]}
    >
      {label}
    </Text>
    {rightIcon ? (
      <Entypo name="chevron-small-right" size={24} color={AppColor.black} />
    ) : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  componentContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    backgroundColor: AppColor.white,
  },
  componentImage: {
    width: 24,
    height: 24,
    marginRight: 6,
  },
  componentLabel: {
    flex: 1,
    fontFamily: Secondary400,
    fontSize: 16,
  },
});

export default CustomProfileItem;
