import React, { useState, useEffect, memo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator as NativeIndicator,
  Platform,
} from "react-native";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Mulish700, Mulish400, Mulish600 } from "../utils/theme";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAllOrders_API } from "../apiFolder/appAPI";
import { useDispatch } from "react-redux";
import {
  foodTypeStrings,
  orderCurrentStatusNames,
  PROFILE_AVATAR,
} from "../utils/constants";
import FastImage from "@d11/react-native-fast-image";
import moment from "moment";
import { extractAdvanceOrderLocationAndTime } from "../helpers/order.helper";
import { Divider } from "react-native-paper";
import AppImage from "../components/AppImage";
import { useFocusEffect } from "@react-navigation/native";

const OrdersScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const [dataLoading, setDataLoading] = useState(false);
  const [activeStage, setActiveStage] = useState("current");
  const [orderData, setOrderData] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const calculateItemDisplayTotal = (item) => {
    const baseTotal = item?.total ?? 0;
    const discountType = item?.menuItem?.discountType;
    const discountRules = item?.menuItem?.discountRules;

    if (discountRules && discountRules.discount > 0) {
      // In the new rules engine, the 'total' from the backend already includes
      // the discounted reward items if it was a same-item reward.
      // So we don't need to multiply by 1.5 anymore.
      return baseTotal;
    }

    // Fallback for old BOGOHO logic
    if (discountType === "BOGOHO") {
      return baseTotal * 1.5;
    }
    return baseTotal;
  };

  // render order component
  const renderOrderComponent = ({ item, index }) => {
    const locationData = extractAdvanceOrderLocationAndTime(item);

    return (
      <TouchableOpacity
        key={index}
        activeOpacity={0.7}
        style={styles.orderDetailsContainer}
        onPress={() =>
          navigation.navigate("orderDetailsScreen", { orderId: item._id })
        }
      >
        {/* Order Header */}
        <View style={[styles.orderHeader, { marginTop: 0 }]}>
          <Text style={[styles.orderIdText, { color: AppColor.black }]}>
            {item?.availabilityId ? "Pre-Order" : "Regular Order"}
          </Text>
          <Text style={styles.orderStatusText}>
            {orderCurrentStatusNames[item.orderStatus]}
          </Text>
        </View>
        {/* Order ID and Location */}
        <View style={styles.orderIdLocationContainer}>
          <View style={{ width: "75%", paddingRight: 8 }}>
            <Text numberOfLines={1} style={styles.orderIdText}>
              {"Order #" + (item?.orderNumber || item?._id)}
            </Text>
          </View>
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={16}
              color={AppColor.black}
            />
            <Text numberOfLines={1} style={styles.locationText}>
              {locationData?.locationTitle}
            </Text>
          </View>
        </View>
        {/* Order User Details */}
        <View style={styles.orderHeader}>
          <View style={styles.orderUserImageContainer}>
            <AppImage
              uri={item?.foodTruck?.logo}
              containerStyle={styles.orderUserImage}
            />
          </View>
          <View style={styles.orderUserInfo}>
            <Text
              numberOfLines={1}
              style={styles.orderUserName}
            >{`${item?.foodTruck?.name || ""}`}</Text>
            <Text
              style={styles.orderItemCount}
            >{`${item?.items?.length || 0} Items`}</Text>
          </View>
          <View>
            <Text style={styles.orderDate}>
              {moment(item.createdAt).format("DD MMM, YYYY")}
            </Text>
            <View style={styles.orderTimeContainer}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={16}
                color="#6F6F6F"
              />
              <Text style={styles.orderTime}>
                {moment(item.createdAt).format("hh:mm A")}
              </Text>
            </View>
          </View>
        </View>
        {/* Divider */}
        <Divider style={styles.orderDivider} />
        {/* Items */}
        {(item?.items || []).slice(0, 3).map((i, index) => (
          <View style={styles.orderItemContainer} key={index}>
            <View style={styles.orderItemDetails}>
              <Text
                style={styles.orderItemName}
              >{`${i?.qty ?? 0} x ${i?.menuItem?.name || ""}`}</Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                {(() => {
                  const discountRules = i.menuItem?.discountRules;
                  if (discountRules && discountRules.discount > 0) {
                    const discountVal = discountRules.discount;
                    const promoText = discountVal === 1 ? "BOGO" : discountVal === 0.5 ? "BOGOHO" : "Offer";
                    return (
                      <Text style={styles.orderItemDescription} numberOfLines={2}>
                        {promoText}
                      </Text>
                    );
                  }
                  if (["BOGO", "BOGOHO"].includes(i.menuItem?.discountType)) {
                    return (
                      <Text style={styles.orderItemDescription} numberOfLines={2}>
                        {`${i.menuItem?.discountType}`}
                      </Text>
                    );
                  }
                  return null;
                })()}
                {i.menuItem?.itemType === foodTypeStrings.combo ? (
                  <Text style={styles.orderItemDescription} numberOfLines={2}>
                    {`${i.menuItem?.itemType}`}
                  </Text>
                ) : null}
              </View>
            </View>
            <View>
              <Text
                style={styles.orderItemPrice}
              >{`$${calculateItemDisplayTotal(i).toFixed(2)}`}</Text>
            </View>
          </View>
        ))}
        {item?.items?.length > 3 && (
          <Text style={styles.moreItemsText}>{`+${
            item?.items?.length - 3
          } more items`}</Text>
        )}
        {/* Divider */}
        <Divider style={styles.orderDivider} />
        {/* Total */}
        <View style={styles.orderTotalContainer}>
          <Text
            style={styles.orderTotalText}
          >{`$${(item?.total || 0).toFixed(2)}`}</Text>
          {activeStage === "past" ? (
            !item.hasReview ? (
              <TouchableOpacity
                style={styles.rateBtn}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate("rateTruckScreen", {
                    foodTruckId: item.foodTruckId,
                    orderId: item._id,
                  })
                }
              >
                <Text
                  style={[styles.orderBtnText, { color: AppColor.primary }]}
                >
                  {"★ Rate"}
                </Text>
              </TouchableOpacity>
            ) : null
          ) : (
            <TouchableOpacity
              style={styles.trackBtn}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("orderTrackingScreen", { order: item })
              }
            >
              <FontAwesome6
                name="map-location-dot"
                color={AppColor.white}
                size={20}
              />
              <Text style={styles.orderBtnText}>{"Track"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // render footer for loading indicator
  const renderFooter = () => {
    if (!isLoadingMore || dataLoading) return null;

    return (
      <View style={styles.footerContainer}>
        <NativeIndicator size="small" color={AppColor.primary} />
      </View>
    );
  };

  // render empty component
  const renderEmptyComponent = () => {
    return (
      <View style={styles.emptyContainer}>
        {dataLoading ? (
          <NativeIndicator size="large" color={AppColor.primary} />
        ) : (
          <Text style={styles.emptyText}>{"No orders found"}</Text>
        )}
      </View>
    );
  };

  // handle stage change
  const handleStageChange = (stage) => {
    setActiveStage(stage);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (!initialLoadDone) return;
    if (!isLoadingMore && hasMoreData) {
      getOrderDataFromAPI(currentPage + 1, true, activeStage === "past");
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    getOrderDataFromAPI(1, false, activeStage === "past");
  };

  // fetch order data from API
  const getOrderDataFromAPI = async (
    page = 1,
    isLoadMore = false,
    isPast = false
  ) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setDataLoading(true);
    }

    try {
      const response = await getAllOrders_API({
        page,
        limit: 20,
        orderStatus: isPast
          ? "CANCEL, REJECTED, COMPLETED"
          : "PLACED, ACCEPTED,PREPARING, READY_FOR_PICKUP",
      });
      console.log("reponse => ", response);
      if (response?.success && response?.data) {
        setTotalPages(response.data.totalPages);
        setCurrentPage(page);

        if (isLoadMore) {
          // Append new data for load more
          setOrderData((prev) => [...prev, ...response.data.orderList]);
        } else {
          // Replace data for initial load or refresh
          setOrderData(response.data.orderList);
        }

        // Check if there's more data to load
        setHasMoreData(page < response.data.totalPages);
      }
    } catch (error) {
      console.log("error => ", error);
      // dispatch(
      //   showSnackbar({
      //     type: "error",
      //     message: error.message,
      //   })
      // );
    } finally {
      setDataLoading(false);
      setIsLoadingMore(false);
      if (!isLoadMore) {
        setInitialLoadDone(true);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      setCurrentPage(1);
      setHasMoreData(true);
      setOrderData([]);
      setInitialLoadDone(false);
      getOrderDataFromAPI(1, false, activeStage === "past");
    }, [activeStage])
  );

  return (
    <View style={styles.container}>
      <StatusBarManager />

      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>{"My Orders"}</Text>
      </View>

      {/* Button Container */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={
            activeStage === "current"
              ? styles.activeButton
              : styles.inactiveButton
          }
          onPress={() => handleStageChange("current")}
          disabled={dataLoading}
        >
          <Text
            style={
              activeStage === "current"
                ? styles.activeButtonText
                : styles.inactiveButtonText
            }
          >
            {"Current Orders"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={
            activeStage === "past" ? styles.activeButton : styles.inactiveButton
          }
          onPress={() => handleStageChange("past")}
          disabled={dataLoading}
        >
          <Text
            style={
              activeStage === "past"
                ? styles.activeButtonText
                : styles.inactiveButtonText
            }
          >
            {"Past Orders"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        <FlatList
          data={orderData}
          extraData={orderData}
          keyExtractor={(item, index) =>
            item?._id ? item._id.toString() : index.toString()
          }
          renderItem={renderOrderComponent}
          contentContainerStyle={styles.flatListContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.8}
          ListFooterComponent={renderFooter}
          refreshing={dataLoading}
          onRefresh={handleRefresh}
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

export default memo(OrdersScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  // Header
  headerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: AppColor.border,
    backgroundColor: AppColor.white,
  },
  headerTitle: {
    fontFamily: Mulish700,
    fontSize: 20,
    color: AppColor.text,
  },

  // Button Container
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
    padding: 16,
  },
  activeButton: {
    height: 46,
    flex: 1 / 2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4.24,
    backgroundColor: AppColor.primary,
  },
  activeButtonText: {
    fontFamily: Mulish700,
    fontSize: 16,
    color: AppColor.white,
  },
  inactiveButton: {
    height: 46,
    flex: 1 / 2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4.24,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: AppColor.primary,
    backgroundColor: AppColor.white,
  },
  inactiveButtonText: {
    fontFamily: Mulish700,
    fontSize: 16,
    color: AppColor.primary,
  },

  // Content Container
  contentContainer: {
    flex: 1,
  },
  flatListContent: {
    flexGrow: 1,
    gap: 10,
  },
  footerContainer: {
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.black,
  },

  // Order Details Container
  orderDetailsContainer: {
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: AppColor.border,
    backgroundColor: AppColor.white,
  },
  orderIdText: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: "#6F6F6F",
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 16,
  },
  orderUserImageContainer: {
    height: 50,
    width: 50,
    borderWidth: 1,
    borderRadius: 24.5,
    borderColor: AppColor.border,
  },
  orderUserImage: {
    height: 48,
    width: 48,
    borderRadius: 24,
  },
  orderUserInfo: {
    flex: 1,
    marginHorizontal: 8,
  },
  orderUserName: {
    fontFamily: Mulish700,
    fontSize: 16,
    color: AppColor.black,
  },
  orderItemCount: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: "#6F6F6F",
    paddingVertical: 5,
  },
  orderDate: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: "#6F6F6F",
    textAlign: "right",
  },
  orderTimeContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
  },
  orderTime: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: "#6F6F6F",
    textAlign: "right",
  },
  orderDivider: {
    // marginHorizontal: 8,
  },
  orderTotalContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  orderTotalText: {
    fontFamily: Mulish400,
    fontSize: 20,
    color: AppColor.black,
  },
  orderItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginVertical: 8,
  },
  orderItemDetails: {
    flex: 1,
    gap: 4,
  },
  orderItemName: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.black,
  },
  orderItemDescription: {
    fontFamily: Mulish400,
    fontSize: 10,
    color: AppColor.black,
  },
  orderItemPrice: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.black,
  },

  moreItemsText: {
    fontFamily: Mulish600,
    fontSize: 14,
    color: AppColor.primary,
    textAlign: "left",
    marginVertical: 10,
    marginHorizontal: 8,
  },

  trackBtn: {
    height: 36,
    gap: 5,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColor.primary,
    paddingHorizontal: 16,
  },
  rateBtn: {
    height: 36,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: AppColor.primary,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColor.white,
    paddingHorizontal: 16,
  },
  orderBtnText: {
    color: AppColor.white,
    fontFamily: Mulish600,
    fontSize: 16,
  },
  orderStatusText: {
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.primary,
    textTransform: "capitalize",
    textAlign: "right",
  },

  // Order ID and Location
  orderIdLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationContainer: {
    maxWidth: "25%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontFamily: Mulish400,
    color: AppColor.black,
  },
});
