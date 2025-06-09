import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FastImage from "@d11/react-native-fast-image";
import AppHeader from "../components/AppHeader";

const HR = () => <View style={styles.HR} />;

const OrderDetailsScreen = (props) => {
  const navigation = useNavigation();
  const { params } = useRoute();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const order = params?.order;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />

      <AppHeader headerTitle="ORDER DETAILS" />

      <ScrollView
        style={styles.scrollViewContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrap}>
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.orderId}>Order #{order.id}</Text>
            </View>

            <View style={styles.truckRow}>
              <View style={styles.truckRowLeft}>
                <Image source={order.image} style={styles.truckImg} />
                <View style={styles.truckInfo}>
                  <Text style={styles.truckName}>{order.truck}</Text>
                  <Text style={styles.itemsCount}>
                    {order.items.length} Items
                  </Text>
                </View>
              </View>
              <View style={styles.truckRowRight}>
                <Text style={styles.orderDate}>{order.date}</Text>
                <View style={styles.timeRow}>
                  <MaterialIcons
                    name="access-time"
                    size={14}
                    color={AppColor.grayText}
                    style={styles.timeIcon}
                  />
                  <Text style={styles.orderDate}>{order.time}</Text>
                </View>
              </View>
            </View>
            <HR />
            <View style={styles.itemsList}>
              {order.items.map((itm, idx) => (
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
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
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.trackBtn}
                  onPress={() =>
                    props.navigation.navigate("orderTrackingScreen", {
                      order: order,
                    })
                  }
                >
                  <FastImage
                    source={require("../assets/images/trackOrder.png")}
                    style={styles.actionIcon}
                  />
                  <Text style={styles.trackBtnText}>Track</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.bottomSection}>
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
                <Text style={styles.orderDetailsTxt}>
                  Payment Processing Fee
                </Text>
                <Text style={styles.orderDetailsTxt}>$0.42</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          // paddingVertical: 20,
          // paddingHorizontal: 16,
          padding: 16,
        }}
      >
        <View style={styles.totalAmountRow}>
          <Text style={styles.totalAmountLabel}>TOTAL AMOUNT</Text>
          <Text style={styles.totalAmountValue}>${order.total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.cancelBtn]}
          activeOpacity={0.7}
          onPress={() => {
            setTimeout(() => {
              setLoading(true);
            }, 100);
            setTimeout(() => {
              setLoading(false);
              navigation.navigate("cancelOrderScreen", { order });
            }, 200);
          }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={AppColor.white} />
          ) : (
            <Text style={styles.cancelBtnText}>{"Cancel Order"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
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
    marginBottom: 18,
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
    fontFamily: Secondary400,
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
    fontFamily: Secondary400,
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
    fontFamily: Secondary400,
    fontSize: 14,
    color: "#6F6F6F",
  },
  orderDetailsTxt: {
    fontFamily: Secondary400,
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
