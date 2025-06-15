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
import { placeFoodOrder_API } from "../apiFolder/appAPI"; // ✅ import your API

const foodImg = require("../assets/images/FoodImage.png");

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const order = useSelector((state) => state.orderReducer.currentOrder);

  const [coupon, setCoupon] = React.useState(null);
  const [paymentMethod, setPaymentMethod] = React.useState("Google Pay");
  const [loading, setLoading] = React.useState(false);

  // Financial calculations
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const salesTax = subtotal * 0.07;
  const discount = coupon ? 5 : 0;
  const paymentFee = 0.4;
  const total = subtotal + salesTax + paymentFee - discount;

  // Utility: get current time + 30 minutes
  const getDeliveryTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toTimeString().slice(0, 5); // format "HH:MM"
  };

  // Add/Remove item from cart
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

  // Confirm Order
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
    <View style={styles.container}>
      <AppHeader headerTitle="CHECKOUT" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>ORDER SUMMARY</Text>

        <FlatList
          data={order.items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <Image source={foodImg} style={styles.foodImg} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.desc}</Text>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
              </View>
              <View style={styles.qtyBox}>
                <TouchableOpacity
                  style={styles.qtyBtnBox}
                  onPress={() => handleRemove(item)}
                >
                  <Text style={styles.qtyBtnText}>
                    {item.quantity === 1 ? "🗑️" : "-"}
                  </Text>
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
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {["Google Pay", "Apple Pay"].map((method) => (
            <TouchableOpacity
              key={method}
              onPress={() => setPaymentMethod(method)}
              style={[
                styles.paymentOption,
                paymentMethod === method && styles.paymentOptionActive,
              ]}
            >
              <Text style={styles.radio}>
                {paymentMethod === method ? "◉" : "○"}
              </Text>
              <Text style={styles.paymentText}>{method}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.sectionTitle}>TOTAL ORDER</Text>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Sales Tax</Text>
            <Text>${salesTax.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Discount</Text>
            <Text>- ${discount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Payment Fee</Text>
            <Text>${paymentFee.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>TOTAL AMOUNT</Text>
            <Text style={styles.totalText}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (order.items.length === 0 || loading) && {
              backgroundColor: AppColor.textHighlighter,
            },
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  sectionTitle: {
    fontFamily: Primary400,
    fontSize: 17,
    marginVertical: 10,
    color: AppColor.primary,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#F0F1F2",
    borderRadius: 10,
    padding: 10,
  },
  foodImg: { width: 60, height: 60, borderRadius: 8 },
  itemTitle: { fontFamily: Primary400, fontSize: 16 },
  itemDesc: { fontFamily: Secondary400, fontSize: 13 },
  itemPrice: { fontFamily: Primary400, fontSize: 14, color: AppColor.primary },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 10,
  },
  qtyBtnBox: { paddingHorizontal: 6, paddingVertical: 2 },
  qtyBtnText: { fontFamily: Primary400, fontSize: 18, color: AppColor.primary },
  qtyText: { fontSize: 15, fontFamily: Primary400, marginHorizontal: 4 },
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
  couponText: { color: AppColor.primary, fontFamily: Secondary400 },
  paymentBox: { marginVertical: 10 },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 10,
  },
  paymentOptionActive: {
    borderColor: AppColor.primary,
    backgroundColor: "#FFF6ED",
  },
  radio: { fontSize: 18, marginRight: 8 },
  paymentText: { fontFamily: Secondary400, fontSize: 15 },
  totalBox: {
    marginVertical: 10,
    backgroundColor: "#F0F1F2",
    borderRadius: 10,
    padding: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  totalText: {
    fontFamily: Primary400,
    fontSize: 16,
    color: AppColor.primary,
    marginTop: 6,
  },
  confirmBtn: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  confirmBtnText: {
    color: "#fff",
    fontFamily: Primary400,
    fontSize: 16,
  },
});

export default CheckoutScreen;
