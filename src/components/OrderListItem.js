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
        <View style={styles.truckRowLeft}>
          <Image source={order.image} style={styles.truckImg} />
          <View style={styles.truckInfo}>
            <Text style={styles.truckName}>{order.truck}</Text>
            <Text style={styles.itemsCount}>{order.items.length} Items</Text>
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
              >{`${itm.qty} x ${itm.name}`}</Text>
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
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.trackBtn} onPress={onTrack}>
              <FastImage
                source={require("../assets/images/trackOrder.png")}
                style={styles.actionIcon}
              />
              <Text style={styles.trackBtnText}>Track</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionRowPast}>
            <TouchableOpacity style={styles.rateBtn} onPress={onRate}>
              <FastImage
                source={require("../assets/images/rateOrder.png")}
                style={styles.actionIcon}
              />
              <Text style={styles.rateBtnText}>Rate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rateBtn} onPress={onReorder}>
              <FastImage
                source={require("../assets/images/reOrder.png")}
                style={styles.actionIcon}
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
    color: AppColor.grayText,
  },
  orderDate: {
    fontFamily: Secondary400,
    fontSize: 14,
    color: AppColor.grayText,
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
    color: AppColor.grayText,
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
    color: AppColor.darkText,
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
  HR: {
    height: 1,
    backgroundColor: AppColor.borderColor,
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
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemInfo: {
    gap: 4,
  },
  actionRow: {
    flexDirection: "row",
  },
  actionRowPast: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  actionIcon: {
    width: 20,
    height: 20,
  },
});

export default OrderListItem;
