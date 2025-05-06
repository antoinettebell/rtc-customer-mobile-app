import { StatusBar, StyleSheet, Text, View } from "react-native";
import React from "react";
import { AppColor } from "../utils/theme";

const OrdersScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <StatusBar backgroundColor={AppColor.white} barStyle="dark-content" />
      <Text>OrdersScreen</Text>
    </View>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({});
