import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FastImage from "@d11/react-native-fast-image";

const HR = () => <View style={styles.HR} />;

const OrderDetailsScreen = (props) => {
  const navigation = useNavigation();
  const { params } = useRoute();
  const insets = useSafeAreaInsets();

  const order = params?.order;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />
      {/* Header */}
      <View style={styles.headerWrap}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={28} color={AppColor.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ORDER DETAILS</Text>
        <View style={{ width: 28 }} />
      </View>

      <View
        style={{
          flex: 1,
          paddingHorizontal: 16,
          paddingVertical: 20,
          backgroundColor: "#F0F1F2",
        }}
      >
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.9}
          // onPress={onDetails}
        >
          <View style={styles.headerRow}>
            <Text style={styles.orderId}>Order #{order.id}</Text>
          </View>

          <View style={styles.truckRow}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
              }}
            >
              <Image source={order.image} style={styles.truckImg} />
              <View style={{ marginLeft: 10, gap: 4 }}>
                <Text style={styles.truckName}>{order.truck}</Text>
                <Text style={styles.itemsCount}>
                  {order.items.length} Items
                </Text>
              </View>
            </View>

            <View style={{ gap: 4, alignItems: "flex-end" }}>
              <Text style={styles.orderDate}>{order.date}</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <MaterialIcons
                  name="access-time"
                  size={14}
                  color={"#6F6F6F"}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.orderDate}>{order.time}</Text>
              </View>
            </View>
          </View>
          <HR />
          <View style={styles.itemsList}>
            {order.items.map((itm, idx) => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ gap: 4 }}>
                  <Text
                    key={idx}
                    style={styles.itemText}
                  >{`1 x ${itm.name}`}</Text>
                  <Text
                    key={itm.desc}
                    style={styles.itemDesc}
                  >{`${itm.desc}`}</Text>
                </View>

                <Text key={itm.price} style={styles.itemText}>
                  ${`${itm.price}`}
                </Text>
              </View>
            ))}
          </View>
          <HR />

          <View style={styles.footerRow}>
            <Text style={styles.total}>${order.total.toFixed(2)}</Text>
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                style={styles.trackBtn}
                onTrack={() =>
                  props.navigation.navigate("orderTrackingScreen", {
                    order: item,
                  })
                }
              >
                <FastImage
                  source={require("../assets/images/trackOrder.png")}
                  style={{ width: 20, height: 20 }}
                />
                <Text style={styles.trackBtnText}>Track</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        <View style={{}}>
          <View style={styles.totalSection}>
            <View style={[styles.row, { marginTop: 0, marginBottom: 15 }]}>
              <Text style={styles.sectionTitle}>TOTAL ORDER</Text>
              <Text style={styles.sectionTitle}>$27.79</Text>
            </View>
            <HR />
            <View style={styles.row}>
              <Text style={styles.orderDetailsTxt}>Sales Tax</Text>
              <Text style={styles.orderDetailsTxt}>7%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.orderDetailsTxt}>Discount</Text>
              <Text style={styles.orderDetailsTxt}>$5.00</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.orderDetailsTxt}>Total With Tax</Text>
              <Text style={styles.orderDetailsTxt}>
                ${order.total.toFixed(2)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.orderDetailsTxt}>Payment Processing Fee</Text>
              <Text style={styles.orderDetailsTxt}>$0.42</Text>
            </View>
          </View>
          <View style={styles.totalAmountRow}>
            <Text style={styles.totalAmountLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalAmountValue}>
              ${order.total.toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.navigate("cancelOrderScreen", { order })}
          >
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 24,
    paddingBottom: 16,
    backgroundColor: AppColor.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColor.borderColor,
  },
  backBtn: {
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontFamily: Primary400,
    fontSize: 20,
    color: AppColor.text,
    textAlign: "center",
    letterSpacing: 1.5,
  },

  orderCard: {
    backgroundColor: AppColor.white,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: AppColor.black,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  truckImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  truckName: {
    fontFamily: Primary400,
    fontSize: 16,
  },
  orderItems: {
    color: AppColor.subText,
    fontFamily: Secondary400,
  },
  orderDate: {
    fontFamily: Secondary400,
    fontSize: 12,
    color: AppColor.subText,
  },
  orderTime: {
    fontFamily: Secondary400,
    fontSize: 12,
    color: AppColor.subText,
  },
  itemText: {
    fontFamily: Secondary400,
    fontSize: 13,
    color: AppColor.text,
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  orderTotal: {
    fontFamily: Primary400,
    fontSize: 18,
  },
  trackBtn: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  trackBtnText: {
    color: AppColor.white,
    fontFamily: Secondary400,
    fontSize: 15,
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
    fontFamily: Primary400,
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  totalAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  totalAmountLabel: {
    fontFamily: Primary400,
    fontSize: 16,
  },
  totalAmountValue: {
    fontFamily: Primary400,
    fontSize: 18,
  },
  cancelBtn: {
    backgroundColor: AppColor.snackbarError,
    borderRadius: 5,
    paddingVertical: 14,
    marginBottom: 16,
  },
  cancelBtnText: {
    color: AppColor.white,
    fontFamily: Secondary400,
    fontSize: 16,
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  orderId: {
    fontFamily: Secondary400,
    fontSize: 14,
    color: "#6F6F6F",
  },
  orderDate: {
    fontFamily: Secondary400,
    fontSize: 14,
    color: "#6F6F6F",
  },
  truckRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  truckImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  truckName: {
    fontFamily: Primary400,
    fontSize: 16,
  },
  itemsCount: {
    fontFamily: Secondary400,
    fontSize: 14,
    color: "#6F6F6F",
  },

  orderDetailsTxt: {
    fontFamily: Secondary400,
    fontSize: 14,
  },
  trackBtn: {
    flexDirection: "row",
    borderRadius: 5,
    paddingVertical: 10,
    width: 100,
    justifyContent: "center",
    backgroundColor: AppColor.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  trackBtnText: {
    color: AppColor.white,
    fontFamily: Secondary400,
    fontSize: 15,
  },
  itemsList: {
    marginVertical: 15,
    gap: 15,
  },
  itemText: {
    fontFamily: Secondary400,
    fontSize: 16,
  },
  itemDesc: {
    fontFamily: Secondary400,
    fontSize: 14,
    color: "#1D1D1D",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },
  total: {
    fontFamily: Primary400,
    fontSize: 20,
    marginLeft: 6,
  },
  rateBtn: {
    flexDirection: "row",
    borderRadius: 5,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    width: 100,
    borderColor: AppColor.primary,
    gap: 10,
  },
  rateBtnText: {
    color: AppColor.primary,
    fontFamily: Secondary400,
    fontSize: 15,
  },
  reorderBtn: {
    backgroundColor: AppColor.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  reorderBtnText: {
    color: AppColor.white,
    fontFamily: Secondary400,
    fontSize: 15,
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
});

export default OrderDetailsScreen;
