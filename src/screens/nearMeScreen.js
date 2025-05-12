import React from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import StatusBarManager from "../components/StatusBarManager";

const NearMeScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <StatusBarManager />
      <Text>NearMeScreen</Text>
    </View>
  );
};

export default NearMeScreen;

const styles = StyleSheet.create({});
