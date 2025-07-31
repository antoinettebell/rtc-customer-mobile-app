import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  ScrollView,
  Dimensions,
  Pressable,
  Linking,
  Alert,
} from "react-native";
import StatusBarManager from "../components/StatusBarManager";
import { AppColor, Mulish700, Mulish400 } from "../utils/theme";
import { useRoute } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import OrderTrackingSteps from "../components/OrderTrackingSteps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import moment from "moment";
import FastImage from "@d11/react-native-fast-image";
import AppImage from "../components/AppImage";

const statusTitleMap = {
  PLACED: "Order Placed",
  ACCEPTED: "Order Accepted",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for Pickup",
  COMPLETED: "Delivered",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

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

const OrderTrackingScreen = ({ navigation }) => {
  const { params } = useRoute();
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);

  const order = params?.order;
  const [iamstate, setiamstate] = useState([]);

  const getStatusHistory = (statusTime) => {
    const statusMap = {
      placedAt: "PLACED",
      acceptedAt: "ACCEPTED",
      canceledAt: "CANCELLED",
      preparingAt: "PREPARING",
      readyAt: "READY_FOR_PICKUP",
      completedAt: "COMPLETED",
      rejectedAt: "REJECTED",
    };

    const history = Object.entries(statusTime)
      .filter(([, time]) => time !== null)
      .map(([key, time]) => ({
        status: statusMap[key],
        time: time,
      }));

    history.sort((a, b) => new Date(a.time) - new Date(b.time));

    return history;
  };

  const [progress, setProgress] = useState(0);

  const calculateProgress = () => {
    if (order?.statusTime?.readyAt) {
      setProgress(100);
    } else if (order?.statusTime?.preparingAt) {
      const startTime = moment(order.statusTime.preparingAt);
      const finishTime = moment(order.statusTime.preparingAt).add(
        order?.pickupTime || 0,
        "minutes"
      );
      const currentTime = moment();

      if (currentTime.isBefore(finishTime)) {
        const totalDuration = finishTime.diff(startTime);
        const elapsedDuration = currentTime.diff(startTime);
        const calculatedProgress = (elapsedDuration / totalDuration) * 100;
        setProgress(Math.min(Math.max(calculatedProgress, 0), 100));
      } else {
        setProgress(100);
      }
    } else {
      setProgress(0);
    }
  };

  useEffect(() => {
    console.log("order data => ", order);
    setiamstate(getStatusHistory(order?.statusTime));
    calculateProgress();

    // Set up interval to update progress
    let progressInterval;
    if (order?.statusTime?.preparingAt && !order?.statusTime?.readyAt) {
      progressInterval = setInterval(calculateProgress, 30000); // Update every 30 seconds
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [order]);

  const formattedSteps = iamstate.map((item) => ({
    title: statusTitleMap[item.status] || item.status,
    time: new Date(item.time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  // Function to handle the button press and open the phone app
  const handleCallPress = (phoneNumber) => {
    // Construct the URL with the 'tel:' scheme
    const url = `tel:${phoneNumber}`;

    // Check if the device can open the URL
    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          // If not supported, log an error or show a user-friendly message
          console.log("Phone dialing is not supported on this device.");
          // In a real React Native app, you might use an Alert:
          Alert.alert(
            "Error",
            "Phone dialing is not supported on this device."
          );
        } else {
          // If supported, open the URL
          return Linking.openURL(url);
        }
      })
      .catch((err) => console.error("An error occurred", err));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBarManager />

      <AppHeader headerTitle="Order Tracking" />

      <ScrollView
        style={{
          backgroundColor: AppColor.screenBg,
          padding: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Map Container */}
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

        {/* Order Details with FT */}
        <View style={styles.commonCard}>
          <View style={styles.headerRow}>
            <Text style={styles.orderId} numberOfLines={1}>
              Order #{order?.orderNumber || order._id}
            </Text>
            <Text style={styles.orderTotal}>
              ${Number(order.total).toFixed(2)}
            </Text>
          </View>
          <Pressable
            style={styles.orderCardRow}
            onPress={() =>
              navigation.navigate("foodTruckDetailScreen", {
                item: order?.foodTruck,
              })
            }
          >
            <AppImage
              uri={order?.foodTruck?.logo}
              containerStyle={styles.truckImg}
            />
            <View style={styles.orderCardInfo}>
              <Text style={styles.truckName}>{order?.foodTruck?.name}</Text>
              <Text style={styles.orderItems}>
                {order?.items?.length} Items
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Status Container */}
        <View style={styles.commonCard}>
          <View style={styles.statusHeaderRow}>
            <Text style={styles.statusLabel}>{"Status"}</Text>
            <Text style={styles.statusBadge}>
              {formattedSteps.length > 0
                ? formattedSteps[formattedSteps.length - 1].title
                : "..."}
            </Text>
          </View>
          <OrderTrackingSteps steps={formattedSteps} />
        </View>

        {/* Estimated Time Container */}
        <View style={styles.commonCard}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignContent: "center",
              marginBottom: 16,
            }}
          >
            <Text style={styles.estimateLabel}>{"Estimated Time"}</Text>

            <View style={styles.timeRow}>
              <MaterialIcons
                name="access-time"
                size={14}
                color={AppColor.grayText}
                style={styles.timeIcon}
              />
              <Text style={styles.orderDate}>
                {moment(order.statusTime.placedAt).format("hh:mm A")}
              </Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.estimateRow}>
            <Text style={styles.estimateTime}>
              {order.statusTime.preparingAt
                ? moment(order.statusTime.preparingAt).format("hh:mm A")
                : "Not Started Yet"}
            </Text>
            <Text style={styles.estimateTime}>
              {order.statusTime.preparingAt
                ? order.statusTime.readyAt
                  ? moment(order.statusTime.readyAt).format("hh:mm A")
                  : moment(order.statusTime.preparingAt)
                      .add(order?.pickupTime || 0, "minutes")
                      .format("hh:mm A")
                : null}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              console.log("order data => ", order);
              navigation.navigate("orderDetailsScreen", { orderId: order._id });
            }}
          >
            <Text style={styles.viewOrder}>View Order</Text>
          </TouchableOpacity>
        </View>

        {/* Call Vendor Container */}
        <View style={[styles.commonCard, { marginBottom: 50 }]}>
          <View style={styles.bottomCardRow}>
            <AppImage
              uri={order?.foodTruck?.logo}
              containerStyle={styles.truckImg}
            />
            <Text style={styles.truckName}>{order?.foodTruck?.name}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.phoneBtn}
              onPress={() =>
                handleCallPress(
                  `${order?.vendor?.countryCode}${order?.vendor?.mobileNumber}`
                )
              }
            >
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
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.grayText,
  },
  orderCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderCardInfo: {
    flex: 1,
    marginLeft: 10,
  },
  truckImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  truckName: {
    fontFamily: Mulish700,
    fontSize: 16,
  },
  orderItems: {
    color: AppColor.subText,
    fontFamily: Mulish400,
  },
  orderTotal: {
    fontFamily: Mulish700,
    fontSize: 20,
  },
  statusHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  statusLabel: {
    fontFamily: Mulish700,
    fontSize: 15,
  },
  statusBadge: {
    backgroundColor: "#FC7B0338",
    color: AppColor.primary,
    borderRadius: 8,
    padding: 6,
    fontFamily: Mulish400,
    fontSize: 14,
  },
  estimateLabel: {
    fontFamily: Mulish700,
    fontSize: 18,
    marginBottom: 8,
  },
  orderDate: {
    fontFamily: Mulish400,
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
    borderRadius: 4,
  },
  progressFill: {
    width: "0%",
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
    fontFamily: Mulish400,
    fontSize: 14,
    color: AppColor.grayText,
  },
  viewOrder: {
    fontFamily: Mulish400,
    fontSize: 16,
    marginTop: 10,
  },
  bottomCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
