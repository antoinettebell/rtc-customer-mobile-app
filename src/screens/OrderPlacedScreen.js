import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { AppColor, Mulish700, Mulish400 } from "../utils/theme";

const OrderPlacedScreen = ({ navigation, route }) => {
  const orderNumber = route?.params?.orderNumber;

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/orderPlcaed.png")}
        style={styles.icon}
      />
      <Text style={styles.placedText}>YOUR ORDER HAS BEEN PLACED!</Text>
      <Text style={styles.orderNum}>Order #{orderNumber}</Text>
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.trackBtn}
        onPress={() => {
          navigation.navigate("bottomRoot", {
            screen: "ordersScreen",
          });
        }}
        // onPress={() => navigation.navigate("Orders")}
      >
        <Text style={styles.trackBtnText}>Track Order</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
    justifyContent: "center",
  },
  icon: {
    width: 120,
    height: 120,
    marginBottom: 16,
    alignSelf: "center",
  },
  placedText: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: "center",
    fontFamily: Mulish700,
    color: AppColor.primary,
  },
  orderNum: {
    fontSize: 15,
    marginBottom: 24,
    textAlign: "center",
    fontFamily: Mulish400,
    color: AppColor.textHighlighter,
  },
  trackBtn: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 16,

    position: "absolute",
    bottom: 50,
    right: 0,
    left: 0,
  },
  trackBtnText: {
    color: AppColor.white,
    fontFamily: Mulish700,
    fontSize: 16,
  },
});

export default OrderPlacedScreen;
