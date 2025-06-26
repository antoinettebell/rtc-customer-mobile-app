import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import {
  useNavigation,
  useRoute,
  useIsFocused,
} from "@react-navigation/native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import AppHeader from "../components/AppHeader";
import {
  addItemToOrder,
  removeItemFromOrder,
  clearCurrentOrder,
} from "../redux/slices/orderSlice";
import Icon from "react-native-vector-icons/FontAwesome";
import { placeFoodOrder_API } from "../apiFolder/appAPI";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StatusBarManager from "../components/StatusBarManager";
import Modal from "react-native-modal"; // Import react-native-modal
import moment from "moment"; // Import moment for handling time

const foodImg = require("../assets/images/FoodImage.png");

const HR = () => <View style={styles.HR} />;

const CheckoutScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const order = useSelector((state) => state.orderReducer.currentOrder);
  const { foodTruckDetail, foodTruckStatus } = route.params || {};
  const [coupon, setCoupon] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Google Pay");
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();
  const [isAdvanceOrderModalVisible, setAdvanceOrderModalVisible] =
    useState(false); // State for modal visibility
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAvailability, setSelectedAvailability] = useState(null);

  const isTruckOpen = foodTruckStatus === "Open Now";

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const getDiscountAmount = () => {
    if (!coupon) return 0;
    if (coupon.type === "PERCENTAGE") {
      const discountValue = subtotal * (coupon.value / 100);
      return coupon.maxDiscount > 0
        ? Math.min(discountValue, coupon.maxDiscount)
        : discountValue;
    } else if (coupon.type === "FIXED") {
      return coupon.value;
    }
    return 0;
  };

  const salesTaxRate = 0;
  const salesTax = subtotal * (salesTaxRate / 100);
  const discount = getDiscountAmount();
  const paymentFee = 0.0;
  const totalWithTax = subtotal + salesTax;
  const total = totalWithTax + paymentFee - discount;

  const hasFreeDessert = subtotal > 15;

  const getDeliveryTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toTimeString().slice(0, 5);
  };

  useEffect(() => {
    if (isFocused && order.items.length === 0) {
      navigation.goBack();
    }
  }, [order.items.length, isFocused, navigation]);

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
        item: {
          id: item.id,
          name: item.name,
          desc: item.desc,
          price: item.price,
          img: item.img,
          originalItem: item.originalItem,
          minQty: item.minQty,
          maxQty: item.maxQty,
          allowCustomize: item.allowCustomize,
          diet: item.diet,
          discount: item.discount,
          itemType: item.itemType,
          subItem: item.subItem,
        },
      })
    );
  };

  const handleRemove = (item) => {
    const effectiveMinQty = item.minQty !== undefined ? item.minQty : 1;

    if (item.quantity <= effectiveMinQty && effectiveMinQty > 0) {
      if (item.quantity === effectiveMinQty) {
        if (effectiveMinQty > 1) {
          Alert.alert(
            "Quantity Limit Reached",
            `You must have at least ${effectiveMinQty} of this item.`
          );
          return;
        }
      }
    }

    dispatch(removeItemFromOrder({ itemId: item.id }));
  };

  const handleConfirmOrder = async () => {
    if (order.items.length === 0) {
      Alert.alert("No Items", "Please add items to your order first.");
      return;
    }

    if (!isTruckOpen) {
      Alert.alert(
        "Truck Closed",
        "The food truck is currently closed for immediate orders. Please place an advance order."
      );
      return;
    }

    const payload = {
      foodTruckId: order.foodTruckId,
      locationId: foodTruckDetail?.currentLocation,
      deliveryTime: getDeliveryTime(),
      items: order.items.map((item) => ({
        menuItemId: item.originalItem._id,
        qty: item.quantity,
      })),
    };
    if (coupon) {
      payload.couponId = coupon?._id;
    }

    try {
      setLoading(true);
      const response = await placeFoodOrder_API(payload);
      console.log("✅ Order placed:", response);
      dispatch(clearCurrentOrder());
      Alert.alert("Success", "Your order has been placed!");
      navigation.navigate("orderPlacedScreen");
    } catch (error) {
      console.error("❌ Order failed:", error);
      Alert.alert("Error", error?.message || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceAdvanceOrder = () => {
    if (order.items.length === 0) {
      Alert.alert("No Items", "Please add items to your order first.");
      return;
    }
    setAdvanceOrderModalVisible(true); // Open the modal
  };

  const handleConfirmAdvanceOrder = async () => {
    if (order.items.length === 0) {
      Alert.alert("No Items", "Please add items to your order first.");
      return;
    }
    if (!selectedLocation) {
      Alert.alert("No Location", "Please select a location.");
      return;
    }
    if (!selectedAvailability) {
      Alert.alert("No Availability", "Please select an availability slot.");
      return;
    }

    const payload = {
      foodTruckId: order.foodTruckId,
      locationId: selectedLocation._id,
      availabilityId: selectedAvailability._id,
      deliveryTime: moment().format("HH:mm"), // You might want to adjust this based on selectedAvailability
      items: order.items.map((item) => ({
        menuItemId: item.originalItem._id,
        qty: item.quantity,
      })),
    };
    if (coupon) {
      payload.couponId = coupon?._id;
    }

    try {
      setLoading(true);
      const response = await placeFoodOrder_API(payload);
      console.log("✅ Advance Order placed:", response);
      dispatch(clearCurrentOrder());
      setAdvanceOrderModalVisible(false); // Close modal on success
      Alert.alert("Success", "Your advance order has been placed!");
      navigation.navigate("paymentScreen", { total });
    } catch (error) {
      console.error("❌ Advance Order failed:", error);
      Alert.alert("Error", error?.message || "Failed to place advance order.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
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
      <View style={styles.itemRow}>
        <Image source={foodImg} style={styles.foodImg} />
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle}>{item.name}</Text>
          <Text style={styles.itemDesc}>{item.desc}</Text>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        </View>
        <View style={styles.qtyBox}>
          <TouchableOpacity
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
            fontFamily: Secondary400,
            fontSize: 16,
            marginBottom: 12,
            marginTop: 5,
          }}
        >
          Select Availability
        </Text>
        {locationAvailability.map((slot) => (
          <TouchableOpacity
            key={slot._id}
            style={[
              styles.radioOption,
              selectedAvailability?._id === slot._id &&
                styles.radioOptionActive,
            ]}
            onPress={() => setSelectedAvailability(slot)}
          >
            <Text
              style={{
                fontFamily: Secondary400,
                fontSize: 15,
                textTransform: "capitalize",
              }}
            >
              {slot.day}: {"    "}
              {slot.startTime} - {slot.endTime}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager barStyle="dark-content" />
      <AppHeader headerTitle="CHECKoUT" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>ORDER SUMMARY</Text>
        <FlatList
          data={order.items}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.screenGenericCard}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <HR />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No items in your order.</Text>
          }
        />

        <View style={styles.paymentBox}>
          <Text style={styles.paymentTitleTxt}>Payment Method</Text>
          {[
            { method: "Google Pay", icon: "google" },
            { method: "Apple Pay", icon: "apple" },
          ].map(({ method, icon }) => (
            <TouchableOpacity
              key={method}
              onPress={() => setPaymentMethod(method)}
              activeOpacity={0.9}
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

        <View style={[styles.screenGenericCard, { marginBottom: 25 }]}>
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
                onPress={handleRemoveCoupon}
                style={styles.removeCouponBtn}
              >
                <Icon name="times-circle" size={18} color={AppColor.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.couponBox}
              onPress={() =>
                navigation.navigate("couponCodeScreen", { setCoupon })
              }
            >
              <Text style={styles.couponText}>Apply Coupon</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("couponCodeScreen", { setCoupon })
            }
          >
            <Text style={styles.viewAllCouponsText}>View all coupons &gt;</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.screenGenericCard, styles.totalCard]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>ToTAL ORDER</Text>
            <Text style={styles.totalLabelPrimary}>${subtotal.toFixed(2)}</Text>
          </View>
          <HR />
          <View style={styles.totalDetails}>
            <View style={styles.totalRow}>
              <Text style={styles.totalRowItemTxt}>
                Sales Tax ({salesTaxRate}%)
              </Text>
              <Text style={styles.totalRowItemTxt}>${salesTax.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalRowItemTxt}>Discount</Text>
              <Text style={styles.totalRowItemTxt}>
                - ${discount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalRowItemTxt}>Total With Tax</Text>
              <Text style={styles.totalRowItemTxt}>
                ${totalWithTax.toFixed(2)}
              </Text>
            </View>
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
              <Text style={styles.totalRowItemTxt}>Payment Processing Fee</Text>
              <Text style={styles.totalRowItemTxt}>
                ${paymentFee.toFixed(2)}
              </Text>
            </View>
            {hasFreeDessert && (
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
      </ScrollView>

      <View
        style={[
          styles.bottomContainer,
          {
            paddingBottom: insets.bottom + 14,
          },
        ]}
      >
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>TOTAL AMoUNT</Text>
          <Text style={styles.totalText}>${total.toFixed(2)}</Text>
        </View>

        {isTruckOpen ? (
          <>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (order.items.length === 0 || loading) && styles.disabledBtn,
              ]}
              onPress={handleConfirmOrder}
              disabled={order.items.length === 0 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Order Now</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.advanceOrderBtn}
              onPress={handlePlaceAdvanceOrder}
              disabled={order.items.length === 0}
            >
              <Text style={styles.advncOrderBtnText}>Place Advance Order</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.advanceOrderBtn}
              onPress={handlePlaceAdvanceOrder}
              disabled={order.items.length === 0}
            >
              <Text style={styles.advncOrderBtnText}>Place Advance Order</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Advance Order Modal */}
      <Modal
        isVisible={isAdvanceOrderModalVisible}
        onBackdropPress={() => {
          setAdvanceOrderModalVisible(false);
          setSelectedLocation(null); // Reset selection when modal closes
          setSelectedAvailability(null);
        }}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>PLACE ADVANCE ORDER</Text>
          <View style={{ marginVertical: 16 }}>
            <HR />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: Secondary400,
                  marginBottom: 8,
                }}
              >
                Select Location
              </Text>
              {foodTruckDetail?.locations.map((loc) => (
                <View key={loc._id}>
                  <TouchableOpacity
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
                    <Text style={{ fontFamily: Secondary400, fontSize: 14 }}>
                      {loc.address}
                    </Text>
                  </TouchableOpacity>
                  {selectedLocation?._id === loc._id && renderAvailability()}
                </View>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              (!selectedLocation || !selectedAvailability || loading) &&
                styles.disabledBtn,
            ]}
            onPress={handleConfirmAdvanceOrder}
            disabled={!selectedLocation || !selectedAvailability || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmBtnText}>Confirm Advance Order</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.7}
            onPress={() => setAdvanceOrderModalVisible(false)}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
  sectionTitle: {
    fontFamily: Primary400,
    fontSize: 18,
    marginVertical: 10,
  },
  screenGenericCard: {
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
    paddingVertical: 5,
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
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
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
    fontFamily: Primary400,
    fontSize: 16,
  },
  itemDesc: {
    fontFamily: Secondary400,
    fontSize: 14,
  },
  itemPrice: {
    fontFamily: Primary400,
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
    fontFamily: Primary400,
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
    fontFamily: Primary400,
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
    marginVertical: 10,
  },
  couponText: {
    color: AppColor.primary,
    fontFamily: Secondary400,
  },
  paymentBox: {
    marginVertical: 15,
  },
  paymentTitleTxt: {
    fontFamily: Secondary400,
    fontSize: 14,
    marginBottom: 10,
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
    fontFamily: Secondary400,
    fontSize: 15,
  },
  totalCard: {
    paddingVertical: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontFamily: Primary400,
    fontSize: 18,
    marginBottom: 15,
  },
  totalLabelPrimary: {
    fontFamily: Primary400,
    fontSize: 18,
    marginBottom: 15,
    color: AppColor.primary,
  },
  totalRowItemTxt: {
    fontFamily: Secondary400,
    fontSize: 16,
  },
  totalText: {
    fontFamily: Primary400,
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
    fontFamily: Secondary400,
    fontSize: 16,
  },
  disabledBtn: {
    backgroundColor: AppColor.textHighlighter,
  },
  confirmBtnText: {
    color: AppColor.white,
    fontFamily: Secondary400,
    fontSize: 16,
  },
  HR: {
    height: 1,
    backgroundColor: AppColor.borderColor,
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
    marginVertical: 10,
  },
  removeCouponBtn: {
    padding: 5,
  },
  viewAllCouponsText: {
    color: AppColor.primary,
    fontFamily: Secondary400,
    fontSize: 14,
    marginVertical: 5,
    textAlign: "right",
  },
  // Modal Specific Styles
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: AppColor.white,
    padding: 22,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    borderColor: "rgba(0, 0, 0, 0.1)",
    maxHeight: "80%", // Limit modal height
  },
  modalTitle: {
    fontFamily: Primary400,
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
    padding: 15,
    marginBottom: 10,
  },
  radioOptionActive: {
    borderColor: AppColor.primary,
    backgroundColor: "#FFF6ED",
  },
  availabilityContainer: {
    marginLeft: 26,
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
    fontFamily: Secondary400,
    fontSize: 16,
  },
});

export default CheckoutScreen;
