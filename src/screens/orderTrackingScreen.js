import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import { useRoute } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import OrderTrackingSteps from "../components/OrderTrackingSteps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const stepsData = [
  { title: "Order Placed", time: "10:19 AM" },
  { title: "Order Accepted", time: "10:20 AM" },
  { title: "Preparing", time: "10:31 AM" },
  { title: "Ready for Pickup", time: "10:40 AM" },
  { title: "On the Way", time: "10:45 AM" },
  { title: "Delivered", time: "11:00 AM" },
];

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const pickupRegion = {
  latitude: 23.0225,
  longitude: 72.5714,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

const OrderTrackingScreen = (props) => {
  const { params } = useRoute();
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);

  const order = params?.order;
  const currentStep = 3;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />

      <AppHeader headerTitle="ORDER TRACKING" />

      <ScrollView
        style={{
          backgroundColor: AppColor.screenBg,
          padding: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            overflow: "hidden",
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.mapView}
            loadingEnabled={true}
            loadingIndicatorColor={AppColor.primary}
            zoomEnabled={true}
            zoomControlEnabled={true}
            rotateEnabled={false}
            scrollEnabled={false}
            scrollDuringRotateOrZoomEnabled={false}
            pitchEnabled={true}
            region={pickupRegion}
            // onPress={() => openMap(postData.lat, postData.long)}
          >
            <Marker coordinate={pickupRegion} anchor={{ x: 0.5, y: 0.5 }}>
              <Image
                source={require("../assets/images/location.png")}
                style={styles.mapImg}
              />
            </Marker>
          </MapView>
        </View>

        <View style={styles.commonCard}>
          <View style={styles.headerRow}>
            <Text style={styles.orderId}>Order #{order.id}</Text>
            <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
          </View>
          <View style={styles.orderCardRow}>
            <Image source={order.image} style={styles.truckImg} />
            <View style={styles.orderCardInfo}>
              <Text style={styles.truckName}>{order.truck}</Text>
              <Text style={styles.orderItems}>{order.items.length} Items</Text>
            </View>
          </View>
        </View>

        <View style={styles.commonCard}>
          <View style={styles.statusHeaderRow}>
            <Text style={styles.statusLabel}>STATUS</Text>
            <Text style={styles.statusBadge}>
              {stepsData[currentStep].title}
            </Text>
          </View>
          <OrderTrackingSteps steps={stepsData} currentStep={currentStep} />
        </View>

        <View style={styles.commonCard}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignContent: "center",
              marginBottom: 16,
            }}
          >
            <Text style={styles.estimateLabel}>ESTIMATED TIME</Text>

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

        <View style={[styles.commonCard, { marginBottom: 50 }]}>
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColor.white,
  },
  mapImg: {
    width: 30,
    height: 30,
    tintColor: AppColor.primary,
  },
  commonCard: {
    borderWidth: 1,
    borderColor: AppColor.borderColor,
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 10,
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  orderId: {
    fontFamily: Secondary400,
    fontSize: 14,
    color: AppColor.grayText,
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
    width: 50,
    height: 50,
    borderRadius: 25,
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
    fontSize: 20,
  },
  statusHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  statusLabel: {
    fontFamily: Primary400,
    fontSize: 15,
  },
  statusBadge: {
    backgroundColor: "#FC7B0338",
    color: AppColor.primary,
    borderRadius: 8,
    padding: 6,
    fontFamily: Secondary400,
    fontSize: 14,
  },
  estimateLabel: {
    fontFamily: Primary400,
    fontSize: 18,
    marginBottom: 8,
  },
  orderDate: {
    fontFamily: Secondary400,
    fontSize: 12,
    color: AppColor.grayText,
    marginLeft: 5,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    height: 8,
    backgroundColor: AppColor.border,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    width: "50%",
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColor.snackbarSuccess,
  },
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
    fontFamily: Secondary400,
    fontSize: 16,
    marginTop: 10,
  },
  bottomCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  phoneBtn: {
    marginLeft: "auto",
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColor.primary,
    borderRadius: 6,
  },
  phoneIcon: {
    width: 24,
    height: 24,
    tintColor: AppColor.white,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: AppColor.screenBg,
  },
  mapView: {
    height: 200,
  },
});

export default OrderTrackingScreen;
