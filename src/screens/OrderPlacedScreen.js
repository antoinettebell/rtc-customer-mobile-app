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
        source={require("../assets/images/FoodImage.png")}
        style={styles.icon}
      />
      <Text style={styles.placedText}>YOUR ORDER HAS BEEN PLACED!</Text>
      <Text style={styles.orderNum}>Order {orderNumber}</Text>
      <TouchableOpacity
        style={styles.trackBtn}
        onPress={() => navigation.navigate("rateReviewScreen")}
      >
        <Text style={styles.trackBtnText}>Track Order</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { width: 80, height: 80, marginBottom: 24 },
  placedText: {
    fontFamily: Primary400,
    fontSize: 18,
    color: AppColor.primary,
    marginBottom: 8,
  },
  orderNum: {
    fontFamily: Secondary400,
    fontSize: 15,
    color: AppColor.textHighlighter,
    marginBottom: 24,
  },
  trackBtn: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    width: 200,
  },
  trackBtnText: { color: "#fff", fontFamily: Primary400, fontSize: 16 },
});

export default OrderPlacedScreen;
