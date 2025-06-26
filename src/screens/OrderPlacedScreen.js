import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";

const OrderPlacedScreen = () => {
  const navigation = useNavigation();
  const orderNumber = "#126265";

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/orderPlcaed.png")}
        style={styles.icon}
      />
      <Text style={styles.placedText}>YOUR ORDER HAS BEEN PLACED!</Text>
      <Text style={styles.orderNum}>Order {orderNumber}</Text>
      <TouchableOpacity
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
    fontFamily: Primary400,
    color: AppColor.primary,
  },
  orderNum: {
    fontSize: 15,
    marginBottom: 24,
    textAlign: "center",
    fontFamily: Secondary400,
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
    fontFamily: Secondary400,
    fontSize: 16,
  },
});

export default OrderPlacedScreen;
