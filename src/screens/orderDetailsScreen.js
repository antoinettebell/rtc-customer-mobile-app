import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Mulish700, Mulish400, Mulish600 } from "../utils/theme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FastImage from "@d11/react-native-fast-image";
import AppHeader from "../components/AppHeader";
import { getOrderByOrderId_API } from "../apiFolder/appAPI";
import {
  orderCurrentStatusNames,
  orderStatusStrings,
} from "../utils/constants";
import moment from "moment";
import AppImage from "../components/AppImage";

const HR = () => <View style={styles.HR} />;

const OrderDetailsScreen = () => {
  const navigation = useNavigation();
  const { params } = useRoute();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const orderId = params?.orderId;

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await getOrderByOrderId_API(orderId);
      if (response?.data?.order) {
        console.log("response => ", response);
        setOrder(response.data.order);
      } else {
        setError("Order not found");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch order details");
      console.error("Error fetching order details:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
  };

  if (loading) {
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
          activeOpacity={0.7}
          onPress={fetchOrderDetails}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      <AppHeader headerTitle="Order Details" />

      <ScrollView
        style={styles.scrollViewContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrap}>
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.orderId}>
                Order #{order.orderNumber || order._id}
              </Text>
            </View>

            <View style={styles.truckRow}>
              <Pressable
                onPress={() =>
                  navigation.navigate("foodTruckDetailScreen", {
                    item: order?.foodTruck || {},
                  })
                }
                style={styles.truckRowLeft}
              >
                <AppImage
                  uri={order?.foodTruck?.logo}
                  containerStyle={styles.truckImg}
                />
                <View style={styles.truckInfo}>
                  <Text style={styles.truckName}>{order?.foodTruck?.name}</Text>
                  <Text style={styles.itemsCount}>
                    {order.items.length} Items
                  </Text>
                </View>
              </Pressable>
              <View style={styles.truckRowRight}>
                <Text style={styles.orderDate}>
                  {moment(order.createdAt).format("DD MMM, YYYY")}
                </Text>
                <View style={styles.timeRow}>
                  <MaterialIcons
                    name="access-time"
                    size={14}
                    color={AppColor.grayText}
                    style={styles.timeIcon}
                  />
                  <Text style={styles.orderDate}>
                    {moment(order.createdAt).format("hh:mm A")}
                  </Text>
                </View>
              </View>
            </View>
            <HR />
            <View style={styles.itemsList}>
              {order.items.map((itm) => (
                <View style={styles.itemRow} key={itm?.menuItemId}>
                  <View style={styles.itemInfo}>
                    <Text
                      style={styles.itemText}
                    >{`${itm.qty} x ${itm.menuItem.name}`}</Text>
                    <Text style={styles.itemDesc}>
                      {itm.menuItem.description}
                    </Text>
                  </View>
                  <Text style={styles.itemText}>${itm.total.toFixed(2)}</Text>
                </View>
              ))}
            </View>
            <HR />

            <View style={styles.footerRow}>
              <Text style={styles.total}>${order.subTotal.toFixed(2)}</Text>
              {order.status !== "COMPLETED" &&
                order.status !== "CANCEL" &&
                order.status !== "REJECTED" && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.trackBtn}
                      onPress={() =>
                        navigation.navigate("orderTrackingScreen", {
                          order: order,
                        })
                      }
                    >
                      <FontAwesome6
                        name="map-location-dot"
                        color={AppColor.white}
                        size={20}
                      />
                      <Text style={styles.trackBtnText}>Track</Text>
                    </TouchableOpacity>
                  </View>
                )}
            </View>
          </View>

          <View style={styles.bottomSection}>
            <View style={styles.totalSection}>
              <View style={[styles.row, { marginTop: 0, marginBottom: 15 }]}>
                <Text style={styles.sectionTitle}>TOTAL ORDER</Text>
                <Text style={styles.sectionTitle}>
                  ${order.subTotal.toFixed(2)}
                </Text>
              </View>
              <HR />
              <View style={styles.row}>
                <Text style={styles.orderDetailsTxt}>Sales Tax</Text>
                <Text style={styles.orderDetailsTxt}>
                  ${order.taxAmount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.orderDetailsTxt}>Discount</Text>
                <Text style={styles.orderDetailsTxt}>
                  {`- $${order.discount.toFixed(2)}`}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.orderDetailsTxt}>Total With Tax</Text>
                <Text style={styles.orderDetailsTxt}>
                  ${(order.totalAfterDiscount || 0).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footerContainer}>
        <View style={styles.totalAmountRow}>
          <Text style={styles.totalAmountLabel}>TOTAL AMOUNT</Text>
          <Text style={styles.totalAmountValue}>
            ${(order.totalAfterDiscount || 0).toFixed(2)}
          </Text>
        </View>

        {order.orderStatus === orderStatusStrings.placed ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.7}
            onPress={() => {
              navigation.navigate("cancelOrderScreen", { order: order });
            }}
          >
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        ) : (
          <View
            style={{
              height: 48,
              borderRadius: 5,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: AppColor.primary + 20,
            }}
          >
            <Text style={[styles.cancelBtnText, { color: AppColor.black }]}>
              {orderCurrentStatusNames[order.orderStatus]}
            </Text>
          </View>
        )}
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
  errorText: {
    color: AppColor.error,
    fontFamily: Mulish400,
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
    fontFamily: Mulish700,
  },
  truckImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  truckName: {
    fontFamily: Mulish700,
    fontSize: 16,
  },
  orderDate: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.subText,
  },
  itemText: {
    fontFamily: Mulish400,
    fontSize: 13,
    color: AppColor.text,
    marginTop: 2,
  },
  trackBtn: {
    flexDirection: "row",
    borderRadius: 5,
    paddingVertical: 10,
    width: 100,
    backgroundColor: AppColor.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  trackBtnText: {
    color: AppColor.white,
    fontFamily: Mulish600,
    fontSize: 16,
  },
  totalSection: {
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: AppColor.white,
    ...Platform.select({
      ios: {
        shadowColor: AppColor.black,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontFamily: Mulish700,
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  footerContainer: {
    padding: 16,
    marginBottom: 20,
  },
  totalAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  totalAmountLabel: {
    fontFamily: Mulish700,
    fontSize: 16,
  },
  totalAmountValue: {
    fontFamily: Mulish700,
    fontSize: 18,
  },
  cancelBtn: {
    height: 48,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColor.snackbarError,
    ...Platform.select({
      ios: {
        shadowColor: AppColor.black,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cancelBtnText: {
    fontFamily: Mulish700,
    fontSize: 16,
    color: AppColor.white,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  orderId: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: "#6F6F6F",
  },
  truckRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  truckRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  truckInfo: {
    marginLeft: 10,
    gap: 4,
  },
  truckRowRight: {
    gap: 4,
    alignItems: "flex-end",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeIcon: {
    marginRight: 8,
  },
  itemsList: {
    marginVertical: 15,
    gap: 15,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemInfo: {
    gap: 4,
  },
  itemsCount: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: "#6F6F6F",
  },
  orderDetailsTxt: {
    fontFamily: Mulish400,
    fontSize: 14,
  },
  actionRow: {
    flexDirection: "row",
  },
  actionIcon: {
    width: 20,
    height: 20,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },
  total: {
    fontFamily: Mulish700,
    fontSize: 20,
    marginLeft: 6,
  },
  HR: {
    height: 1,
    backgroundColor: "#E5E5EA",
  },
  card: {
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: AppColor.white,
    ...Platform.select({
      ios: {
        shadowColor: AppColor.black,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  scrollViewContainer: {
    flex: 1,
    backgroundColor: AppColor.screenBg,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  bottomSection: {
    marginTop: 16,
  },
});

export default OrderDetailsScreen;
