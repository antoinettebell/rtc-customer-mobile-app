import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import OrderListItem from "../components/OrderListItem";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAllOrders_API } from "../apiFolder/appAPI";

const OrdersScreen = () => {
  const [tab, setTab] = useState("current");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchOrders();
    }
  }, [isFocused]);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await getAllOrders_API();
      if (response?.data?.orderList) {
        setOrders(response.data.orderList);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch orders");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true); // Silent refresh without showing full screen loader
  };

  // Filter orders based on status
  const filteredOrders = orders.filter((order) => {
    if (tab === "current") {
      return (
        order.orderStatus !== "COMPLETED" && order.orderStatus !== "CANCEL"
      );
    } else {
      return order.orderStatus === "COMPLETED";
    }
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: "numeric", month: "short", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const renderOrderItem = ({ item }) => {
    const orderData = {
      id: item._id,
      truck: item.foodTruck?.name || "Unknown Truck",
      items: item.items.map((menuItem) => ({
        qty: menuItem.qty,
        name: menuItem.menuItem?.name || "Unknown Item",
        desc: menuItem.menuItem?.description || "",
        price: menuItem.price,
      })),
      total: item.total,
      date: formatDate(item.createdAt),
      time: formatTime(item.deliveryTime || item.pickupTime),
      image: item.foodTruck?.logo
        ? { uri: item.foodTruck.logo }
        : require("../assets/images/FT-Demo-01.png"),
      status: item.orderStatus === "COMPLETED" ? "past" : "current",
      isAdvanceOrder: !!item.availabilityId,
    };

    return (
      <OrderListItem
        order={orderData}
        type={tab}
        onTrack={() =>
          navigation.navigate("orderTrackingScreen", { order: orderData })
        }
        onRate={() =>
          tab === "past" &&
          navigation.navigate("rateTruckScreen", { order: orderData })
        }
        onReorder={() => {
          if (tab === "past") {
            // Handle reorder logic here
            console.log("Reorder:", orderData.id);
          }
        }}
        onDetails={() =>
          navigation.navigate("orderDetailsScreen", { orderId: item._id })
        }
      />
    );
  };
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={AppColor.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={() => fetchOrders()}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <View style={styles.headerWrap}>
        <Text style={styles.header}>MY ORDERS</Text>
      </View>

      <View style={styles.contentWrap}>
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
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AppColor.primary]}
              tintColor={AppColor.primary}
              progressViewOffset={50} // Adjust this if you have a header
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {tab === "current"
                  ? "No current orders found."
                  : "No past orders found."}
              </Text>
              <TouchableOpacity
                onPress={() => fetchOrders()}
                style={styles.refreshButton}
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={styles.flatListContent}
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
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerWrap: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: AppColor.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColor.borderColor,
  },
  header: {
    fontFamily: Primary400,
    fontSize: 22,
    color: AppColor.text,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: AppColor.screenBg,
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
    backgroundColor: AppColor.white,
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
  flatListContent: {
    flexGrow: 1,
    gap: 15,
  },
  errorText: {
    color: AppColor.error,
    fontFamily: Secondary400,
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: AppColor.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  retryButtonText: {
    color: AppColor.white,
    fontFamily: Primary400,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  refreshButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: AppColor.primary,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: AppColor.white,
    fontFamily: Primary400,
  },
  refreshIndicator: {
    paddingVertical: 10,
  },
});

export default OrdersScreen;
