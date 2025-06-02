import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import { useRoute } from "@react-navigation/native";
import OrderTrackingSteps from "../components/OrderTrackingSteps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const stepsData = [
  { title: "Order Placed", time: "10:19 AM" },
  { title: "Order Accepted", time: "10:20 AM" },
  { title: "Preparing", time: "10:31 AM" },
  { title: "Ready for Pickup", time: "10:40 AM" },
  { title: "Ready for Pickup", time: "10:40 AM" },
];

const OrderTrackingScreen = (props) => {
  const { params } = useRoute();
  const insets = useSafeAreaInsets();

  const order = params?.order;
  // For demo, currentStep is 2 (Preparing)
  const currentStep = 4;
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />

      {/* Header */}
      <View style={styles.headerWrap}>
        <TouchableOpacity
          onPress={() => props.navigation.goBack()}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={28} color={AppColor.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ORDER TRACKING</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.contentWrap]}>
        <Image
          source={require("../assets/images/location.png")}
          style={styles.mapImg}
        />

        <View style={styles.orderCard}>
          <View style={styles.orderCardRow}>
            <Image source={order.image} style={styles.truckImg} />
            <View style={styles.orderCardInfo}>
              <Text style={styles.truckName}>{order.truck}</Text>
              <Text style={styles.orderItems}>{order.items.length} Items</Text>
            </View>
            <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
          </View>
        </View>
        <View style={styles.statusSection}>
          <View style={styles.statusHeaderRow}>
            <Text style={styles.statusLabel}>STATUS</Text>
            <Text style={styles.statusBadge}>
              {stepsData[currentStep].title}
            </Text>
          </View>
          <OrderTrackingSteps steps={stepsData} currentStep={currentStep} />
        </View>
        <View style={styles.estimateSection}>
          <Text style={styles.estimateLabel}>ESTIMATED TIME</Text>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <View style={styles.estimateRow}>
            <Text style={styles.estimateTime}>10:19 AM</Text>
            <Text style={styles.estimateTime}>10:39 AM</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.viewOrder}>View Order</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bottomCard}>
          <View style={styles.bottomCardRow}>
            <Image source={order.image} style={styles.truckImg} />
            <Text style={styles.truckName}>{order.truck}</Text>
            <TouchableOpacity style={styles.phoneBtn}>
              <Image
                source={require("../assets/images/phone.png")}
                style={styles.phoneIcon}
              />
            </TouchableOpacity>
          </View>
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
  headerSpacer: {
    width: 28,
  },
  mapImg: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
    marginBottom: 8,
  },
  orderCard: {
    backgroundColor: AppColor.white,
    borderRadius: 12,
    padding: 16,
  },
  orderCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderCardInfo: {
    flex: 1,
    marginLeft: 10,
  },
  truckImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  truckName: {
    fontFamily: Primary400,
    fontSize: 16,
  },
  orderItems: {
    color: AppColor.subText,
    fontFamily: Secondary400,
  },
  orderTotal: {
    fontFamily: Primary400,
    fontSize: 18,
    marginLeft: 8,
  },
  statusSection: {
    backgroundColor: AppColor.white,
    borderRadius: 12,
    padding: 16,
  },
  statusHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusLabel: {
    fontFamily: Primary400,
    fontSize: 15,
  },
  statusBadge: {
    backgroundColor: AppColor.primaryLight,
    color: AppColor.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    fontFamily: Secondary400,
    fontSize: 13,
  },
  estimateSection: {
    backgroundColor: AppColor.white,
    borderRadius: 12,
    padding: 16,
  },
  estimateLabel: { fontFamily: Primary400, fontSize: 15, marginBottom: 8 },
  progressBar: {
    height: 8,
    backgroundColor: AppColor.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { width: "80%", height: 8, backgroundColor: AppColor.primary },
  estimateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  estimateTime: {
    fontFamily: Secondary400,
    fontSize: 14,
    color: AppColor.grayText,
  },
  viewOrder: {
    color: AppColor.primary,
    fontFamily: Secondary400,
    fontSize: 15,
    marginTop: 4,
  },
  bottomCard: {
    backgroundColor: AppColor.white,
    borderRadius: 12,
    padding: 16,
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
  bottomCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  phoneBtn: {
    marginLeft: "auto",
    backgroundColor: AppColor.primary,
    borderRadius: 20,
    padding: 8,
  },
  phoneIcon: { width: 24, height: 24, tintColor: AppColor.white },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: AppColor.screenBg,
  },
});

export default OrderTrackingScreen;
