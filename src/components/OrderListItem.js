import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { AppColor, Primary400, Secondary400 } from "../utils/theme";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FastImage from "@d11/react-native-fast-image";

const HR = () => <View style={styles.HR} />;

const OrderListItem = ({
  order,
  type,
  onTrack,
  onRate,
  onReorder,
  onDetails,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={onDetails}
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
            <Text style={styles.itemsCount}>{order.items.length} Items</Text>
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
              <Text key={idx} style={styles.itemText}>{`1 x ${itm.name}`}</Text>
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
        {type === "current" ? (
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity style={styles.trackBtn} onPress={onTrack}>
              <FastImage
                source={require("../assets/images/trackOrder.png")}
                style={{ width: 20, height: 20 }}
              />
              <Text style={styles.trackBtnText}>Track</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <TouchableOpacity style={styles.rateBtn} onPress={onRate}>
              <FastImage
                source={require("../assets/images/rateOrder.png")}
                style={{ width: 20, height: 20 }}
              />
              <Text style={styles.rateBtnText}>Rate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.rateBtn} onPress={onReorder}>
              <FastImage
                source={require("../assets/images/reOrder.png")}
                style={{ width: 20, height: 20 }}
              />
              <Text style={styles.rateBtnText}>Reorder</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
});

export default OrderListItem;
