import { StatusBar, StyleSheet, Text, View } from "react-native";
import React from "react";
import { AppColor } from "../utils/theme";

const NearMeScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <StatusBar backgroundColor={AppColor.white} barStyle="dark-content" />
      <Text>NearMeScreen</Text>
    </View>
  );
};

export default NearMeScreen;

const styles = StyleSheet.create({});
