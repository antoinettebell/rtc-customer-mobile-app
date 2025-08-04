import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
  ActivityIndicator as NativeIndicator,
  Platform,
  Pressable,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useIsFocused } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Modal from "react-native-modal"; // Import react-native-modal
import moment from "moment";
import { Divider, ActivityIndicator, TextInput } from "react-native-paper";
import ActionSheet from "react-native-actions-sheet";
import {
  AppColor,
  Mulish700,
  Mulish400,
  Mulish600,
  Mulish500,
} from "../utils/theme";
import AppHeader from "../components/AppHeader";
import StatusBarManager from "../components/StatusBarManager";
import AppImage from "../components/AppImage";
import {
  checkItems_API,
  checkTax_API,
  getFoodTruckDetailById_API,
  placeFoodOrder_API,
} from "../apiFolder/appAPI";
import { onGuest, onSignOut } from "../redux/slices/authSlice";
import { clearUserSlice } from "../redux/slices/userSlice";
import { clearFavorites } from "../redux/slices/favoritesSlice";
import { clearFoodTruckProfileSlice } from "../redux/slices/foodTruckProfileSlice";
import { clearLocationSlice } from "../redux/slices/locationSlice";
import {
  addItemToOrder,
  removeItemFromOrder,
  clearCurrentOrder,
  clearOrderSlice,
  updateAllItemsOfOrder,
  updateItemProperty,
} from "../redux/slices/orderSlice";
import { onlinePyamentApplicablePlanList } from "../utils/constants";

const CheckoutScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const actionSheetRef = useRef(null);
  const actionSheetRef2 = useRef(null);

  const { isSignedIn } = useSelector((state) => state.authReducer);
  const order = useSelector((state) => state.orderReducer.currentOrder);

  const { foodTruckId = null } = route.params || {};

  const [dataLoading, setDataLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [instructionItemId, setInstructionItemId] = useState(null);
  const [instructionText, setInstructionText] = useState("");

  const [foodTruckDetail, setFoodTruckDetail] = useState(null);
  const [truckCurrentLocation, setTruckCurrentLocation] = useState(null);
  const [taxData, setTaxData] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("Google Pay");

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAvailability, setSelectedAvailability] = useState(null);

  const [preventAPI, setPreventAPI] = useState(false);

  const subtotal = useMemo(() => order.subtotal, [order.subtotal]);
  const salesTaxRate = taxData?.salesTax || 0;
  const processingFeeRate = taxData?.paymentProcessingFee || 0;
  const salesTax = useMemo(
    () => subtotal * (salesTaxRate / 100),
    [subtotal, salesTaxRate]
  );
  const totalBeforeDiscount = useMemo(
    () => subtotal + salesTax,
    [subtotal, salesTax]
  );
  const discount = useMemo(() => {
    if (!coupon) return 0;
    if (coupon.type === "PERCENTAGE") {
      const discountValue = totalBeforeDiscount * (coupon.value / 100);
      return coupon.maxDiscount > 0
        ? Math.min(discountValue, coupon.maxDiscount)
        : discountValue;
    } else if (coupon.type === "FIXED") {
      return Math.min(coupon.value, totalBeforeDiscount);
    }
    return 0;
  }, [coupon, totalBeforeDiscount]);
  const totalWithTax = useMemo(
    () => totalBeforeDiscount - discount,
    [totalBeforeDiscount, discount]
  );
  const processingFee = useMemo(
    () => totalWithTax * (processingFeeRate / 100),
    [totalWithTax, processingFeeRate]
  );
  const total = useMemo(
    () => totalWithTax + processingFee,
    [totalWithTax, processingFee]
  );

  const hasFreeDessert = subtotal > 15;

  const getDeliveryTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toTimeString().slice(0, 5);
  };

  const handleAdd = (item) => {
    const effectiveMaxQty = item.maxQty !== undefined ? item.maxQty : 100;

    if (item.quantity >= effectiveMaxQty) {
      Alert.alert(
        "Quantity Limit Reached",
        `You can only add a maximum of ${effectiveMaxQty} of this item.`
      );
      return;
    }

    dispatch(
      addItemToOrder({
        foodTruckId: order.foodTruckId,
        foodTruckName: order.foodTruckName,
        foodTruckLogo: order.foodTruckLogo,
        item: { ...item },
      })
    );
  };

  const handleRemove = (item) => {
    dispatch(removeItemFromOrder({ itemId: item._id }));
  };

  const handleConfirmOrder = async () => {
    if (order.items.length === 0) {
      Alert.alert("No Items", "Please add items to your order first.");
      return;
    }

    if (
      !foodTruckDetail?.currentLocation &&
      !selectedLocation &&
      !selectedAvailability
    ) {
      Alert.alert("Location required", "Please select a location.");
      return;
    } else if (foodTruckDetail?.currentLocation !== selectedLocation?._id) {
      if (!selectedAvailability) {
        Alert.alert(
          "Time slot required",
          "Please select a time slot to place your order."
        );
        return;
      }
    }

    let payload = {
      foodTruckId: foodTruckId,
      locationId: selectedLocation?._id,
      // deliveryTime: getDeliveryTime(),
      items: order.items.map((item) => {
        const itemPayload = {
          menuItemId: item._id,
          qty: item.quantity,
        };

        if (item.allowCustomize) {
          itemPayload.customization = item.customizationInput;
        }

        return itemPayload;
      }),
    };
    if (selectedAvailability) {
      payload.availabilityId = selectedAvailability?._id;
    }
    if (coupon) {
      payload.couponId = coupon?._id;
    }

    setLoading(true);
    try {
      const response = await placeFoodOrder_API(payload);
      console.log("✅ Order placed:", response);
      if (response?.success && response?.data) {
        dispatch(clearCurrentOrder());
        // Alert.alert("Success", "Your order has been placed!");
        navigation.navigate("orderPlacedScreen", {
          orderNumber: response?.data?.order?.orderNumber,
        });
      }
    } catch (error) {
      console.error("❌ Order failed:", error);
      Alert.alert("Error", error?.message || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  const onLocationDonePress = () => {
    if (!selectedLocation) {
      Alert.alert("Location required", "Please select a location.");
    } else if (
      truckCurrentLocation?._id !== selectedLocation._id &&
      !selectedAvailability
    ) {
      Alert.alert(
        "Time slot required",
        "Please select a time slot to place your order."
      );
    } else {
      getTaxInfoFromAPI();
      actionSheetRef.current?.hide();
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
  };

  const onAddInstructionPress = (itemId, text) => {
    actionSheetRef2?.current?.show();
    setInstructionItemId(itemId);
    setInstructionText(text);
  };

  const onCloseInstructionPress = () => {
    actionSheetRef2?.current?.hide();
    dispatch(
      updateItemProperty({
        itemId: instructionItemId,
        keyName: "customizationInput",
        value: instructionText,
      })
    );
    setInstructionItemId(null);
    setInstructionText("");
  };

  const renderItem = ({ item }) => {
    const effectiveMinQty = item.minQty !== undefined ? item.minQty : 1;
    const effectiveMaxQty = item.maxQty !== undefined ? item.maxQty : 100;

    const isDecrementDisabled =
      item.quantity <= effectiveMinQty &&
      effectiveMinQty > 0 &&
      item.quantity === effectiveMinQty &&
      effectiveMinQty > 1;

    const isIncrementDisabled = item.quantity >= effectiveMaxQty;

    return (
      <View key={item?._id} style={{ paddingVertical: 8 }}>
        <View style={styles.itemRow}>
          <AppImage uri={item?.imgUrls[0]} containerStyle={styles.foodImg} />
          <View style={styles.itemDetails}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text style={styles.itemDesc} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={styles.itemPrice}>
              {`$${parseFloat(item.price || "0").toFixed(2)} `}
            </Text>
          </View>
          <View style={styles.qtyBox}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.qtyBtnBox,
                isDecrementDisabled && styles.disabledQtyBtn,
              ]}
              onPress={() => handleRemove(item)}
              disabled={isDecrementDisabled}
            >
              <Text
                style={[
                  styles.qtyBtnText,
                  isDecrementDisabled && styles.disabledQtyBtnText,
                ]}
              >
                -
              </Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.qtyBtnBox,
                isIncrementDisabled && styles.disabledQtyBtn,
              ]}
              onPress={() => handleAdd(item)}
              disabled={isIncrementDisabled}
            >
              <Text
                style={[
                  styles.qtyBtnText,
                  isIncrementDisabled && styles.disabledQtyBtnText,
                ]}
              >
                +
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {item?.customizationInput ? (
          <Pressable
            onPress={() =>
              onAddInstructionPress(item?._id, item?.customizationInput)
            }
            style={{
              borderRadius: 4,
              borderWidth: 1,
              borderColor: AppColor.border,
              marginTop: 8,
              padding: 8,
            }}
          >
            <Text
              style={{
                fontFamily: Mulish600,
                fontSize: 13,
                color: AppColor.gray,
              }}
            >
              {item?.customizationInput}
            </Text>
          </Pressable>
        ) : item?.allowCustomize ? (
          <Pressable
            onPress={() =>
              onAddInstructionPress(item?._id, item?.customizationInput)
            }
            style={{ marginTop: 4 }}
          >
            <Text
              style={{
                fontFamily: Mulish600,
                fontSize: 13,
                color: AppColor.gray,
              }}
            >
              {"Add instruction?"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  const renderAvailability = () => {
    if (!selectedLocation || !foodTruckDetail?.availability) return null;

    const locationAvailability = foodTruckDetail.availability.filter(
      (slot) => slot.locationId === selectedLocation._id && slot.available
    );

    if (locationAvailability.length === 0) {
      return (
        <View style={styles.availabilityContainer}>
          <Text>No availability for this location.</Text>
        </View>
      );
    }

    return (
      <View style={styles.availabilityContainer}>
        <Text
          style={{
            fontFamily: Mulish600,
            fontSize: 16,
            marginTop: 4,
            marginBottom: 8,
          }}
        >
          {"Select Availability :"}
        </Text>
        {locationAvailability.map((slot) => (
          <TouchableOpacity
            activeOpacity={0.7}
            key={slot._id}
            style={[
              styles.radioOption,
              selectedAvailability?._id === slot._id &&
                styles.radioOptionActive,
              {
                flexDirection: "row",
                alignItems: "center",
              },
            ]}
            onPress={() => setSelectedAvailability(slot)}
          >
            <Text
              style={{
                width: "20%",
                fontFamily: Mulish400,
                fontSize: 15,
                textTransform: "capitalize",
              }}
            >
              {`${slot.day}:`}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontFamily: Mulish400,
                fontSize: 15,
                textTransform: "capitalize",
              }}
            >
              {`${moment(slot.startTime, "HH:mm").format("hh:mm A")} - ${moment(slot.endTime, "HH:mm").format("hh:mm A")}`}
            </Text>
            {selectedAvailability?._id === slot._id && (
              <Pressable
                hitSlop={5}
                onPress={() => setSelectedAvailability(null)}
              >
                <Ionicons
                  name="close-circle-sharp"
                  color={AppColor.text}
                  size={20}
                />
              </Pressable>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleSignIn = () => {
    dispatch(onGuest(false));
    dispatch(clearUserSlice());
    dispatch(clearFavorites());
    dispatch(clearOrderSlice());
    dispatch(clearFoodTruckProfileSlice());
    dispatch(clearLocationSlice());
    dispatch(onSignOut());
  };

  const getIntitalDataFromAPI = async () => {
    setDataLoading(true);
    try {
      const temp_item_ids = order.items.map((item) => item._id);
      const response_1 = await checkItems_API({
        ids: temp_item_ids || [],
      });
      console.log("response_1 => ", response_1);
      if (response_1?.success && response_1?.data) {
        dispatch(updateAllItemsOfOrder(response_1?.data?.menuList));
      }

      const response_2 = await getFoodTruckDetailById_API(foodTruckId);
      console.log("response_2 => ", response_2);
      if (response_2?.success && response_2?.data) {
        setFoodTruckDetail(response_2?.data?.foodtruck);
      }

      if (response_2?.data?.foodtruck?.currentLocation) {
        const current_location = response_2?.data?.foodtruck.currentLocation
          ? response_2?.data?.foodtruck?.locations.find(
              (location) =>
                location._id === response_2?.data?.foodtruck.currentLocation
            )
          : null;
        setTruckCurrentLocation(current_location);
        setSelectedLocation(current_location);
        setSelectedAvailability(null);

        // Fetch TAX for location
        const response_3 = await checkTax_API({
          foodTruck_id: foodTruckId,
          location_id: response_2?.data?.foodtruck.currentLocation,
        });
        console.log("response_3 => ", response_3);
        if (response_3?.success && response_3?.data) {
          setTaxData(response_3?.data);
        }
      }
    } catch (error) {
      console.log("error => ", error);
    } finally {
      setDataLoading(false);
    }
  };

  const getTaxInfoFromAPI = async () => {
    setDataLoading(true);
    try {
      const response = await checkTax_API({
        foodTruck_id: foodTruckId,
        location_id: selectedLocation._id,
      });
      console.log("response => ", response);
      if (response?.success && response?.data) {
        setTaxData(response?.data);
      }
    } catch (error) {
      console.log("error => ", error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      if (preventAPI) {
        setPreventAPI(false);
      } else {
        getIntitalDataFromAPI();
      }
    }
  }, [isFocused, navigation]);

  useEffect(() => {
    if (isFocused && order.items.length === 0) {
      navigation.goBack();
    }
  }, [order.items.length]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager barStyle="dark-content" />
      <AppHeader headerTitle="Checkout" />
      {dataLoading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <NativeIndicator size="large" color={AppColor.primary} />
        </View>
      ) : (
        <>
          <ScrollView
            keyboardShouldPersistTaps="always"
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* item summary container */}
            <View style={styles.itemSummaryBox}>
              <Text style={styles.sectionTitle}>{"Order Summary"}</Text>
              <FlatList
                data={order.items}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.screenGenericCard}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <Divider />}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No items in your order.</Text>
                }
              />
            </View>

            {/* Location Container */}
            <View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.sectionTitle}>{"Location"}</Text>
                {/* <Pressable>
              <Text
                style={{
                  fontFamily: Mulish400,
                  fontSize: 14,
                  color: AppColor.primary,
                }}
              >
                {"Change"}
              </Text>
            </Pressable> */}
              </View>
              <View style={[styles.screenGenericCard, { paddingVertical: 8 }]}>
                {selectedLocation ? (
                  <>
                    <Text style={{ fontFamily: Mulish600, fontSize: 15 }}>
                      {`${selectedLocation.title}\n`}
                      <Text style={{ fontFamily: Mulish400, fontSize: 14 }}>
                        {`${selectedLocation.address}`}
                      </Text>
                    </Text>
                    {selectedAvailability && (
                      <Text
                        style={{
                          marginTop: 10,
                          fontFamily: Mulish600,
                          fontSize: 14,
                          color: AppColor.text,
                          textTransform: "capitalize",
                        }}
                      >
                        {`${selectedAvailability.day},  ${moment(selectedAvailability.startTime, "HH:mm").format("hh:mm A")} - ${moment(selectedAvailability.endTime, "HH:mm").format("hh:mm A")}`}
                      </Text>
                    )}
                    {truckCurrentLocation?._id !== selectedLocation?._id &&
                      !selectedAvailability && (
                        <Text
                          style={{
                            marginTop: 10,
                            fontFamily: Mulish700,
                            fontSize: 14,
                            color: AppColor.red,
                          }}
                        >
                          {"* Please select an availability"}
                        </Text>
                      )}
                  </>
                ) : (
                  <View style={{ height: 40, justifyContent: "center" }}>
                    <Text
                      style={{
                        fontFamily: Mulish700,
                        fontSize: 14,
                        color: AppColor.red,
                      }}
                    >
                      {"* Please select location to order"}
                    </Text>
                  </View>
                )}

                <Divider style={{ marginVertical: 8 }} />
                <Pressable onPress={() => actionSheetRef.current?.show()}>
                  <Text
                    style={{
                      fontFamily: Mulish500,
                      fontSize: 14,
                      color: AppColor.text,
                      textDecorationLine: "underline",
                    }}
                  >
                    {selectedAvailability
                      ? "Change slot"
                      : "Want this later? Schedule it"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* coupon container */}
            <View style={{ marginTop: 8, marginBottom: coupon ? 8 : 0 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.sectionTitle}>{"Coupon"}</Text>
                <Pressable
                  onPress={() => {
                    setPreventAPI(true);
                    navigation.navigate("couponCodeScreen", { setCoupon });
                  }}
                >
                  <Text
                    style={{
                      fontFamily: Mulish400,
                      fontSize: 14,
                      color: AppColor.primary,
                    }}
                  >
                    {coupon ? "View all coupons" : "Apply coupon?"}
                  </Text>
                </Pressable>
              </View>

              {coupon ? (
                <View style={styles.couponAppliedContainer}>
                  <Text style={styles.couponText}>
                    Coupon: {coupon.code} (
                    {coupon.type === "PERCENTAGE"
                      ? `${coupon.value}%`
                      : `$${coupon.value}`}
                    )
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleRemoveCoupon}
                    style={styles.removeCouponBtn}
                  >
                    <Icon
                      name="times-circle"
                      size={18}
                      color={AppColor.primary}
                    />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* Calculation container */}
            <View>
              <Text style={styles.sectionTitle}>{"Bill Summary"}</Text>
              <View style={[styles.screenGenericCard, { paddingBottom: 15 }]}>
                <View style={styles.totalDetails}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalRowItemTxt}>{"Item Total"}</Text>
                    <Text style={styles.totalRowItemTxt}>
                      {`$${subtotal.toFixed(2)}`}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalRowItemTxt}>
                      Sales Tax ({salesTaxRate}%)
                    </Text>
                    <Text style={styles.totalRowItemTxt}>
                      ${salesTax.toFixed(2)}
                    </Text>
                  </View>
                  {/* <View style={styles.totalRow}>
                    <Text style={styles.totalRowItemTxt}>Discount</Text>
                    <Text style={styles.totalRowItemTxt}>
                      - ${discount.toFixed(2)}
                    </Text>
                  </View> */}
                  {coupon && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalRowItemTxt}>
                        Coupon Discount (
                        {coupon.type === "PERCENTAGE"
                          ? `${coupon.value}%`
                          : `$${coupon.value}`}
                        )
                      </Text>
                      <Text style={styles.totalRowItemTxt}>
                        - ${discount.toFixed(2)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalRowItemTxt}>Total With Tax</Text>
                    <Text style={styles.totalRowItemTxt}>
                      ${totalWithTax.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalRowItemTxt}>
                      Payment Processing Fee ({processingFeeRate}%)
                    </Text>
                    <Text style={styles.totalRowItemTxt}>
                      ${processingFee.toFixed(2)}
                    </Text>
                  </View>
                  {/* {hasFreeDessert && (
                    <View style={styles.totalRow}>
                      <View style={styles.dessertRow}>
                        <Text style={styles.totalRowItemTxt}>1 x Dessert</Text>
                        <View style={styles.freeBadge}>
                          <Text style={styles.freeBadgeText}>Free</Text>
                        </View>
                      </View>
                      <Text style={styles.totalRowItemTxt}>$0.00</Text>
                    </View>
                  )} */}
                </View>
              </View>
            </View>

            {/* payment selection container */}
            {onlinePyamentApplicablePlanList.includes(
              foodTruckDetail?.plan?.slug
            ) && (
              <View style={styles.paymentBox}>
                <Text style={styles.paymentTitleTxt}>Payment Method</Text>
                {[
                  { method: "Google Pay", icon: "google" },
                  { method: "Apple Pay", icon: "apple" },
                ].map(({ method, icon }) => (
                  <TouchableOpacity
                    key={method}
                    onPress={() => setPaymentMethod(method)}
                    activeOpacity={0.7}
                    style={[
                      styles.paymentOption,
                      paymentMethod === method && styles.paymentOptionActive,
                    ]}
                  >
                    <View style={styles.radioContainer}>
                      <View
                        style={[
                          styles.radioOuter,
                          paymentMethod === method && styles.radioOuterActive,
                        ]}
                      >
                        {paymentMethod === method && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                    </View>
                    <Icon
                      name={icon}
                      size={18}
                      style={[
                        styles.paymentIcon,
                        paymentMethod === method && styles.paymentIconActive,
                      ]}
                    />
                    <Text style={styles.paymentText}>{method}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Order btn container */}
          <View
            style={[
              styles.bottomContainer,
              {
                paddingBottom: insets.bottom + 14,
              },
            ]}
          >
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>{"Total Amount"}</Text>
              <Text style={styles.totalText}>${total.toFixed(2)}</Text>
            </View>

            {isSignedIn ? (
              <>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.confirmBtn,
                    (order.items.length === 0 || loading) && styles.disabledBtn,
                  ]}
                  onPress={handleConfirmOrder}
                  disabled={order.items.length === 0 || loading}
                >
                  {loading ? (
                    <ActivityIndicator color={AppColor.white} />
                  ) : (
                    <Text style={styles.confirmBtnText}>
                      {selectedAvailability ||
                      truckCurrentLocation?._id != selectedLocation?._id
                        ? "Schedule Order"
                        : "Order Now"}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.advanceOrderBtn}
                onPress={handleSignIn}
              >
                <Text style={styles.advncOrderBtnText}>
                  Login to Place Order
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ActionSheet ref={actionSheetRef} headerAlwaysVisible={true}>
            <View style={{ paddingVertical: 8 }}>
              <Text style={styles.modalTitle}>{"Select Location"}</Text>
              <Divider style={{ marginVertical: 16 }} />
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16 }}
              >
                <View style={styles.section}>
                  {foodTruckDetail?.locations.map((loc) => (
                    <View key={loc._id}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[
                          styles.radioOption,
                          selectedLocation?._id === loc._id &&
                            styles.radioOptionActive,
                        ]}
                        onPress={() => {
                          setSelectedLocation(loc);
                          setSelectedAvailability(null); // Reset availability on new location
                        }}
                      >
                        <Text style={{ fontFamily: Mulish600, fontSize: 15 }}>
                          {`${loc.title}\n`}
                          <Text style={{ fontFamily: Mulish400, fontSize: 14 }}>
                            {`${loc.address}`}
                          </Text>
                        </Text>
                      </TouchableOpacity>
                      {selectedLocation?._id === loc._id &&
                        renderAvailability()}
                    </View>
                  ))}
                </View>
              </ScrollView>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.confirmBtn, { marginHorizontal: 16 }]}
                onPress={onLocationDonePress}
              >
                <Text style={styles.confirmBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </ActionSheet>

          <ActionSheet
            ref={actionSheetRef2}
            headerAlwaysVisible={true}
            onClose={onCloseInstructionPress}
          >
            <View style={{ paddingVertical: 8 }}>
              <Text style={styles.modalTitle}>{"Add Instruction"}</Text>
              <Divider style={{ marginVertical: 8 }} />
              <View style={{ paddingHorizontal: 16 }}>
                <TextInput
                  dense
                  value={instructionText}
                  onChangeText={setInstructionText}
                  style={{ backgroundColor: AppColor.white }}
                  contentStyle={{
                    minHeight: 120,
                    fontFamily: Mulish400,
                    fontSize: 15,
                  }}
                  placeholder="Enter instruction"
                  placeholderTextColor={AppColor.border}
                  mode="outlined"
                  multiline={true}
                  outlineColor={AppColor.border}
                  activeOutlineColor={AppColor.primary}
                  outlineStyle={{ borderRadius: 8 }}
                  autoCapitalize="sentences"
                  theme={{ colors: { onSurfaceVariant: "#777" } }}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.confirmBtn, { marginTop: 16 }]}
                  onPress={onCloseInstructionPress}
                >
                  <Text style={styles.confirmBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ActionSheet>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  scrollContent: {
    paddingBottom: 30,
    paddingHorizontal: 16,
  },

  itemSummaryBox: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontFamily: Mulish700,
    fontSize: 18,
    marginVertical: 10,
  },
  screenGenericCard: {
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: AppColor.white,
    // ...Platform.select({
    //   ios: {
    //     shadowColor: AppColor.black,
    //     shadowOffset: {
    //       width: 0,
    //       height: 1,
    //     },
    //     shadowOpacity: 0.1,
    //     shadowRadius: 2,
    //   },
    //   android: {
    //     elevation: 2,
    //   },
    // }),
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    // paddingVertical: 15,
  },
  foodImg: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 10,
    gap: 6,
  },
  itemTitle: {
    fontFamily: Mulish700,
    fontSize: 16,
  },
  itemDesc: {
    fontFamily: Mulish400,
    fontSize: 14,
  },
  itemPrice: {
    fontFamily: Mulish700,
    fontSize: 14,
    color: AppColor.primary,
  },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColor.primary,
  },
  qtyBtnBox: {
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  qtyBtnText: {
    fontFamily: Mulish700,
    fontSize: 14,
    color: AppColor.primary,
  },
  disabledQtyBtn: {
    borderColor: AppColor.textHighlighter,
  },
  disabledQtyBtnText: {
    color: AppColor.textHighlighter,
  },
  qtyText: {
    fontFamily: Mulish700,
    fontSize: 14,
    color: AppColor.text,
    marginHorizontal: 4,
  },
  emptyText: {
    textAlign: "center",
    color: AppColor.textHighlighter,
    marginVertical: 20,
  },
  couponBox: {
    backgroundColor: "#FC7B0338",
    borderRadius: 6,
    padding: 16,
  },
  couponText: {
    color: AppColor.primary,
    fontFamily: Mulish400,
  },
  paymentBox: {
    marginVertical: 8,
  },
  paymentTitleTxt: {
    fontFamily: Mulish700,
    fontSize: 18,
    marginVertical: 10,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 8,
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
  paymentOptionActive: {
    borderColor: AppColor.primary,
    backgroundColor: "#FFF6ED",
  },
  radioContainer: {
    width: 24,
    alignItems: "center",
    marginRight: 8,
  },
  radioOuter: {
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: AppColor.primary,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: AppColor.primary,
  },
  paymentIcon: {
    marginRight: 8,
    color: "#666",
  },
  paymentIconActive: {
    color: AppColor.primary,
  },
  paymentText: {
    fontFamily: Mulish400,
    fontSize: 15,
  },
  totalCard: {
    marginVertical: 8,
    paddingVertical: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontFamily: Mulish700,
    fontSize: 18,
    marginBottom: 15,
  },
  totalLabelPrimary: {
    fontFamily: Mulish700,
    fontSize: 18,
    marginBottom: 15,
    color: AppColor.primary,
  },
  totalRowItemTxt: {
    fontFamily: Mulish400,
    fontSize: 16,
  },
  totalText: {
    fontFamily: Mulish700,
    fontSize: 20,
    marginBottom: 15,
  },
  confirmBtn: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  advanceOrderBtn: {
    backgroundColor: AppColor.white,
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AppColor.primary,
  },
  advncOrderBtnText: {
    color: AppColor.primary,
    fontFamily: Mulish700,
    fontSize: 16,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: AppColor.white,
    fontFamily: Mulish700,
    fontSize: 16,
  },
  totalDetails: {
    gap: 15,
    paddingTop: 15,
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
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: AppColor.borderColor,
  },
  dessertRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  couponAppliedContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FC7B0338",
    borderRadius: 6,
    padding: 10,
  },
  removeCouponBtn: {
    padding: 5,
  },
  viewAllCouponsText: {
    color: AppColor.primary,
    fontFamily: Mulish400,
    fontSize: 14,
    textAlign: "right",
  },
  // Modal Specific Styles
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {},
  modalTitle: {
    fontFamily: Mulish700,
    fontSize: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  radioOption: {
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 10,
  },
  radioOptionActive: {
    borderColor: AppColor.primary,
    backgroundColor: "#FFF6ED",
  },
  availabilityContainer: {
    marginLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: AppColor.primary,
    paddingLeft: 16,
    marginBottom: 10,
  },
  cancelBtn: {
    borderColor: AppColor.primary,
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  cancelBtnText: {
    color: AppColor.primary,
    fontFamily: Mulish400,
    fontSize: 16,
  },
});

export default CheckoutScreen;
