import { StatusBar, StyleSheet, Text, View } from "react-native";
import React from "react";
import { AppColor } from "../utils/theme";

const ExploreScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <StatusBar backgroundColor={AppColor.white} barStyle="dark-content" />
      <Text>ExploreScreen</Text>
    </View>
  );
};

export default ExploreScreen;

const styles = StyleSheet.create({});
