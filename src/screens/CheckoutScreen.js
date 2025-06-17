import React from "react";
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
import { useNavigation } from "@react-navigation/native";
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

const foodImg = require("../assets/images/FoodImage.png");

const HR = () => <View style={styles.HR} />;

const CheckoutScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const order = useSelector((state) => state.orderReducer.currentOrder);

  const [coupon, setCoupon] = React.useState(null);
  const [paymentMethod, setPaymentMethod] = React.useState("Google Pay");
  const [loading, setLoading] = React.useState(false);

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const salesTax = subtotal * 0.07;
  const discount = coupon ? 5 : 0;
  const paymentFee = 0.4;
  const total = subtotal + salesTax + paymentFee - discount;

  const getDeliveryTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toTimeString().slice(0, 5);
  };

  const handleAdd = (item) => {
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
        },
      })
    );
  };

  const handleRemove = (item) => {
    dispatch(removeItemFromOrder({ itemId: item.id }));
  };

  const handleConfirmOrder = async () => {
    if (order.items.length === 0) {
      Alert.alert("No Items", "Please add items to your order first.");
      return;
    }

    const payload = {
      foodTruckId: order.foodTruckId,
      deliveryTime: getDeliveryTime(),
      items: order.items.map((item) => ({
        menuItemId: item.originalItem._id,
        qty: item.quantity,
      })),
    };

    try {
      setLoading(true);
      const response = await placeFoodOrder_API(payload);
      console.log("✅ Order placed:", response);
      dispatch(clearCurrentOrder());
      Alert.alert("Success", "Your order has been placed!");
      navigation.navigate("paymentScreen", { total });
    } catch (error) {
      console.error("❌ Order failed:", error);
      Alert.alert("Error", error?.message || "Failed to place order.");
    } finally {
      setLoading(false);
    }
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
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <Image source={foodImg} style={styles.foodImg} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.desc}</Text>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
              </View>
              <View style={styles.qtyBox}>
                <TouchableOpacity
                  style={styles.qtyBtnBox}
                  onPress={() => handleRemove(item)}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtnBox}
                  onPress={() => handleAdd(item)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <HR />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No items in your order.</Text>
          }
        />

        <TouchableOpacity
          style={styles.couponBox}
          onPress={() => navigation.navigate("couponCodeScreen", { setCoupon })}
        >
          <Text style={styles.couponText}>
            {coupon ? `Coupon: ${coupon}` : "Apply Coupon"}
          </Text>
        </TouchableOpacity>

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

        <View style={[styles.screenGenericCard, styles.totalCard]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>ToTAL ORDER</Text>
          </View>
          <HR />
          <View style={styles.totalDetails}>
            <View style={styles.totalRow}>
              <Text style={styles.totalRowItemTxt}>Sales Tax</Text>
              <Text style={styles.totalRowItemTxt}>{salesTax.toFixed(2)}%</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalRowItemTxt}>Discount</Text>
              <Text style={styles.totalRowItemTxt}>
                - ${discount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalRowItemTxt}>Total With Tax</Text>
              <Text style={styles.totalRowItemValueTxt}>
                ${paymentFee.toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalRowItemTxt}>Payment Processing Fee</Text>
              <Text style={styles.totalRowItemTxt}>
                ${paymentFee.toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text style={styles.totalRowItemTxt}>1 x Dessert</Text>
                <View
                  style={{
                    backgroundColor: "#C2FFFF",
                    borderRadius: 4,
                    marginLeft: 16,
                  }}
                >
                  <Text
                    style={{
                      color: "#008B8B",
                      paddingVertical: 2,
                      paddingHorizontal: 8,
                    }}
                  >
                    Free
                  </Text>
                </View>
              </View>
              <Text style={styles.totalRowItemTxt}>$0.00</Text>
            </View>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>ToTAL AMoUNT</Text>
            <Text style={styles.totalText}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

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
          <Text style={styles.confirmBtnText}>Confirm Order</Text>
        )}
      </TouchableOpacity>
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
    borderRadius: 8,
    padding: 10,
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
  totalRowItemTxt: {
    fontFamily: Secondary400,
    fontSize: 16,
  },
  totalText: {
    fontFamily: Primary400,
    fontSize: 16,
    color: AppColor.primary,
  },
  confirmBtn: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 30,
    alignItems: "center",
  },
  disabledBtn: {
    backgroundColor: AppColor.textHighlighter,
  },
  confirmBtnText: {
    color: "#fff",
    fontFamily: Primary400,
    fontSize: 16,
  },
  HR: {
    height: 1,
    backgroundColor: AppColor.borderColor,
  },
  totalDetails: {
    marginVertical: 15,
    gap: 15,
  },
});

export default CheckoutScreen;
