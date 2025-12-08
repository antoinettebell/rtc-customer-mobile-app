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
  Pressable,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useIsFocused } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import moment from "moment";
import {
  Divider,
  ActivityIndicator,
  TextInput,
  IconButton,
} from "react-native-paper";
import ActionSheet from "react-native-actions-sheet";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  AppColor,
  Mulish700,
  Mulish400,
  Mulish600,
  Mulish500,
} from "../utils/theme";
import StatusBarManager from "../components/StatusBarManager";
import AppImage from "../components/AppImage";
import {
  checkFreeDessertEligibility_API,
  checkItems_API,
  checkTax_API,
  getFoodTruckDetailById_API,
  validateOrder_API,
} from "../apiFolder/appAPI";
import { onGuest, onSignOut } from "../redux/slices/authSlice";
import { clearUserSlice } from "../redux/slices/userSlice";
import { clearFavorites } from "../redux/slices/favoritesSlice";
import { clearFoodTruckProfileSlice } from "../redux/slices/foodTruckProfileSlice";
import { clearLocationSlice } from "../redux/slices/locationSlice";
import {
  addItemToOrder,
  removeItemFromOrder,
  clearOrderSlice,
  updateAllItemsOfOrder,
  updateItemProperty,
} from "../redux/slices/orderSlice";
import useDebounce from "../hooks/useDebounce";

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
  const [dessert, setDessert] = useState(null);
  const [pickupSource, setPickupSource] = useState("regular");

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [pickupTime, setPickupTime] = useState(null);

  const [preventAPI, setPreventAPI] = useState(false);

  const subtotal = useMemo(() => order.subtotal, [order.subtotal]);
  const debouncedSubtotal = useDebounce(subtotal, 1000);
  const processingFeeRate = useMemo(
    () => taxData?.paymentProcessingFee || 0,
    [taxData]
  );
  const salesTaxAmount = useMemo(() => taxData?.salesTaxAmount || 0, [taxData]);
  const totalWithSalesTax = useMemo(
    () => debouncedSubtotal + salesTaxAmount || 0,
    [salesTaxAmount, debouncedSubtotal]
  );
  const discount = useMemo(() => {
    if (!coupon) return 0;
    if (coupon.type === "PERCENTAGE") {
      const discountValue = totalWithSalesTax * (coupon.value / 100);
      return coupon.maxDiscount > 0
        ? Math.min(discountValue, coupon.maxDiscount)
        : discountValue;
    } else if (coupon.type === "FIXED") {
      return Math.min(coupon.value, totalWithSalesTax);
    }
    return 0;
  }, [coupon, totalWithSalesTax]);
  const totalAfterDiscount = useMemo(
    () => totalWithSalesTax - discount,
    [totalWithSalesTax, discount]
  );
  const prosessingFeeAmount = useMemo(
    () => totalAfterDiscount * (processingFeeRate / 100),
    [totalAfterDiscount, processingFeeRate]
  );
  const totalAfterProsessingFee = useMemo(
    () => totalAfterDiscount + prosessingFeeAmount,
    [totalAfterDiscount, prosessingFeeAmount]
  );

  const showTimePicker = () => {
    setTimePickerVisibility(true);
  };

  const hideTimePicker = () => {
    setTimePickerVisibility(false);
  };

  const handleConfirmTime = (date) => {
    const selectedTime24Hr = moment(date).format("HH:mm");
    setPickupTime(selectedTime24Hr);
    hideTimePicker();
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
    // Determine order type
    const isPreOrder = pickupSource === "pre_order";

    // Check if the order is empty
    if (order.items.length === 0) {
      Alert.alert("Empty Order", "Please add items to your order first.");
      return;
    }

    const now = moment(); // Declare 'now' once here

    // Validations
    if (isPreOrder) {
      // Check if the selected location is valid
      if (!selectedLocation) {
        Alert.alert("Location required", "Please select a location.");
        return;
      }

      // Check if the selected availability is valid
      if (!selectedAvailability) {
        Alert.alert("Availability required", "Please select a availability.");
        return;
      }

      // Check if the selected pickup time is valid
      if (!pickupTime) {
        Alert.alert(
          "Pickup Time Required",
          "Please enter a pickup time for your pre-order."
        );
        return;
      }

      const selectedDateTime = moment(pickupTime, "HH:mm");
      const availabilityStartTime = moment(
        selectedAvailability.startTime,
        "HH:mm"
      );
      const availabilityEndTime = moment(selectedAvailability.endTime, "HH:mm");

      // Check if the selected time is not in the past for today's availability
      if (
        moment(selectedAvailability.date).isSame(now, "day") &&
        selectedDateTime.isBefore(now)
      ) {
        Alert.alert(
          "Invalid Pickup Time",
          `Pickup time cannot be in the past for today's availability. Please select a time between ${moment(selectedAvailability.startTime, "HH:mm").format("hh:mm A")} and ${moment(selectedAvailability.endTime, "HH:mm").format("hh:mm A")}.`
        );
        return;
      }

      // Check if the selected time is within the availability range
      if (
        selectedDateTime.isBefore(availabilityStartTime) ||
        selectedDateTime.isAfter(availabilityEndTime)
      ) {
        Alert.alert(
          "Invalid Pickup Time",
          `Pickup time must be within the selected availability range: ${moment(selectedAvailability.startTime, "HH:mm").format("hh:mm A")} - ${moment(selectedAvailability.endTime, "HH:mm").format("hh:mm A")}.`
        );
        return;
      }
    } else {
      if (!truckCurrentLocation) {
        Alert.alert(
          "Can not place order.",
          "Vendor is not available at the moment. Please try again later or select pre-order."
        );
        return;
      }
    }

    let payload = {
      foodTruckId: foodTruckId,
      locationId: truckCurrentLocation?._id, // for pre-order it'll change latter
      taxAmount: salesTaxAmount || 0,
      items: order.items.map((item) => {
        const itemPayload = {
          menuItemId: item._id,
          qty: item.quantity,
        };

        if (
          item.allowCustomize &&
          item?.customizationInput?.trim()?.length > 0
        ) {
          itemPayload.customization = item.customizationInput;
        }

        return itemPayload;
      }),
    };

    // add params for pre-order
    if (isPreOrder) {
      const pickupDate = moment(selectedAvailability?.date).format("DD-MMM");
      payload.locationId = selectedLocation?._id;
      payload.deliveryTime = pickupTime;
      payload.deliveryDate = pickupDate;
      payload.availabilityId = selectedAvailability?._id;
    }

    // add "couponId" if discount is applied
    if (coupon) {
      payload.couponId = coupon?._id;
    }

    console.log("Order Payload:", payload);
    setLoading(true);
    try {
      const response = await validateOrder_API(payload);
      console.log("response", response);
      if (response.success && response.data) {
        const navigationPayload = {
          orderDetail: payload,
          foodTruckDetail: foodTruckDetail,
          checkoutTime: moment.now(),
          finalAmount: response.data.order.total,
          // billDetail: {
          //   itemTotalAmount: subtotal,
          //   salesTaxAmount: salesTaxAmount,
          //   coupon: coupon,
          //   discountAmount: discount,
          //   totalWithTaxAmount: totalAfterDiscount,
          //   paymentProcessingFeePercent: processingFeeRate,
          //   paymentProcessingFeeAmount: prosessingFeeAmount,
          //   finalAmount: totalAfterProsessingFee,
          //   freeDessert: dessert?.isEligibleNow || false,
          // },
        };
        navigation.navigate("paymentProcessingScreen", navigationPayload);
      }
    } catch (error) {
      console.error("order validation error => ", error);
    } finally {
      setLoading(false);
    }
  };

  const onLocationDonePress = () => {
    if (!selectedLocation) {
      Alert.alert("Location required", "Please select a location.");
    } else if (!selectedAvailability) {
      Alert.alert("Availability required", "Please select a availability.");
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
              {"Add customisation?"}
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
        {locationAvailability.map((slot) => {
          const isSelected = selectedAvailability?._id === slot._id;
          const isDisabled = isSlotPast(slot.day, slot.startTime, slot.endTime);
          const dateOfTheDay = getFutureDateForDay(slot.day);
          const openTime = moment(slot.startTime, "HH:mm").format("hh:mm A");
          const closeTime = moment(slot.endTime, "HH:mm").format("hh:mm A");

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              key={slot._id}
              style={[
                styles.radioOption,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingLeft: 0,
                  paddingRight: 8,
                },
                isSelected && styles.radioOptionActive,
              ]}
              onPress={() =>
                setSelectedAvailability({ ...slot, date: dateOfTheDay })
              }
              disabled={isDisabled}
            >
              <View
                style={{
                  flex: 1,
                  gap: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingLeft: 16,
                  paddingRight: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: Mulish400,
                    fontSize: 15,
                    textTransform: "capitalize",
                    color: isDisabled ? AppColor.gray : AppColor.text,
                  }}
                >
                  {dateOfTheDay.format("ddd (DD-MMM)")}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 15,
                    fontFamily: Mulish400,
                    textTransform: "capitalize",
                    color: isDisabled ? AppColor.gray : AppColor.text,
                  }}
                >
                  {`${openTime} - ${closeTime}`}
                </Text>
              </View>
              <Pressable
                hitSlop={5}
                disabled={!isSelected}
                onPress={() => setSelectedAvailability(null)}
                style={{ opacity: isSelected ? 1 : 0 }}
              >
                <Ionicons
                  name="close-circle-sharp"
                  color={AppColor.text}
                  size={24}
                />
              </Pressable>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const isSlotPast = (dayOfWeek, startTime, endTime) => {
    const now = moment();
    const currentDay = now.day(); // 0 for Sunday, 1 for Monday, etc.

    const dayMap = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };
    const slotDay = dayMap[dayOfWeek.toLowerCase()];

    // Only check if the slot is past if it's for the current day
    if (currentDay === slotDay) {
      const end = moment(endTime, "HH:mm");
      return now.isAfter(end, "minute");
    }
    return false;
  };

  const getFutureDateForDay = (dayOfWeek) => {
    const today = moment();
    const dayMap = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };
    const targetDayIndex = dayMap[dayOfWeek.toLowerCase()];
    const currentDayIndex = today.day();

    let daysToAdd = targetDayIndex - currentDayIndex;

    if (daysToAdd < 0) {
      daysToAdd += 7;
    }

    return today.add(daysToAdd, "days");
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

        // Fetch TAX for location
        const response_3 = await checkTax_API({
          foodTruck_id: foodTruckId,
          location_id: response_2?.data?.foodtruck.currentLocation,
          amount: debouncedSubtotal,
        });
        console.log("response_3 => ", response_3);
        if (response_3?.success && response_3?.data) {
          setTaxData(response_3?.data);
        }
      }

      const response_4 = await checkFreeDessertEligibility_API();
      console.log("response_4 => ", response_4);
      if (response_4?.success && response_4?.data) {
        setDessert(response_4?.data?.eligibility || null);
      }
    } catch (error) {
      console.log("error => ", error);
    } finally {
      setDataLoading(false);
    }
  };

  const getTaxInfoFromAPI = async (amount) => {
    setDataLoading(true);
    try {
      const locationId =
        pickupSource === "regular"
          ? truckCurrentLocation?._id
          : selectedLocation?._id;

      if (!locationId) return;

      const response = await checkTax_API({
        foodTruck_id: foodTruckId,
        location_id: locationId,
        amount: amount || subtotal,
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
    if (debouncedSubtotal > 0) {
      getTaxInfoFromAPI(debouncedSubtotal);
    }
  }, [debouncedSubtotal]);

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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={{ width: "20%" }}>
            <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          </View>
          <Text style={styles.headerTitle}>{"Checkout"}</Text>
          <View style={{ width: "20%" }} />
        </View>
      </View>

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
                scrollEnabled={false}
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

            {/* Pickup Summary */}
            <>
              <View style={{ marginTop: 18 }}>
                <Text style={[styles.sectionTitle, { marginVertical: 0 }]}>
                  {"Pickup Summary"}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingVertical: 8,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 4,
                    backgroundColor:
                      pickupSource === "regular" ? AppColor.primary : "#E5E5EA",
                  }}
                  onPress={() => setPickupSource("regular")}
                >
                  <Text
                    style={{
                      fontFamily: Mulish600,
                      fontSize: 14,
                      color:
                        pickupSource === "regular"
                          ? AppColor.white
                          : AppColor.text,
                    }}
                  >
                    Regular
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 4,
                    backgroundColor:
                      pickupSource === "pre_order"
                        ? AppColor.primary
                        : "#E5E5EA",
                  }}
                  onPress={() => setPickupSource("pre_order")}
                >
                  <Text
                    style={{
                      fontFamily: Mulish600,
                      fontSize: 14,
                      color:
                        pickupSource === "pre_order"
                          ? AppColor.white
                          : AppColor.text,
                    }}
                  >
                    Pre-Order
                  </Text>
                </TouchableOpacity>
              </View>
              {pickupSource === "regular" ? (
                <View
                  style={{
                    padding: 16,
                    borderWidth: 1,
                    borderRadius: 10,
                    borderColor: AppColor.borderColor,
                    backgroundColor: AppColor.white,
                  }}
                >
                  {truckCurrentLocation ? (
                    <>
                      <Text
                        style={{
                          fontFamily: Mulish700,
                          fontSize: 18,
                          color: AppColor.text,
                        }}
                      >
                        {"Location:"}
                      </Text>
                      <View style={{ gap: 8, marginTop: 8 }}>
                        <Text style={{ fontFamily: Mulish600, fontSize: 15 }}>
                          {`${truckCurrentLocation.title}, `}
                          <Text style={{ fontFamily: Mulish400, fontSize: 14 }}>
                            {`${truckCurrentLocation.address}`}
                          </Text>
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={{ height: 40, justifyContent: "center" }}>
                      <Text
                        style={{
                          fontFamily: Mulish700,
                          fontSize: 14,
                          color: AppColor.text,
                        }}
                      >
                        {
                          "This vendor is not available at the moment. Kindly Check for pre-order."
                        }
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}
              {pickupSource === "pre_order" ? (
                <View
                  style={{
                    gap: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderRadius: 10,
                    borderColor: AppColor.borderColor,
                    backgroundColor: AppColor.white,
                  }}
                >
                  <View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: Mulish700,
                          fontSize: 18,
                          color: AppColor.text,
                        }}
                      >
                        {"Location:"}
                      </Text>
                      <IconButton
                        icon="plus"
                        size={18}
                        containerColor="#E5E5EA"
                        style={{ margin: 0 }}
                        onPress={() => actionSheetRef.current?.show()}
                      />
                    </View>
                    {selectedLocation ? (
                      <View style={{ gap: 8, marginTop: 8 }}>
                        <Text style={{ fontFamily: Mulish600, fontSize: 15 }}>
                          {`${selectedLocation.title}, `}
                          <Text style={{ fontFamily: Mulish400, fontSize: 14 }}>
                            {`${selectedLocation.address}`}
                          </Text>
                        </Text>
                        {selectedAvailability ? (
                          <Text
                            style={{
                              fontFamily: Mulish600,
                              fontSize: 14,
                              color: AppColor.text,
                              textTransform: "capitalize",
                            }}
                          >
                            {`${getFutureDateForDay(selectedAvailability.day).format("ddd (DD-MMM)")}  ${moment(selectedAvailability.startTime, "HH:mm").format("hh:mm A")} - ${moment(selectedAvailability.endTime, "HH:mm").format("hh:mm A")}`}
                          </Text>
                        ) : (
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: Mulish500,
                              color: AppColor.text,
                            }}
                          >
                            {"* Please select pre-order availability"}
                          </Text>
                        )}
                      </View>
                    ) : null}
                  </View>
                  <Divider />
                  <View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: Mulish700,
                          fontSize: 18,
                          color: AppColor.text,
                        }}
                      >
                        {"Pickup Time:"}
                      </Text>
                      <IconButton
                        icon="plus"
                        size={18}
                        containerColor="#E5E5EA"
                        style={{ margin: 0 }}
                        onPress={showTimePicker}
                      />
                    </View>
                    {pickupTime ? (
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: Mulish500,
                          color: AppColor.text,
                        }}
                      >
                        {moment(pickupTime, "HH:mm").format("hh:mm A")}
                      </Text>
                    ) : null}
                    {!pickupTime && selectedLocation && selectedAvailability ? (
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: Mulish500,
                          color: AppColor.text,
                        }}
                      >
                        {"* Please enter pickup time"}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </>

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

            {/* bill-summary container */}
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
                    <Text style={styles.totalRowItemTxt}>Sales Tax</Text>
                    <Text style={styles.totalRowItemTxt}>
                      ${salesTaxAmount.toFixed(2)}
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
                  <Divider />
                  <View style={styles.totalRow}>
                    <Text style={styles.totalRowItemTxt}>Total With Tax</Text>
                    <Text style={styles.totalRowItemTxt}>
                      ${totalAfterDiscount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalRowItemTxt}>
                      Payment Processing Fee ({processingFeeRate}%)
                    </Text>
                    <Text style={styles.totalRowItemTxt}>
                      ${prosessingFeeAmount.toFixed(2)}
                    </Text>
                  </View>
                  {dessert?.isEligibleNow && (
                    <View style={styles.totalRow}>
                      <View style={styles.dessertRow}>
                        <Text style={styles.totalRowItemTxt}>1 x Dessert</Text>
                        <View style={styles.freeBadge}>
                          <Text style={styles.freeBadgeText}>Free</Text>
                        </View>
                      </View>
                      <Text style={styles.totalRowItemTxt}>$0.00</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
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
              <Text style={styles.totalText}>
                ${totalAfterProsessingFee.toFixed(2)}
              </Text>
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
                    <ActivityIndicator color={AppColor.white} size="small" />
                  ) : (
                    <Text style={styles.confirmBtnText}>
                      {pickupSource === "regular"
                        ? "Order Now"
                        : "Schedule Order"}
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

          {/* Pre-Order Availability */}
          <ActionSheet ref={actionSheetRef} headerAlwaysVisible={true}>
            <View style={{ paddingVertical: 8 }}>
              <Text style={styles.modalTitle}>{"Pre-Order Availability"}</Text>
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

          {/* Add Customisation */}
          <ActionSheet
            ref={actionSheetRef2}
            headerAlwaysVisible={true}
            onClose={onCloseInstructionPress}
          >
            <View style={{ paddingVertical: 8 }}>
              <Text style={styles.modalTitle}>{"Customisation"}</Text>
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
                  placeholder="Enter customisation"
                  placeholderTextColor={AppColor.border}
                  mode="outlined"
                  multiline={true}
                  outlineColor={AppColor.border}
                  activeOutlineColor={AppColor.primary}
                  outlineStyle={{ borderRadius: 8 }}
                  autoCapitalize="sentences"
                  autoFocus={true}
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

      {/* Time Picker Modal */}
      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={handleConfirmTime}
        onCancel={hideTimePicker}
        date={pickupTime ? moment(pickupTime, "HH:mm").toDate() : new Date()}
      />
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
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
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
