import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import { useNavigation } from "@react-navigation/native";
import OrderListItem from "../components/OrderListItem";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const demoOrders = [
  {
    id: "126265",
    truck: "Burger Express",
    items: [
      {
        name: "Taco Express",
        desc: "Cor tortilla, beef, lettuce, cheese",
        price: 9.49,
      },
      {
        name: "Burrito Bowl",
        desc: "Cor tortilla, beef, lettuce, cheese",
        price: 17.98,
      },
    ],
    total: 24.44,
    date: "20 Mar, 2025",
    time: "3:00 PM",
    image: require("../assets/images/FT-Demo-01.png"),
    status: "current",
  },
  {
    id: "126245",
    truck: "Burger Express",
    items: [
      {
        name: "Taco Express",
        desc: "Cor tortilla, beef, lettuce, cheese",
        price: 9.49,
      },
    ],
    total: 24.44,
    date: "20 Mar, 2025",
    time: "3:00 PM",
    image: require("../assets/images/FT-Demo-01.png"),
    status: "past",
  },
];

const OrdersScreen = () => {
  const [tab, setTab] = useState("current");
  const insets = useSafeAreaInsets();

  const navigation = useNavigation();
  const filteredOrders = demoOrders.filter((o) => o.status === tab);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <View style={styles.headerWrap}>
        <Text style={styles.header}>MY ORDERS</Text>
      </View>

      <View
        style={{
          flex: 1,
          paddingHorizontal: 16,
          paddingVertical: 20,
          backgroundColor: "#F0F1F2",
        }}
      >
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              tab === "current"
                ? styles.segmentBtnActive
                : styles.segmentBtnInactive,
            ]}
            onPress={() => setTab("current")}
          >
            <Text
              style={[
                styles.segmentBtnText,
                tab === "current" && styles.segmentBtnTextActive,
              ]}
            >
              CURRENT ORDERS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              tab === "past"
                ? styles.segmentBtnActive
                : styles.segmentBtnInactive,
            ]}
            onPress={() => setTab("past")}
          >
            <Text
              style={[
                styles.segmentBtnText,
                tab === "past" && styles.segmentBtnTextActive,
              ]}
            >
              PAST ORDERS
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderListItem
              order={item}
              type={tab}
              onTrack={() =>
                navigation.navigate("orderTrackingScreen", { order: item })
              }
              onRate={() =>
                navigation.navigate("rateTruckScreen", { order: item })
              }
              onReorder={() => {}}
              onDetails={() =>
                navigation.navigate("orderDetailsScreen", { order: item })
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No orders found.</Text>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  headerWrap: {
    alignItems: "center",
    backgroundColor: AppColor.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColor.borderColor,
    paddingTop: Platform.OS === "ios" ? 60 : 24,
    paddingBottom: 10,
  },
  header: {
    fontFamily: Primary400,
    fontSize: 22,
  },
  segmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  segmentBtn: {
    width: "48%",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppColor.primary,
    alignItems: "center",
  },
  segmentBtnActive: {
    backgroundColor: AppColor.primary,
  },
  segmentBtnInactive: {
    borderStyle: "dashed",
  },
  segmentBtnText: {
    fontFamily: Secondary400,
    fontSize: 15,
    color: AppColor.primary,
    textAlign: "center",
    paddingVertical: 16,
  },
  segmentBtnTextActive: {
    color: AppColor.white,
    fontFamily: Primary400,
  },
  emptyText: {
    textAlign: "center",
    color: AppColor.subText,
    marginTop: 40,
    fontFamily: Secondary400,
  },
});

export default OrdersScreen;
