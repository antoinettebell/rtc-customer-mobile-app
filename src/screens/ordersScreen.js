import React from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import StatusBarManager from "../components/StatusBarManager";

const OrdersScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <StatusBarManager />
      <Text>OrdersScreen</Text>
    </View>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({});
