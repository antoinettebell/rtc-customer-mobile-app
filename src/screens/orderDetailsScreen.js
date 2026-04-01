import React, { useState, useEffect } from "react";
import {
  RefreshControl,
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
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import StatusBarManager from "../components/StatusBarManager";
import {
  AppColor,
  Mulish700,
  Mulish400,
  Mulish600,
  Mulish500,
} from "../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";
import { getOrderByOrderId_API } from "../apiFolder/appAPI";
import {
  orderCurrentStatusNames,
  orderStatusStrings,
  PaymentMethodNames,
} from "../utils/constants";
import moment from "moment";
import AppImage from "../components/AppImage";
import { extractAdvanceOrderLocationAndTime } from "../helpers/order.helper";
import { Divider, IconButton } from "react-native-paper";

import { getRewardItemsDisplay } from "../helpers/discount.helper";
import { foodTypeStrings } from "../utils/constants";

const OrderDetailsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  const params = route?.params;
  const orderId = params?.orderId;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [locationTimeAdvanceData, setLocationTimeAdvanceData] = useState(null);

  useEffect(() => {
    fetchOrderDetails({ type: "init" });
  }, [orderId]);

  const fetchOrderDetails = async ({ type }) => {
    if (type === "refresh") {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await getOrderByOrderId_API(orderId);
      console.log("response => ", response);
      if (response?.success && response?.data) {
        setOrder(response.data.order);
        setLocationTimeAdvanceData(
          extractAdvanceOrderLocationAndTime(response.data.order)
        );
      } else {
        setOrder(null);
        setLocationTimeAdvanceData(null);
        setError("Order not found");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch order details");
      console.error("Error fetching order details:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={{ width: "20%" }}>
            <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          </View>
          <Text style={styles.headerTitle}>{"Order Details"}</Text>
          <View style={{ width: "20%" }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOrderDetails({ type: "refresh" })}
            tintColor={AppColor.primary}
          />
        }
      >
        {loading ? (
          <View
            style={[
              styles.container,
              styles.centerContainer,
              { paddingBottom: insets.bottom },
            ]}
          >
            <ActivityIndicator size="large" color={AppColor.primary} />
          </View>
        ) : error ? (
          <View style={[styles.container, styles.centerContainer]}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => fetchOrderDetails({ type: "refresh" })}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !order ? (
          <View style={[styles.container, styles.centerContainer]}>
            <Text style={styles.errorText}>Order not found</Text>
          </View>
        ) : (
          <View style={styles.contentWrap}>
            {/* Advance Order Location and Time */}
            {locationTimeAdvanceData?.advanceOrder ? (
              <View
                style={{
                  marginBottom: 16,
                  paddingHorizontal: 8,
                  paddingVertical: 16,
                  borderWidth: 1,
                  borderRadius: 8,
                  borderColor: AppColor.border,
                  backgroundColor: "rgba(252, 123, 3, 0.1)",
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: Mulish700,
                    fontSize: 18,
                    color: AppColor.primary,
                    alignSelf: "center",
                  }}
                >
                  {"Advance Order"}
                </Text>
                <Divider
                  style={{
                    marginVertical: 16,
                    backgroundColor: AppColor.primary,
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginHorizontal: 8,
                    marginTop: 8,
                    gap: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: Mulish400,
                      color: AppColor.black,
                    }}
                  >
                    {"Location"}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 14,
                      fontFamily: Mulish400,
                      color: AppColor.black,
                    }}
                  >
                    {locationTimeAdvanceData?.advanceLocationTitle}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginHorizontal: 8,
                    marginTop: 8,
                    gap: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: Mulish400,
                      color: AppColor.black,
                    }}
                  >
                    {"Time"}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 14,
                      fontFamily: Mulish400,
                      color: AppColor.black,
                    }}
                  >
                    {locationTimeAdvanceData?.advanceTime}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Order Details Card */}
            <View style={styles.card}>
              <View style={styles.headerRow}>
                <Text style={styles.orderId}>
                  Order #{order.orderNumber || order._id}
                </Text>
                <View
                  style={{
                    maxWidth: "25%",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 4,
                  }}
                >
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={16}
                    color={AppColor.black}
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 14,
                      fontFamily: Mulish400,
                      color: AppColor.black,
                    }}
                  >
                    {locationTimeAdvanceData?.locationTitle || ""}
                  </Text>
                </View>
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
                    <Text style={styles.truckName}>
                      {order?.foodTruck?.name}
                    </Text>
                    <Text style={styles.itemsCount}>
                      {(order?.items?.length ?? 0) + " Items"}
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
                    />
                    <Text style={styles.orderDate}>
                      {moment(order.createdAt).format("hh:mm A")}
                    </Text>
                  </View>
                </View>
              </View>
              <Divider />
              <View style={styles.itemsList}>
                {order?.items?.map((itm) => {
                  const raw = itm?.menuItem;
                  // Merge line-level fields (always stored on order) with fullMenuItemData snapshot
                  const menuItem = {
                    ...(raw || {}),
                    name: raw?.name || itm?.name,
                    imgUrls:
                      raw?.imgUrls?.length > 0 ? raw.imgUrls : itm?.imgUrls,
                    discountType: raw?.discountType ?? itm?.discountType,
                    description: raw?.description ?? itm?.description,
                  };
                  const comboItemsList =
                    menuItem?.comboItems?.length > 0
                      ? menuItem.comboItems
                      : itm?.comboItems || [];
                  const rewardItems = getRewardItemsDisplay(menuItem, itm?.qty);
                  const hasRewardNested = rewardItems.length > 0;
                  const hasComboNested = comboItemsList.length > 0;
                  const discountType = menuItem?.discountType;
                  const isBogoType = ["BOGO", "BOGOHO"].includes(
                    String(discountType || "").toUpperCase()
                  );
                  const comboSectionLabel =
                    String(menuItem?.itemType || "").toUpperCase() ===
                    foodTypeStrings.combo
                      ? "Combo includes"
                      : "Included selections";

                  return (
                    <View key={itm?.menuItemId} style={styles.orderLineBlock}>
                      <View style={styles.orderLineMainRow}>
                        <AppImage
                          uri={menuItem?.imgUrls?.[0]}
                          containerStyle={styles.orderLineMainImage}
                        />
                        <View style={styles.orderLineMainInfo}>
                          <Text style={styles.orderLineMainTitle}>
                            {menuItem?.name || ""}
                          </Text>
                          <Text style={styles.orderLineMainMeta}>
                            {`Qty ${itm?.qty ?? 0}`}
                          </Text>
                          {itm.customization ? (
                            <Text style={styles.orderLineCustomization}>
                              {itm.customization}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={styles.orderLineMainPrice}>
                          ${Number(itm?.total || 0).toFixed(2)}
                        </Text>
                      </View>

                      {hasRewardNested ? (
                        <View style={styles.nestedSection}>
                          <Text style={styles.nestedSectionLabel}>
                            {discountType
                              ? `Included with offer · ${discountType}`
                              : "Included with offer"}
                          </Text>
                          {rewardItems.map((rewardItem, index) => (
                            <View
                              style={[
                                styles.nestedItemRow,
                                index === rewardItems.length - 1 &&
                                  styles.nestedItemRowLast,
                              ]}
                              key={rewardItem._id || `r-${index}`}
                            >
                              <AppImage
                                uri={rewardItem.displayImg}
                                containerStyle={styles.nestedFoodImg}
                              />
                              <View style={styles.nestedItemDetails}>
                                <Text style={styles.nestedItemBadge}>
                                  Reward
                                </Text>
                                <Text
                                  style={styles.nestedItemTitle}
                                  numberOfLines={2}
                                >
                                  {rewardItem.displayName || ""}
                                </Text>
                                {rewardItem.displayDesc ? (
                                  <Text
                                    style={styles.nestedItemDesc}
                                    numberOfLines={2}
                                  >
                                    {rewardItem.displayDesc}
                                  </Text>
                                ) : null}
                              </View>
                              <View style={styles.nestedRowRight}>
                                {!isBogoType ? (
                                  <Text style={styles.nestedQtyText}>{`×${rewardItem.displayQty || 0}`}</Text>
                                ) : null}
                                <Text style={styles.nestedItemLinePrice}>
                                  {rewardItem.displayPrice}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      {hasComboNested ? (
                        <View
                          style={[
                            styles.nestedSection,
                            hasRewardNested && styles.nestedSectionAfterSibling,
                          ]}
                        >
                          <Text style={styles.nestedSectionLabel}>
                            {comboSectionLabel}
                          </Text>
                          {comboItemsList.map((comboItem, cIdx) => (
                            <View
                              style={[
                                styles.nestedItemRow,
                                cIdx === comboItemsList.length - 1 &&
                                  styles.nestedItemRowLast,
                              ]}
                              key={comboItem?._id || `c-${cIdx}`}
                            >
                              <AppImage
                                uri={comboItem?.imgUrls?.[0]}
                                containerStyle={styles.nestedFoodImg}
                              />
                              <View style={styles.nestedItemDetails}>
                                <Text style={styles.nestedItemBadgeCombo}>
                                  Combo item
                                </Text>
                                <Text
                                  style={styles.nestedItemTitle}
                                  numberOfLines={2}
                                >
                                  {comboItem.name}
                                </Text>
                                {comboItem.description ? (
                                  <Text
                                    style={styles.nestedItemDesc}
                                    numberOfLines={2}
                                  >
                                    {comboItem.description}
                                  </Text>
                                ) : null}
                                <Text style={styles.nestedItemPriceMuted}>
                                  Part of combo
                                </Text>
                              </View>
                              <View style={styles.nestedRowRight}>
                                <Text style={styles.nestedQtyText}>{`×${itm.qty}`}</Text>
                                <Text style={styles.nestedItemLinePrice}>
                                  {`$${((comboItem?.price || 0) * itm.qty).toFixed(2)}`}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
              <Divider />
              <View style={styles.footerRow}>
                <Text style={styles.total}>
                  ${(order?.subTotal || 0).toFixed(2)}
                </Text>
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

            {/* Order Summary Card */}
            <View style={styles.bottomSection}>
              <View style={styles.totalSection}>
                <View style={[styles.row, { marginTop: 0, marginBottom: 15 }]}>
                  <Text style={styles.sectionTitle}>{"Order Total"}</Text>
                  <Text style={styles.sectionTitle}>
                    ${(order?.subTotal || 0).toFixed(2)}
                  </Text>
                </View>
                <Divider />
                <View style={styles.row}>
                  <Text style={styles.orderDetailsTxt}>
                    {"Coupon Discount"}
                  </Text>
                  <Text style={styles.orderDetailsTxt}>
                    {`- $${(order?.discount || 0).toFixed(2)}`}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.orderDetailsTxt}>{"Sales Tax"}</Text>
                  <Text style={styles.orderDetailsTxt}>
                    ${(order?.taxAmount || 0).toFixed(2)}
                  </Text>
                </View>
                <Divider style={{ marginVertical: 10 }} />
                <View style={[styles.row, { marginTop: 0 }]}>
                  <Text style={styles.orderDetailsTxt}>{"Total with Tax"}</Text>
                  <Text style={styles.orderDetailsTxt}>
                    $
                    {(
                      (order?.totalAfterDiscount || 0) + (order?.taxAmount || 0)
                    ).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.orderDetailsTxt}>
                    {"Payment Processing Fee"}
                  </Text>
                  <Text style={styles.orderDetailsTxt}>
                    ${(order?.paymentProcessingFee || 0).toFixed(2)}
                  </Text>
                </View>
                {order?.freeDessertApplied && (
                  <View style={styles.row}>
                    <View style={styles.dessertRow}>
                      <Text style={styles.totalRowItemTxt}>1 x Dessert</Text>
                      <View style={styles.freeBadge}>
                        <Text style={styles.freeBadgeText}>Free</Text>
                      </View>
                    </View>
                    <Text style={styles.totalRowItemTxt}>$0.00</Text>
                  </View>
                )}
                {order?.tipsAmount > 0 && (
                  <>
                    <Divider style={{ marginVertical: 10 }} />
                    <View style={[styles.row, { marginTop: 0 }]}>
                      <Text style={styles.orderDetailsTxt}>{"Tip"}</Text>
                      <Text style={styles.orderDetailsTxt}>
                        ${(order?.tipsAmount || 0).toFixed(2)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Payment Mode */}
            <View style={styles.bottomSection}>
              <View style={styles.totalSection}>
                <View style={[styles.row, { marginTop: 0, marginBottom: 15 }]}>
                  <Text style={styles.sectionTitle}>{"Payment Status"}</Text>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { textTransform: "capitalize" },
                    ]}
                  >
                    {order?.paymentStatus || "N/A"}
                  </Text>
                </View>
                <Divider />
                <View style={styles.row}>
                  <Text style={styles.orderDetailsTxt}>{"Payment Method"}</Text>
                  <Text style={styles.orderDetailsTxt}>
                    {PaymentMethodNames[order?.paymentMethod || "COD"]}
                  </Text>
                </View>
                {["APPLE_PAY", "GOOGLE_PAY"].includes(order?.paymentMethod) && (
                  <>
                    <View style={styles.row}>
                      <Text style={styles.orderDetailsTxt}>{"Auth Code"}</Text>
                      <Text style={styles.orderDetailsTxt}>
                        {order?.authCode || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.orderDetailsTxt}>{"Invoice No"}</Text>
                      <Text style={styles.orderDetailsTxt}>
                        {order?.invoiceNumber || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.orderDetailsTxt}>
                        {"Transaction ID"}
                      </Text>
                      <Text style={styles.orderDetailsTxt}>
                        {order?.transactionId || "N/A"}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      {order && (
        <View style={styles.footerContainer}>
          <View style={styles.totalAmountRow}>
            <Text style={styles.totalAmountLabel}>{"Total Amount"}</Text>
            <Text style={styles.totalAmountValue}>
              ${(order?.total || 0).toFixed(2)}
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: AppColor.border,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Mulish700,
    textAlign: "center",
    color: AppColor.text,
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
  itemDesc: {
    fontSize: 13,
    fontFamily: Mulish400,
    color: AppColor.subText,
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
    gap: 4,
  },
  timeIcon: {
    marginRight: 8,
  },
  itemsList: {
    marginVertical: 15,
    gap: 0,
  },
  orderLineBlock: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColor.borderColor,
  },
  orderLineMainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  orderLineMainImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  orderLineMainInfo: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  orderLineMainTitle: {
    fontFamily: Mulish700,
    fontSize: 15,
    color: AppColor.text,
  },
  orderLineMainMeta: {
    fontFamily: Mulish400,
    fontSize: 13,
    color: AppColor.textHighlighter,
  },
  orderLineCustomization: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.text,
    marginTop: 2,
  },
  orderLineMainPrice: {
    fontFamily: Mulish700,
    fontSize: 15,
    color: AppColor.primary,
    minWidth: 72,
    textAlign: "right",
  },
  nestedSection: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: AppColor.white,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderLeftWidth: 3,
    borderLeftColor: AppColor.primary,
    ...Platform.select({
      ios: {
        shadowColor: AppColor.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  nestedSectionAfterSibling: {
    marginTop: 10,
  },
  nestedSectionLabel: {
    fontFamily: Mulish700,
    fontSize: 11,
    color: AppColor.gray,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  nestedItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  nestedItemRowLast: {
    marginBottom: 0,
  },
  nestedFoodImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  nestedItemDetails: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  nestedItemBadge: {
    alignSelf: "flex-start",
    fontFamily: Mulish600,
    fontSize: 10,
    color: AppColor.primary,
    backgroundColor: "#FFF0E6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  nestedItemBadgeCombo: {
    alignSelf: "flex-start",
    fontFamily: Mulish600,
    fontSize: 10,
    color: AppColor.primary,
    backgroundColor: "#E8F4FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  nestedItemTitle: {
    fontFamily: Mulish600,
    fontSize: 14,
    color: AppColor.text,
  },
  nestedItemDesc: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.textHighlighter,
  },
  nestedItemPriceMuted: {
    fontFamily: Mulish400,
    fontSize: 12,
    color: AppColor.textHighlighter,
    fontStyle: "italic",
  },
  nestedRowRight: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
    gap: 4,
    minWidth: 56,
    paddingTop: 2,
  },
  nestedQtyText: {
    fontFamily: Mulish600,
    fontSize: 13,
    color: AppColor.text,
  },
  nestedItemLinePrice: {
    fontFamily: Mulish600,
    fontSize: 13,
    color: AppColor.primary,
    textAlign: "right",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemInfo: {
    flex: 1,
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
    flexGrow: 1,
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
  dessertRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  freeBadge: {
    backgroundColor: "#C2FFFF",
    borderRadius: 4,
    marginLeft: 16,
  },
  freeBadgeText: {
    color: "#008B8B",
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  totalRowItemTxt: {
    fontFamily: Mulish400,
    fontSize: 14,
  },
});

export default OrderDetailsScreen;
