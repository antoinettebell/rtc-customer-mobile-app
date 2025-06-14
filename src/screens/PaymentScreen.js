import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import AppHeader from "../components/AppHeader";

const PaymentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const total = route.params?.total || 0;

  return (
    <View style={styles.container}>
      <AppHeader headerTitle="PAYMENT" />
      <View style={styles.content}>
        <View style={styles.profileRow}>
          <Image
            source={require("../assets/images/FoodImage.png")}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.payTo}>Paying to Rohit Kapoor</Text>
            <Text style={styles.orderType}>$ {total.toFixed(2)}</Text>
            <Text style={styles.orderLabel}>Food Order</Text>
          </View>
        </View>
        <View style={styles.bankRow}>
          <View style={styles.bankIcon} />
          <Text style={styles.bankText}>Your bank •••• 4321</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.payBtn}
        onPress={() => navigation.navigate("orderPlacedScreen")}
      >
        <Text style={styles.payBtnText}>Pay ${total.toFixed(2)}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  profileRow: { flexDirection: "row", alignItems: "center", marginBottom: 40 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
  payTo: { fontFamily: Primary400, fontSize: 16 },
  orderType: { fontFamily: Primary400, fontSize: 28, color: AppColor.primary },
  orderLabel: {
    fontFamily: Secondary400,
    fontSize: 15,
    color: AppColor.textHighlighter,
  },
  bankRow: { flexDirection: "row", alignItems: "center", marginBottom: 40 },
  bankIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#eee",
    borderRadius: 8,
    marginRight: 12,
  },
  bankText: { fontFamily: Secondary400, fontSize: 15 },
  payBtn: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
    padding: 18,
    alignItems: "center",
    margin: 24,
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
  },
  payBtnText: { color: "#fff", fontFamily: Primary400, fontSize: 18 },
});

export default PaymentScreen;
